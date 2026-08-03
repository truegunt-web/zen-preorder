import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const DELIVERY_FEE = 400;

const payloadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(30),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  comment: z.string().max(500).optional().or(z.literal("")),
  deliveryDay: z.enum(["thursday", "friday", "saturday"]),
  shippingMethod: z.enum(["delivery", "pickup"]),
  windowId: z.string().uuid().nullable().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().positive().max(1000),
        comment: z.string().max(300).optional().or(z.literal("")),
      }),
    )
    .min(1)
    .max(100),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => payloadSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

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

    const ids = data.items.map((i) => i.productId);
    const { data: products, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, name, price, unit, is_active")
      .in("id", ids);
    if (prodErr) throw new Error(prodErr.message);

    const rows = data.items.map((item) => {
      const product = products?.find((p) => p.id === item.productId);
      if (!product || !product.is_active) throw new Error("Товар недоступен");
      return {
        product_id: product.id,
        product_name: product.name,
        unit: product.unit,
        quantity: item.quantity,
        price: Number(product.price),
        comment: item.comment || null,
      };
    });

    const itemsTotal = rows.reduce((sum, r) => sum + r.price * r.quantity, 0);
    const total = itemsTotal + (data.shippingMethod === "delivery" ? DELIVERY_FEE : 0);

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        window_id: data.windowId ?? null,
        delivery_day: data.deliveryDay,
        customer_name: data.name,
        customer_phone: data.phone,
        customer_email: null,
        address: data.shippingMethod === "delivery" ? (data.address ?? "") : "Самовывоз",
        comment: data.comment || null,
        total,
      })
      .select("id, order_number")
      .single();
    if (orderErr) throw new Error(orderErr.message);

    const { error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(rows.map((r) => ({ ...r, order_id: order.id })));
    if (itemsErr) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error(itemsErr.message);
    }

    return { orderNumber: order.order_number as number };
  });
