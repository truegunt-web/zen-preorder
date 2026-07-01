import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Fish, Plus, Info } from "lucide-react";
import { CATEGORY_LABEL, UNIT_LABEL, formatPrice, useCart, type CartItem } from "@/lib/cart";
import { toast } from "sonner";

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

export function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const { addItem } = useCart();

  const handleAdd = () => {
    const item: Omit<CartItem, "quantity" | "comment"> = {
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      unit: product.unit,
      minOrder: Number(product.min_order),
      step: Number(product.step),
      imageUrl: product.image_url,
    };
    addItem(item);
    toast.success("Добавлено в корзину", { description: product.name });
  };

  return (
    <Card className="group flex flex-col overflow-hidden border-border/60 bg-card p-0 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated">
      <button
        onClick={onOpen}
        className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-secondary"
        aria-label={`Открыть карточку ${product.name}`}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <Fish className="h-16 w-16 text-primary/30" strokeWidth={1.2} />
        )}
        <Badge className="absolute left-3 top-3 bg-background/90 text-foreground shadow-sm backdrop-blur">
          {CATEGORY_LABEL[product.category] ?? product.category}
        </Badge>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">{product.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Мин. заказ: {Number(product.min_order)} {UNIT_LABEL[product.unit]}
          </p>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-xl font-bold text-foreground">{formatPrice(Number(product.price))}</div>
            <div className="text-xs text-muted-foreground">за {UNIT_LABEL[product.unit]}</div>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="outline" onClick={onOpen} aria-label="Подробнее">
              <Info className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={handleAdd} aria-label="В корзину" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
