import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Fish, Plus, ArrowLeft } from "lucide-react";
import { CATEGORY_LABEL, UNIT_LABEL, formatPrice, useCart } from "@/lib/cart";
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

export function ProductModal({
  product,
  open,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  if (!product) return null;

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      unit: product.unit,
      minOrder: Number(product.min_order),
      step: Number(product.step),
      imageUrl: product.image_url,
    });
    toast.success("Добавлено в корзину", { description: product.name });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="flex aspect-square items-center justify-center bg-secondary md:aspect-auto">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <Fish className="h-24 w-24 text-primary/30" strokeWidth={1.2} />
            )}
          </div>
          <div className="flex flex-col gap-4 p-6">
            <DialogHeader className="space-y-3 text-left">
              <Badge className="w-fit" variant="secondary">
                {CATEGORY_LABEL[product.category] ?? product.category}
              </Badge>
              <DialogTitle className="text-2xl">{product.name}</DialogTitle>
            </DialogHeader>

            {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}

            <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Цена</div>
                <div className="text-lg font-bold">
                  {formatPrice(Number(product.price))}
                  <span className="text-xs font-normal text-muted-foreground"> / {UNIT_LABEL[product.unit]}</span>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Мин. заказ</div>
                <div className="text-lg font-bold">
                  {Number(product.min_order)} {UNIT_LABEL[product.unit]}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Шаг</div>
                <div className="text-lg font-bold">
                  {Number(product.step)} {UNIT_LABEL[product.unit]}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Ед. измерения</div>
                <div className="text-lg font-bold">{UNIT_LABEL[product.unit]}</div>
              </div>
            </div>

            <Button size="lg" onClick={handleAdd} className="mt-auto bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-5 w-5" />
              В корзину
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
