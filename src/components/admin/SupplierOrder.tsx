import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { DELIVERY_DAY_LABEL, UNIT_LABEL, formatPrice } from "@/lib/cart";
import { ORDER_STATUS_LABEL } from "@/components/admin/OrdersEditor";

type Item = {
  product_name: string;
  unit: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  order_number: number;
  status: string;
  delivery_day: string;
  customer_name: string;
  created_at: string;
  order_items: Item[];
};

function fmtQty(n: number) {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3)));
}

export function SupplierOrder() {
  const [selected, setSelected] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("active");
  const [dayFilter, setDayFilter] = useState("all");
  const [copied, setCopied] = useState(false);

  const ordersQ = useQuery({
    queryKey: ["supplier-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, delivery_day, customer_name, created_at, order_items(product_name, unit, quantity, price)")
        .order("order_number", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });

  const orders = useMemo(
    () =>
      (ordersQ.data ?? []).filter((o) => {
        const statusOk =
          statusFilter === "all"
            ? true
            : statusFilter === "active"
              ? o.status !== "cancelled" && o.status !== "completed"
              : o.status === statusFilter;
        const dayOk = dayFilter === "all" || o.delivery_day === dayFilter;
        return statusOk && dayOk;
      }),
    [ordersQ.data, statusFilter, dayFilter],
  );

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const allSelected = orders.length > 0 && orders.every((o) => selected.includes(o.id));
  const toggleAll = () =>
    setSelected(allSelected ? [] : orders.map((o) => o.id));

  const rows = useMemo(() => {
    const map = new Map<string, { name: string; unit: string; qty: number; sum: number }>();
    (ordersQ.data ?? [])
      .filter((o) => selected.includes(o.id))
      .forEach((o) =>
        o.order_items.forEach((it) => {
          const key = `${it.product_name}__${it.unit}`;
          const prev = map.get(key) ?? { name: it.product_name, unit: it.unit, qty: 0, sum: 0 };
          prev.qty += Number(it.quantity);
          prev.sum += Number(it.quantity) * Number(it.price);
          map.set(key, prev);
        }),
      );
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [ordersQ.data, selected]);

  const totalSum = rows.reduce((s, r) => s + r.sum, 0);

  const selectedNumbers = (ordersQ.data ?? [])
    .filter((o) => selected.includes(o.id))
    .map((o) => o.order_number)
    .sort((a, b) => a - b);

  const plainText = useMemo(() => {
    if (rows.length === 0) return "";
    const head = `Заказ поставщику\nЗаявки: ${selectedNumbers.map((n) => `№${n}`).join(", ")}\n`;
    const body = rows
      .map((r, i) => `${i + 1}. ${r.name} — ${fmtQty(r.qty)} ${UNIT_LABEL[r.unit] ?? r.unit}`)
      .join("\n");
    return `${head}\n${body}\n\nПозиций: ${rows.length}`;
  }, [rows, selectedNumbers]);

  const copy = async () => {
    if (!plainText) return toast.error("Выберите хотя бы одну заявку");
    try {
      await navigator.clipboard.writeText(plainText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = plainText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    toast.success("Таблица скопирована — можно вставлять в мессенджер");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="new">Новые</SelectItem>
              <SelectItem value="confirmed">В работе</SelectItem>
              <SelectItem value="completed">Отгружен</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dayFilter} onValueChange={setDayFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все дни</SelectItem>
              <SelectItem value="thursday">Четверг</SelectItem>
              <SelectItem value="friday">Пятница</SelectItem>
              <SelectItem value="saturday">Суббота</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {allSelected ? "Снять все" : "Выбрать все"}
          </Button>
        </div>

        {ordersQ.isLoading ? (
          <div className="text-muted-foreground">Загрузка…</div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">Заявок нет</div>
        ) : (
          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {orders.map((o) => (
              <label
                key={o.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
              >
                <Checkbox checked={selected.includes(o.id)} onCheckedChange={() => toggle(o.id)} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    №{o.order_number} · {o.customer_name}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {DELIVERY_DAY_LABEL[o.delivery_day] ?? o.delivery_day} ·{" "}
                    {o.order_items.length} поз. ·{" "}
                    {new Date(o.created_at).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <Badge variant="secondary">{ORDER_STATUS_LABEL[o.status] ?? o.status}</Badge>
              </label>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-semibold">Сводная таблица</div>
            <div className="text-xs text-muted-foreground">
              {selectedNumbers.length > 0
                ? `Заявки: ${selectedNumbers.map((n) => `№${n}`).join(", ")}`
                : "Отметьте заявки слева"}
            </div>
          </div>
          <Button onClick={copy} disabled={rows.length === 0} size="sm">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            Копировать
          </Button>
        </div>

        {rows.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Выберите заявки, чтобы получить итоговое количество по каждой позиции
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left font-medium">#</th>
                    <th className="p-2 text-left font-medium">Позиция</th>
                    <th className="p-2 text-right font-medium">Кол-во</th>
                    <th className="p-2 text-left font-medium">Ед.</th>
                    <th className="p-2 text-right font-medium">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.name + r.unit} className="border-t">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2">{r.name}</td>
                      <td className="p-2 text-right font-semibold">{fmtQty(r.qty)}</td>
                      <td className="p-2 text-muted-foreground">{UNIT_LABEL[r.unit] ?? r.unit}</td>
                      <td className="p-2 text-right">{formatPrice(r.sum)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/30 font-semibold">
                    <td className="p-2" colSpan={4}>
                      Итого · {rows.length} позиций
                    </td>
                    <td className="p-2 text-right">{formatPrice(totalSum)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4">
              <div className="mb-1 text-xs text-muted-foreground">
                Текст для мессенджера (можно выделить и скопировать вручную)
              </div>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">
{plainText}
              </pre>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
