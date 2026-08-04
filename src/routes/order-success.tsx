import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/order-success")({
  validateSearch: (s) => z.object({ n: z.coerce.number().optional() }).parse(s),
  component: SuccessPage,
  head: () => ({
    meta: [
      { title: "Заявка принята — Rybman" },
      { name: "description", content: "Ваша заявка в Rybman принята: мы свяжемся для подтверждения состава и суммы заказа." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Заявка принята — Rybman" },
      { property: "og:description", content: "Заявка на предзаказ рыбы и морепродуктов Rybman принята." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function SuccessPage() {
  const { n } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-2xl px-4 py-16">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold">Заявка принята!</h1>
          {n && <p className="mt-2 text-muted-foreground">Номер заявки: <span className="font-semibold text-foreground">№{n}</span></p>}
          <p className="mt-4 text-muted-foreground">
            Мы свяжемся с вами по указанному телефону для подтверждения заказа и уточнения времени доставки.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Вернуться в каталог</Link>
          </Button>
        </Card>
      </main>
    </div>
  );
}
