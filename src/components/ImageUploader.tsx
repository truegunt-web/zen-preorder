import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: string;
};

// Long-lived signed URL (100 years). Bucket is private because workspace blocks public buckets.
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 100;

export function ImageUploader({ value, onChange, label = "Изображение", aspect = "aspect-video" }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("site-images")
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (upErr) throw upErr;
      const { data, error: signErr } = await supabase.storage
        .from("site-images")
        .createSignedUrl(path, SIGNED_URL_TTL);
      if (signErr) throw signErr;
      onChange(data.signedUrl);
      toast.success("Загружено");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-1 h-4 w-4" />
          {uploading ? "Загрузка…" : "Загрузить файл"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            <X className="mr-1 h-4 w-4" /> Убрать
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
      </div>
      <Input
        placeholder="или вставьте URL картинки"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <div className={`overflow-hidden rounded-lg border bg-muted ${aspect} max-w-sm`}>
          <img src={value} alt="" className="h-full w-full object-cover" />
        </div>
      )}
    </div>
  );
}
