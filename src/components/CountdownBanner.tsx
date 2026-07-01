import { useCountdown } from "@/hooks/use-countdown";
import { Clock, Truck } from "lucide-react";

type Props = {
  title: string;
  closesAt: string;
  deliveryDays: string[];
};

const DAY_LABELS: Record<string, string> = {
  thursday: "Чт",
  friday: "Пт",
  saturday: "Сб",
};

export function CountdownBanner({ title, closesAt, deliveryDays }: Props) {
  const t = useCountdown(closesAt);
  if (!t) return null;

  const Cell = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center rounded-xl bg-primary-foreground/10 px-3 py-2 backdrop-blur sm:px-4 sm:py-3">
      <span className="font-mono text-2xl font-bold tabular-nums sm:text-4xl">{String(v).padStart(2, "0")}</span>
      <span className="text-[10px] uppercase tracking-wider opacity-70 sm:text-xs">{l}</span>
    </div>
  );

  return (
    <div
      className="relative overflow-hidden rounded-3xl px-6 py-8 text-primary-foreground shadow-elevated sm:px-10 sm:py-12"
      style={{ backgroundImage: "var(--gradient-deep)" }}
    >
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, oklch(0.72 0.18 35) 0%, transparent 50%)" }} />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <Clock className="h-3 w-3" />
            {t.expired ? "Приём заявок закрыт" : "Приём заявок открыт"}
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
          <div className="mt-2 flex items-center gap-2 text-sm opacity-80">
            <Truck className="h-4 w-4" />
            <span>Доставка: {deliveryDays.map((d) => DAY_LABELS[d]).join(" / ")}</span>
          </div>
        </div>
        {!t.expired && (
          <div className="flex gap-2 sm:gap-3">
            <Cell v={t.days} l="дней" />
            <Cell v={t.hours} l="часов" />
            <Cell v={t.minutes} l="минут" />
            <Cell v={t.seconds} l="секунд" />
          </div>
        )}
      </div>
    </div>
  );
}
