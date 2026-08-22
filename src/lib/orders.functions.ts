import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const DELIVERY_FEE = 400;
const QUANTITY_EPSILON = 1e-6;
const MIN_FORM_FILL_MS = 3_000;
const MAX_FORM_AGE_MS = 2 * 60 * 60 * 1_000;
const RATE_LIMIT_MESSAGE = "Не удалось отправить заявку. Попробуйте позже.";

const payloadSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(6).max(30),
    address: z.string().trim().max(300).optional().or(z.literal("")),
    comment: z.string().max(500).optional().or(z.literal("")),
    deliveryDay: z.enum(["thursday", "friday", "saturday"]),
    shippingMethod: z.enum(["delivery", "pickup"]),
    windowId: z.string().uuid(),
    website: z.string().max(200).optional().or(z.literal("")),
    formStartedAt: z.number().int().positive(),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().finite().positive().max(1000),
          comment: z.string().max(300).optional().or(z.literal("")),
        }),
      )
      .min(1)
      .max(100),
  })
  .superRefine((data, ctx) => {
    if (data.shippingMethod === "delivery" && (!data.address || data.address.trim().length < 5)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "Укажите адрес доставки",
      });
    }

    if (new Set(data.items.map((item) => item.productId)).size !== data.items.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "Товар не должен повторяться в заказе",
      });
    }
  });

function quantityMatchesRules(quantity: number, minOrder: number, step: number) {
  if (!Number.isFinite(minOrder) || !Number.isFinite(step) || minOrder <= 0 || step <= 0) {
    return false;
  }

  if (quantity + QUANTITY_EPSILON < minOrder) return false;
  const steps = (quantity - minOrder) / step;
  return Math.abs(steps - Math.round(steps)) <= QUANTITY_EPSILON;
}

function getClientIp(request: Request | undefined) {
  if (!request) return null;

  const netlifyIp = request.headers.get("x-nf-client-connection-ip")?.trim();
  if (netlifyIp) return netlifyIp;

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;

  return request.headers.get("x-real-ip")?.trim() || null;
}

async function hmacIdentifier(namespace: string, value: string) {
  const secret = process.env.ORDER_RATE_LIMIT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Rate-limit secret is not configured");

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${namespace}:${value}`));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function consumeRateLimit(
  supabaseAdmin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"],
  keyHash: string,
  limit: number,
  windowSeconds: number,
) {
  const { data, error } = await supabaseAdmin.rpc("consume_order_rate_limit", {
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) throw new Error("Rate-limit check failed");
  return data;
}

export const createOrder = createServerFn({ method: "POST" })
  .validator((data: unknown) => payloadSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const request = getRequest();
    const nowMs = Date.now();
    const formAge = nowMs - data.formStartedAt;

    if (data.website || formAge < MIN_FORM_FILL_MS || formAge > MAX_FORM_AGE_MS) {
      throw new Error(RATE_LIMIT_MESSAGE);
    }

    const now = new Date(nowMs).toISOString();
    const { data: preorderWindow, error: windowError } = await supabaseAdmin
      .from("preorder_windows")
      .select("id, delivery_days")
      .eq("id", data.windowId)
      .eq("is_active", true)
      .lte("opens_at", now)
      .gte("closes_at", now)
      .maybeSingle();

    if (windowError) throw new Error("Не удалось проверить окно предзаказа");
    if (!preorderWindow) throw new Error("Приём заявок закрыт");
    if (!preorderWindow.delivery_days.includes(data.deliveryDay)) {
      throw new Error("Выбранный день доставки недоступен");
    }

    const normalizedPhone = data.phone.replace(/\D/g, "");
    const phoneKey = await hmacIdentifier("phone", normalizedPhone);
    const phoneAllowed = await consumeRateLimit(supabaseAdmin, phoneKey, 3, 30 * 60);
    if (!phoneAllowed) throw new Error(RATE_LIMIT_MESSAGE);

    const clientIp = getClientIp(request);
    if (clientIp) {
      const ipKey = await hmacIdentifier("ip", clientIp);
      const ipAllowed = await consumeRateLimit(supabaseAdmin, ipKey, 8, 15 * 60);
      if (!ipAllowed) throw new Error(RATE_LIMIT_MESSAGE);
    }

    // Optional auth: attach the order to a signed-in user when a valid bearer token is present.
    let userId: string | null = null;
    try {
      const token = request?.headers.get("authorization")?.replace(/^Bearer /, "");
      if (token && token.split(".").length === 3) {
        const { data: claims } = await supabaseAdmin.auth.getClaims(token);
        userId = (claims?.claims?.sub as string | undefined) ?? null;
      }
    } catch {
      userId = null;
    }

    const ids = data.items.map((item) => item.productId);
    const { data: products, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, name, price, unit, min_order, step, is_active")
      .in("id", ids);
    if (prodErr) throw new Error("Не удалось проверить товары");

    const rows = data.items.map((item) => {
      const product = products?.find((candidate) => candidate.id === item.productId);
      if (!product || !product.is_active) throw new Error("Товар недоступен");

      const minOrder = Number(product.min_order);
      const step = Number(product.step);
      if (!quantityMatchesRules(item.quantity, minOrder, step)) {
        throw new Error(
          `Некорректное количество для «${product.name}». Минимум: ${minOrder}, шаг: ${step}`,
        );
      }

      return {
        product_id: product.id,
        product_name: product.name,
        unit: product.unit,
        quantity: item.quantity,
        price: Number(product.price),
        comment: item.comment || null,
      };
    });

    const itemsTotal = rows.reduce((sum, row) => sum + row.price * row.quantity, 0);
    const total = itemsTotal + (data.shippingMethod === "delivery" ? DELIVERY_FEE : 0);

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        window_id: preorderWindow.id,
        delivery_day: data.deliveryDay,
        customer_name: data.name,
        customer_phone: data.phone,
        customer_email: null,
        address: data.shippingMethod === "delivery" ? data.address!.trim() : "Самовывоз",
        comment: data.comment || null,
        total,
      })
      .select("id, order_number")
      .single();
    if (orderErr) throw new Error("Не удалось создать заявку");

    const { error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(rows.map((row) => ({ ...row, order_id: order.id })));
    if (itemsErr) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error("Не удалось сохранить состав заявки");
    }

    return { orderNumber: order.order_number as number };
  });
