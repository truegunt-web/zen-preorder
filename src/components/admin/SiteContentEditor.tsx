import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ImageUploader } from "@/components/ImageUploader";
import { normalizeContent, type SiteContent, type CustomSection } from "@/lib/site-content";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";

export function SiteContentEditor() {
  const qc = useQueryClient();
  const [form, setForm] = useState<SiteContent | null>(null);

  const q = useQuery({
    queryKey: ["admin-site-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("id", "main")
        .maybeSingle();
      if (error) throw error;
      return normalizeContent(data?.content);
    },
  });

  useEffect(() => {
    if (q.data && !form) setForm(q.data);
  }, [q.data, form]);

  const save = useMutation({
    mutationFn: async (c: SiteContent) => {
      const { error } = await supabase
        .from("site_content")
        .upsert({ id: "main", content: c as never });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Сохранено");
      qc.invalidateQueries({ queryKey: ["site-content"] });
      qc.invalidateQueries({ queryKey: ["admin-site-content"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!form) return <div className="text-muted-foreground">Загрузка…</div>;

  const set = <K extends keyof SiteContent>(k: K, v: SiteContent[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const setSection = (i: number, patch: Partial<CustomSection>) =>
    setForm((f) =>
      f
        ? { ...f, sections: f.sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }
        : f,
    );

  const addSection = () =>
    setForm((f) =>
      f
        ? {
            ...f,
            sections: [
              ...f.sections,
              { id: crypto.randomUUID(), title: "Новая секция", body: "", image_url: "" },
            ],
          }
        : f,
    );

  const removeSection = (i: number) =>
    setForm((f) => (f ? { ...f, sections: f.sections.filter((_, idx) => idx !== i) } : f));

  const move = (i: number, dir: -1 | 1) =>
    setForm((f) => {
      if (!f) return f;
      const j = i + dir;
      if (j < 0 || j >= f.sections.length) return f;
      const arr = [...f.sections];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...f, sections: arr };
    });

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">Hero-блок</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Заголовок, строка 1</Label>
            <Input value={form.hero_title_line1} onChange={(e) => set("hero_title_line1", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Заголовок, строка 2 (акцент)</Label>
            <Input value={form.hero_title_line2} onChange={(e) => set("hero_title_line2", e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Подзаголовок</Label>
          <Textarea rows={3} value={form.hero_subtitle} onChange={(e) => set("hero_subtitle", e.target.value)} />
        </div>
        <ImageUploader
          label="Картинка hero"
          value={form.hero_image_url}
          onChange={(v) => set("hero_image_url", v)}
        />
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">Каталог недели (заголовок блока)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Заголовок</Label>
            <Input value={form.catalog_title} onChange={(e) => set("catalog_title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Подпись (если пусто — покажется число позиций)</Label>
            <Input value={form.catalog_subtitle} onChange={(e) => set("catalog_subtitle", e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Дополнительные секции</h2>
          <Button size="sm" variant="outline" onClick={addSection}>
            <Plus className="mr-1 h-4 w-4" /> Добавить секцию
          </Button>
        </div>
        {form.sections.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Пусто. Можно добавлять любые информационные блоки — они появятся под каталогом.
          </p>
        )}
        <div className="space-y-4">
          {form.sections.map((s, i) => (
            <div key={s.id} className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                  Секция #{i + 1}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => move(i, 1)}
                    disabled={i === form.sections.length - 1}
                  >
                    ↓
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeSection(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Заголовок</Label>
                  <Input value={s.title} onChange={(e) => setSection(i, { title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Текст</Label>
                  <Textarea
                    rows={4}
                    value={s.body}
                    onChange={(e) => setSection(i, { body: e.target.value })}
                  />
                </div>
                <ImageUploader
                  label="Картинка (необязательно)"
                  value={s.image_url ?? ""}
                  onChange={(v) => setSection(i, { image_url: v })}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">Футер</h2>
        <div className="space-y-2">
          <Label>Текст в подвале (можно использовать {"{year}"} для текущего года)</Label>
          <Textarea
            rows={2}
            value={form.footer_text}
            onChange={(e) => set("footer_text", e.target.value)}
          />
        </div>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" onClick={() => form && save.mutate(form)} disabled={save.isPending}>
          {save.isPending ? "Сохранение…" : "Сохранить изменения"}
        </Button>
      </div>
    </div>
  );
}
