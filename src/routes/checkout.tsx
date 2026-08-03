import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { createOrder } from "@/lib/orders.functions";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DELIVERY_DAY_LABEL, UNIT_LABEL, formatPrice, useCart } from "@/lib/cart";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

const DELIVERY_FEE = 400;

const schema = z.object({
  name: z.string().trim().min(2, "Укажите имя").max(100),
  phone: z.string().trim().min(6, "Укажите телефон").max(30),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  comment: z.string().max(500).optional(),
  deliveryDay: z.enum(["thursday", "friday", "saturday"], { message: "Выберите день доставки" }),
  shippingMethod: z.enum(["delivery", "pickup"], { message: "Выберите способ получения" }),
});

function CheckoutPage() {
  const { items, total: itemsTotal, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", comment: "", deliveryDay: "", shippingMethod: "delivery" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const deliveryFee = form.shippingMethod === "delivery" ? DELIVERY_FEE : 0;
  const total = itemsTotal + deliveryFee;

  const windowQ = useQuery({
    queryKey: ["active-window"],
    queryFn: async () => {
      const { data } = await supabase
        .from("preorder_windows")
        .select("*")
        .eq("is_active", true)
        .lte("opens_at", new Date().toISOString())
        .gte("closes_at", new Date().toISOString())
        .order("closes_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const deliveryDays = useMemo(() => (windowQ.data?.delivery_days ?? ["thursday", "friday", "saturday"]) as string[], [
    windowQ.data,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Корзина пуста");
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return;
    }
    if (parsed.data.shippingMethod === "delivery" && (!parsed.data.address || parsed.data.address.trim().length < 5)) {
      setErrors({ address: "Укажите адрес доставки" });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const { orderNumber } = await submitOrder({
        data: {
          name: parsed.data.name,
          phone: parsed.data.phone,
          address: parsed.data.address ?? "",
          comment: parsed.data.comment ?? "",
          deliveryDay: parsed.data.deliveryDay,
          shippingMethod: parsed.data.shippingMethod,
          windowId: windowQ.data?.id ?? null,
          items: items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            comment: it.comment || "",
          })),
        },
      });

      clear();
      toast.success(`Заявка №${orderNumber} принята`);
      navigate({ to: "/order-success", search: { n: orderNumber } });
    } catch (err) {
      console.error(err);
      toast.error("Не удалось оформить заявку", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Назад в каталог
        </Link>
        <h1 className="mb-6 text-3xl font-bold">Оформление заявки</h1>

        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Корзина пуста.</p>
            <Button asChild className="mt-4">
              <Link to="/">В каталог</Link>
            </Button>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Контакты</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Имя *</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Телефон *</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" placeholder="+7 ..." />
                    {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Получение</h2>
                <div className="mb-4">
                  <Label>Способ получения *</Label>
                  <RadioGroup
                    value={form.shippingMethod}
                    onValueChange={(v) => setForm({ ...form, shippingMethod: v })}
                    className="mt-2 grid grid-cols-2 gap-2"
                  >
                    <label
                      className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 p-4 transition ${
                        form.shippingMethod === "delivery" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                      }`}
                    >
                      <RadioGroupItem value="delivery" className="sr-only" />
                      <span className="text-sm font-semibold">Доставка</span>
                      <span className="text-[11px] text-muted-foreground">400 ₽ по Истринскому району</span>
                    </label>
                    <label
                      className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 p-4 transition ${
                        form.shippingMethod === "pickup" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                      }`}
                    >
                      <RadioGroupItem value="pickup" className="sr-only" />
                      <span className="text-sm font-semibold">Самовывоз</span>
                    </label>
                  </RadioGroup>
                </div>
                <div className="mb-4">
                  <Label>День {form.shippingMethod === "delivery" ? "доставки" : "получения"} *</Label>
                  <RadioGroup
                    value={form.deliveryDay}
                    onValueChange={(v) => setForm({ ...form, deliveryDay: v })}
                    className="mt-2 grid grid-cols-3 gap-2"
                  >
                    {deliveryDays.map((d) => (
                      <label
                        key={d}
                        className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 p-4 transition ${
                          form.deliveryDay === d ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                        }`}
                      >
                        <RadioGroupItem value={d} className="sr-only" />
                        <span className="text-sm font-semibold">{DELIVERY_DAY_LABEL[d]}</span>
                      </label>
                    ))}
                  </RadioGroup>
                  {errors.deliveryDay && <p className="mt-1 text-xs text-destructive">{errors.deliveryDay}</p>}
                </div>
                {form.shippingMethod === "delivery" && (
                  <div>
                    <Label htmlFor="address">Адрес доставки *</Label>
                    <Textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1" rows={2} />
                    {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address}</p>}
                  </div>
                )}
                <div className="mt-4">
                  <Label htmlFor="comment">Комментарий к заказу</Label>
                  <Textarea id="comment" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} className="mt-1" rows={3} placeholder="Время доставки, пожелания…" />
                </div>
              </Card>

            </div>

            <div className="lg:sticky lg:top-24 lg:h-fit">
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Ваш заказ</h2>
                <ul className="mb-4 max-h-72 space-y-2 overflow-y-auto text-sm">
                  {items.map((it) => (
                    <li key={it.productId} className="flex justify-between gap-2 border-b pb-2 last:border-0">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{it.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {it.quantity} {UNIT_LABEL[it.unit]} × {formatPrice(it.price)}
                        </div>
                        {it.comment && <div className="mt-0.5 text-xs italic text-muted-foreground">«{it.comment}»</div>}
                      </div>
                      <div className="shrink-0 font-semibold">{formatPrice(it.price * it.quantity)}</div>
                    </li>
                  ))}
                </ul>
                <div className="mb-2 flex items-center justify-between border-t pt-4 text-sm">
                  <span className="text-muted-foreground">Товары</span>
                  <span>{formatPrice(itemsTotal)}</span>
                </div>
                {form.shippingMethod === "delivery" && (
                  <div className="mb-2 flex items-start justify-between text-sm">
                    <div>
                      <div>Доставка</div>
                      <div className="text-[11px] text-muted-foreground">400 ₽ по Истринскому району</div>
                    </div>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t pt-4 text-lg font-bold">
                  <span>Итого</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Конечная стоимость будет рассчитана после сборки заказа.
                </p>
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Отправить заявку
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Оплата при получении. Мы свяжемся с вами для подтверждения.
                </p>
              </Card>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
