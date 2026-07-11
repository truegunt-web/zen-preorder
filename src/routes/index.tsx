import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { CountdownBanner } from "@/components/CountdownBanner";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { CATEGORY_LABEL } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import heroImg from "@/assets/hero-seafood.jpg";
import { normalizeContent } from "@/lib/site-content";

export const Route = createFileRoute("/")({
  component: HomePage,
});


type Product = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  unit: string;
  min_order: number;
  step: number;
  image_url: string | null;
};

type Window = {
  id: string;
  title: string;
  description: string | null;
  opens_at: string;
  closes_at: string;
  delivery_days: string[];
};

function HomePage() {
  const [selected, setSelected] = useState<Product | null>(null);
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const contentQ = useQuery({
    queryKey: ["site-content"],
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
  const content = contentQ.data ?? normalizeContent(null);


  const windowQ = useQuery({
    queryKey: ["active-window"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("preorder_windows")
        .select("*")
        .eq("is_active", true)
        .lte("opens_at", new Date().toISOString())
        .gte("closes_at", new Date().toISOString())
        .order("closes_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Window | null;
    },
  });

  const productsQ = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const categories = useMemo(() => {
    const set = new Set((productsQ.data ?? []).map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [productsQ.data]);

  const filtered = useMemo(() => {
    const list = productsQ.data ?? [];
    return list.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [productsQ.data, category, search]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Hero */}
        <section className="mb-8 grid gap-6 lg:grid-cols-2 lg:items-center">
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Свежий улов —<br />
              <span className="text-accent">на вашем столе</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Собираем предзаказ рыбы, морепродуктов и полуфабрикатов раз в неделю. Мы закупаем ровно то, что заказали
              вы — минимум остатков, максимум свежести.
            </p>
          </div>
          <div className="order-1 overflow-hidden rounded-3xl shadow-elevated lg:order-2">
            <img src={heroImg} alt="Свежая рыба на льду" width={1600} height={900} className="h-full w-full object-cover" />
          </div>
        </section>

        {/* Countdown */}
        <section className="mb-10">
          {windowQ.isLoading ? (
            <div className="h-40 animate-pulse rounded-3xl bg-muted" />
          ) : windowQ.data ? (
            <CountdownBanner
              title={windowQ.data.title}
              closesAt={windowQ.data.closes_at}
              deliveryDays={windowQ.data.delivery_days}
            />
          ) : (
            <div className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground">
              Сейчас приём заявок закрыт. Скоро откроем следующее окно предзаказа.
            </div>
          )}
        </section>

        {/* Filters */}
        <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Каталог недели</h2>
            <p className="text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "позиция" : "позиций"}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </section>

        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={c === category ? "default" : "outline"}
              onClick={() => setCategory(c)}
              className={c === category ? "bg-primary" : ""}
            >
              {c === "all" ? "Все" : CATEGORY_LABEL[c] ?? c}
            </Button>
          ))}
        </div>

        {/* Grid */}
        {productsQ.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            По вашему запросу ничего не найдено.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={() => setSelected(p)} />
            ))}
          </div>
        )}
      </main>

      <ProductModal product={selected} open={!!selected} onClose={() => setSelected(null)} />

      <footer className="mt-16 border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Свежий улов · Предзаказ с доставкой в чт/пт/сб
        </div>
      </footer>
    </div>
  );
}
