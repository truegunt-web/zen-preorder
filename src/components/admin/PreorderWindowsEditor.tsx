import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

type DeliveryDay = "thursday" | "friday" | "saturday";
type PreorderWindow = {
  id: string;
  title: string;
  description: string | null;
  opens_at: string;
  closes_at: string;
  delivery_days: DeliveryDay[];
  is_active: boolean;
};

const DAY_LABEL: Record<DeliveryDay, string> = {
  thursday: "чт",
  friday: "пт",
  saturday: "сб",
};
const DAY_FROM_LABEL: Record<string, DeliveryDay> = {
  чт: "thursday",
  пт: "friday",
  сб: "saturday",
  thursday: "thursday",
  friday: "friday",
  saturday: "saturday",
};


const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function PreorderWindowsEditor() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<PreorderWindow> | null>(null);

  const q = useQuery({
    queryKey: ["admin-windows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("preorder_windows")
        .select("*")
        .order("opens_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PreorderWindow[];
    },
  });

  const toggle = useMutation({
    mutationFn: async (w: PreorderWindow) => {
      const { error } = await supabase
        .from("preorder_windows")
        .update({ is_active: !w.is_active })
        .eq("id", w.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-windows"] });
      qc.invalidateQueries({ queryKey: ["active-window"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("preorder_windows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Удалено");
      qc.invalidateQueries({ queryKey: ["admin-windows"] });
      qc.invalidateQueries({ queryKey: ["active-window"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const extend = useMutation({
    mutationFn: async ({ w, hours }: { w: PreorderWindow; hours: number }) => {
      const newClose = new Date(new Date(w.closes_at).getTime() + hours * 3600 * 1000).toISOString();
      const { error } = await supabase
        .from("preorder_windows")
        .update({ closes_at: newClose, is_active: true })
        .eq("id", w.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Продлено");
      qc.invalidateQueries({ queryKey: ["admin-windows"] });
      qc.invalidateQueries({ queryKey: ["active-window"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() =>
            setEditing({
              title: "Приём заявок",
              description: "",
              opens_at: new Date().toISOString(),
              closes_at: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
              delivery_days: ["thursday", "friday", "saturday"],
              is_active: true,
            })
          }
        >
          <Plus className="mr-1 h-4 w-4" /> Новое окно
        </Button>
      </div>

      {q.isLoading ? (
        <div className="text-muted-foreground">Загрузка…</div>
      ) : (q.data ?? []).length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Окон ещё нет.</Card>
      ) : (
        <div className="space-y-3">
          {(q.data ?? []).map((w) => {
            const now = Date.now();
            const opens = new Date(w.opens_at).getTime();
            const closes = new Date(w.closes_at).getTime();
            const isLive = w.is_active && opens <= now && now <= closes;
            return (
              <Card key={w.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{w.title}</h3>
                      {isLive && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                          Активно сейчас
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(w.opens_at).toLocaleString("ru-RU")} →{" "}
                      {new Date(w.closes_at).toLocaleString("ru-RU")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Дни доставки: {w.delivery_days.join(", ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs">
                      <Switch checked={w.is_active} onCheckedChange={() => toggle.mutate(w)} />
                      <span className="ml-1">Активно</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => extend.mutate({ w, hours: 24 })}>
                      +1 день
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => extend.mutate({ w, hours: 3 })}>
                      +3 ч
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(w)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => confirm("Удалить окно?") && remove.mutate(w.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <WindowEditor
        w={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          qc.invalidateQueries({ queryKey: ["admin-windows"] });
          qc.invalidateQueries({ queryKey: ["active-window"] });
        }}
      />
    </div>
  );
}

function WindowEditor({
  w,
  onClose,
  onSaved,
}: {
  w: Partial<PreorderWindow> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<PreorderWindow>>({});
  const [saving, setSaving] = useState(false);
  const [key, setKey] = useState<string>("");

  const currentKey = w?.id ?? (w ? "new" : "closed");
  if (currentKey !== key) {
    setKey(currentKey);
    setForm(w ?? {});
  }

  const save = async () => {
    if (!form.title?.trim()) return toast.error("Введите название");
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description ?? null,
        opens_at: new Date(form.opens_at ?? new Date()).toISOString(),
        closes_at: new Date(form.closes_at ?? new Date()).toISOString(),
        delivery_days: form.delivery_days ?? ["чт", "пт", "сб"],
        is_active: form.is_active ?? true,
      };
      if (w?.id) {
        const { error } = await supabase.from("preorder_windows").update(payload).eq("id", w.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("preorder_windows").insert(payload);
        if (error) throw error;
      }
      toast.success("Сохранено");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!w} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{w?.id ? "Редактировать окно" : "Новое окно предзаказа"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input
              value={form.title ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Описание</Label>
            <Textarea
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Открывается</Label>
              <Input
                type="datetime-local"
                value={form.opens_at ? toLocalInput(form.opens_at) : ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, opens_at: new Date(e.target.value).toISOString() }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Закрывается</Label>
              <Input
                type="datetime-local"
                value={form.closes_at ? toLocalInput(form.closes_at) : ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, closes_at: new Date(e.target.value).toISOString() }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Дни доставки (через запятую)</Label>
            <Input
              value={(form.delivery_days ?? []).join(", ")}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  delivery_days: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.is_active ?? true}
              onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
            />
            <Label>Активно</Label>
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
