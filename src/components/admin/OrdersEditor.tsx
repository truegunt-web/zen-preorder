import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { DELIVERY_DAY_LABEL, UNIT_LABEL, formatPrice } from "@/lib/cart";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type Unit = Database["public"]["Enums"]["unit_of_measure"];

export const ORDER_STATUS_LABEL: Record<string, string> = {
  new: "Новый",
  confirmed: "В работе",
  modified: "В работе",
  completed: "Отгружен",
  cancelled: "Отменён",
};

const STATUS_OPTIONS: OrderStatus[] = ["new", "confirmed", "completed", "cancelled"];

const STATUS_CLASS: Record<string, string> = {
  new: "bg-accent/15 text-accent-foreground",
  confirmed: "bg-primary/15 text-primary",
  modified: "bg-primary/15 text-primary",
  completed: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

type OrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  unit: Unit;
  quantity: number;
  price: number;
  comment: string | null;
};

type Order = {
  id: string;
  order_number: number;
  status: OrderStatus;
  delivery_day: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  comment: string | null;
  total: number;
  created_at: string;
  order_items: OrderItem[];
};

export function OrdersEditor() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const ordersQ = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });

  const productsQ = useQuery({
    queryKey: ["admin-products-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, unit, min_order")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-orders"] });

  const recalcTotal = async (orderId: string) => {
    const { data } = await supabase.from("order_items").select("quantity, price").eq("order_id", orderId);
    const total = (data ?? []).reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
    await supabase.from("orders").update({ total }).eq("id", orderId);
  };

  const setStatus = async (order: Order, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Заявка №${order.order_number}: ${ORDER_STATUS_LABEL[status]}`);
      refresh();
    }
  };

  const updateItem = async (item: OrderItem, patch: Partial<OrderItem>, orderId: string) => {
    const { error } = await supabase.from("order_items").update(patch).eq("id", item.id);
    if (error) return toast.error(error.message);
    await recalcTotal(orderId);
    refresh();
  };

  const removeItem = async (item: OrderItem, orderId: string) => {
    if (!confirm(`Удалить позицию «${item.product_name}»?`)) return;
    const { error } = await supabase.from("order_items").delete().eq("id", item.id);
    if (error) return toast.error(error.message);
    await recalcTotal(orderId);
    toast.success("Позиция удалена");
    refresh();
  };

  const addItem = async (orderId: string, productId: string) => {
    const p = (productsQ.data ?? []).find((x) => x.id === productId);
    if (!p) return;
    const { error } = await supabase.from("order_items").insert({
      order_id: orderId,
      product_id: p.id,
      product_name: p.name,
      unit: p.unit as Unit,
      quantity: Number(p.min_order) || 1,
      price: Number(p.price),
    });
    if (error) return toast.error(error.message);
    await recalcTotal(orderId);
    toast.success("Позиция добавлена");
    refresh();
  };

  const removeOrder = async (order: Order) => {
    if (!confirm(`Удалить заявку №${order.order_number}?`)) return;
    await supabase.from("order_items").delete().eq("order_id", order.id);
    const { error } = await supabase.from("orders").delete().eq("id", order.id);
    if (error) return toast.error(error.message);
    toast.success("Заявка удалена");
    refresh();
  };

  const orders = (ordersQ.data ?? []).filter((o) => statusFilter === "all" || o.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{orders.length} заявок</span>
      </div>

      {ordersQ.isLoading ? (
        <div className="text-muted-foreground">Загрузка…</div>
      ) : orders.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">Заявок пока нет</Card>
      ) : (
        orders.map((o) => {
          const open = openId === o.id;
          return (
            <Card key={o.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 p-4">
                <button
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => setOpenId(open ? null : o.id)}
                >
                  {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                  <div className="min-w-0">
                    <div className="font-semibold">
                      №{o.order_number} · {o.customer_name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {o.customer_phone} · {DELIVERY_DAY_LABEL[o.delivery_day] ?? o.delivery_day} ·{" "}
                      {new Date(o.created_at).toLocaleString("ru-RU")}
                    </div>
                  </div>
                </button>
                <Badge className={STATUS_CLASS[o.status]} variant="secondary">
                  {ORDER_STATUS_LABEL[o.status]}
                </Badge>
                <div className="font-bold">{formatPrice(Number(o.total))}</div>
                <Select value={STATUS_OPTIONS.includes(o.status) ? o.status : "confirmed"} onValueChange={(v) => setStatus(o, v as OrderStatus)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ORDER_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => removeOrder(o)} aria-label="Удалить заявку">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              {open && (
                <div className="space-y-4 border-t bg-muted/30 p-4">
                  <div className="grid gap-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Адрес: </span>
                      {o.address}
                    </div>
                    {o.comment && (
                      <div>
                        <span className="text-muted-foreground">Комментарий: </span>
                        {o.comment}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {o.order_items.map((it) => (
                      <div key={it.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-background p-2">
                        <div className="min-w-40 flex-1 text-sm font-medium">{it.product_name}</div>
                        <Input
                          type="number"
                          step="0.1"
                          defaultValue={Number(it.quantity)}
                          onBlur={(e) => {
                            const q = Number(e.target.value);
                            if (q > 0 && q !== Number(it.quantity)) updateItem(it, { quantity: q }, o.id);
                          }}
                          className="w-24"
                        />
                        <span className="text-xs text-muted-foreground">{UNIT_LABEL[it.unit] ?? it.unit}</span>
                        <Input
                          type="number"
                          defaultValue={Number(it.price)}
                          onBlur={(e) => {
                            const p = Number(e.target.value);
                            if (p >= 0 && p !== Number(it.price)) updateItem(it, { price: p }, o.id);
                          }}
                          className="w-28"
                        />
                        <span className="text-xs text-muted-foreground">₽</span>
                        <div className="w-24 text-right text-sm font-semibold">
                          {formatPrice(Number(it.price) * Number(it.quantity))}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(it, o.id)} aria-label="Удалить позицию">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Select value="" onValueChange={(v) => addItem(o.id, v)}>
                      <SelectTrigger className="w-72">
                        <SelectValue placeholder="Добавить позицию…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(productsQ.data ?? []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — {formatPrice(Number(p.price))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
