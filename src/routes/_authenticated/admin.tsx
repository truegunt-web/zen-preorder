import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Database } from "@/integrations/supabase/types";

type ProductCategory = Database["public"]["Enums"]["product_category"];
type ProductUnit = Database["public"]["Enums"]["unit_of_measure"];
import { Pencil, Plus, Trash2, LogOut, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_LABEL, UNIT_LABEL, formatPrice } from "@/lib/cart";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  description: string | null;
  price: number;
  unit: ProductUnit;
  min_order: number;
  step: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

const CATEGORIES = [
  "fish_chilled",
  "fish_salted",
  "fish_smoked",
  "caviar",
  "seafood",
  "marinades",
  "semifinished",
  "canned",
];

const UNITS = ["pcs", "kg", "g", "pack"];

function AdminPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [filter, setFilter] = useState("all");

  const productsQ = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить товар?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Удалено");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    }
  };

  const toggleActive = async (p: Product) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const products = (productsQ.data ?? []).filter(
    (p) => filter === "all" || p.category === filter,
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <ArrowLeft className="mr-1 h-4 w-4" /> К витрине
              </Link>
            </Button>
            <h1 className="text-lg font-bold">Админка каталога</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-1 h-4 w-4" /> Выйти
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABEL[c] ?? c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {products.length} товаров
            </span>
          </div>
          <Button
            onClick={() =>
              setEditing({
                name: "",
                category: "fish_chilled",
                description: "",
                price: 0,
                unit: "pcs",
                min_order: 1,
                step: 1,
                image_url: "",
                is_active: true,
                sort_order: 100,
              })
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Добавить товар
          </Button>
        </div>

        {productsQ.isLoading ? (
          <div className="text-muted-foreground">Загрузка…</div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left">
                  <tr>
                    <th className="p-3">Фото</th>
                    <th className="p-3">Название</th>
                    <th className="p-3">Категория</th>
                    <th className="p-3 text-right">Цена</th>
                    <th className="p-3">Ед.</th>
                    <th className="p-3">Активен</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-3">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted" />
                        )}
                      </td>
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-muted-foreground">
                        {CATEGORY_LABEL[p.category] ?? p.category}
                      </td>
                      <td className="p-3 text-right">{formatPrice(Number(p.price))}</td>
                      <td className="p-3">{UNIT_LABEL[p.unit] ?? p.unit}</td>
                      <td className="p-3">
                        <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => remove(p.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>

      <ProductEditor
        product={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          qc.invalidateQueries({ queryKey: ["admin-products"] });
        }}
      />
    </div>
  );
}

function ProductEditor({
  product,
  onClose,
  onSaved,
}: {
  product: Partial<Product> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});

  // sync when opened
  const open = !!product;
  if (product && form !== product && !("__synced" in (form as object))) {
    // one-time sync when dialog opens with a new product
  }

  const setField = <K extends keyof Product>(k: K, v: Product[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // reset form when product identity changes
  const key = product?.id ?? "new";
  useSyncForm(key, product, setForm);

  const save = async () => {
    setSaving(true);
    try {
      const name = form.name?.trim();
      if (!name) throw new Error("Введите название");
      const payload = {
        name,
        category: (form.category ?? "fish_chilled") as Product["category"],
        description: form.description ?? null,
        price: Number(form.price),
        unit: (form.unit ?? "pcs") as Product["unit"],
        min_order: Number(form.min_order),
        step: Number(form.step),
        image_url: form.image_url?.trim() || null,
        is_active: form.is_active ?? true,
        sort_order: Number(form.sort_order ?? 100),
      };
      if (product?.id) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id);
        if (error) throw error;
        toast.success("Сохранено");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Добавлено");
      }
      onSaved();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product?.id ? "Редактировать товар" : "Новый товар"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Название</Label>
            <Input
              value={form.name ?? ""}
              onChange={(e) => setField("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Категория</Label>
            <Select
              value={form.category ?? "fish_chilled"}
              onValueChange={(v) => setField("category", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABEL[c] ?? c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ед. измерения</Label>
            <Select value={form.unit ?? "pcs"} onValueChange={(v) => setField("unit", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {UNIT_LABEL[u] ?? u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Цена, ₽</Label>
            <Input
              type="number"
              value={form.price ?? 0}
              onChange={(e) => setField("price", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Мин. заказ</Label>
            <Input
              type="number"
              step="0.1"
              value={form.min_order ?? 1}
              onChange={(e) => setField("min_order", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Шаг</Label>
            <Input
              type="number"
              step="0.1"
              value={form.step ?? 1}
              onChange={(e) => setField("step", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Порядок сортировки</Label>
            <Input
              type="number"
              value={form.sort_order ?? 100}
              onChange={(e) => setField("sort_order", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>URL картинки</Label>
            <Input
              placeholder="/catalog/fish_chilled.jpg или https://…"
              value={form.image_url ?? ""}
              onChange={(e) => setField("image_url", e.target.value)}
            />
            {form.image_url && (
              <img
                src={form.image_url}
                alt=""
                className="mt-2 h-24 w-24 rounded object-cover"
              />
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Описание</Label>
            <Textarea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Switch
              checked={form.is_active ?? true}
              onCheckedChange={(v) => setField("is_active", v)}
            />
            <Label>Показывать в каталоге</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Сохранение…" : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function useSyncForm(
  key: string,
  product: Partial<Product> | null,
  setForm: (f: Partial<Product>) => void,
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (lastKey !== key) {
    setLastKey(key);
    setForm(product ?? {});
  }
}
