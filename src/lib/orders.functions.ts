import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const DELIVERY_FEE = 400;
const QUANTITY_EPSILON = 1e-6;

const payloadSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(6).max(30),
    address: z.string().trim().max(300).optional().or(z.literal("")),
    comment: z.string().max(500).optional().or(z.literal("")),
    deliveryDay: z.enum(["thursday", "friday", "saturday"]),
    shippingMethod: z.enum(["delivery", "pickup"]),
    windowId: z.string().uuid(),
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

export const createOrder = createServerFn({ method: "POST" })
  .validator((data: unknown) => payloadSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();

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

    // Optional auth: attach the order to a signed-in user when a valid bearer token is present.
    let userId: string | null = null;
    try {
      const token = getRequest()?.headers.get("authorization")?.replace(/^Bearer /, "");
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
