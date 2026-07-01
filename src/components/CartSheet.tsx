import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Fish, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { UNIT_LABEL, formatPrice, useCart } from "@/lib/cart";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

export function CartSheet() {
  const { items, updateQuantity, updateComment, removeItem, total, count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative gap-2">
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">Корзина</span>
          {count > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-6">
          <SheetTitle>Ваша корзина</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
            <Fish className="h-12 w-12 opacity-30" strokeWidth={1.2} />
            <p>Корзина пуста. Выберите позиции из каталога.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <ul className="space-y-4">
              {items.map((it) => (
                <li key={it.productId} className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                      {it.imageUrl ? (
                        <img src={it.imageUrl} alt={it.name} className="h-full w-full object-cover" />
                      ) : (
                        <Fish className="h-6 w-6 text-primary/30" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="line-clamp-2 text-sm font-medium">{it.name}</h4>
                        <button
                          onClick={() => removeItem(it.productId)}
                          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                          aria-label="Удалить"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatPrice(it.price)} / {UNIT_LABEL[it.unit]} · мин. {it.minOrder} {UNIT_LABEL[it.unit]}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 rounded-lg border">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(it.productId, it.quantity - it.step)}
                        disabled={it.quantity <= it.minOrder}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        step={it.step}
                        min={it.minOrder}
                        value={it.quantity}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (!isNaN(v) && v > 0) updateQuantity(it.productId, v);
                        }}
                        className="h-8 w-16 border-0 text-center focus-visible:ring-0"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(it.productId, it.quantity + it.step)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="pr-2 text-xs text-muted-foreground">{UNIT_LABEL[it.unit]}</span>
                    </div>
                    <div className="text-sm font-semibold">{formatPrice(it.price * it.quantity)}</div>
                  </div>

                  <Textarea
                    placeholder="Комментарий к позиции (нарезка, упаковка…)"
                    value={it.comment}
                    onChange={(e) => updateComment(it.productId, e.target.value)}
                    className="mt-3 min-h-[60px] text-sm"
                    maxLength={300}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        {items.length > 0 && (
          <>
            <Separator />
            <SheetFooter className="flex-col gap-3 p-6 sm:flex-col sm:space-x-0">
              <div className="flex w-full items-center justify-between text-lg">
                <span className="text-muted-foreground">Итого:</span>
                <span className="font-bold">{formatPrice(total)}</span>
              </div>
              <Button
                asChild
                size="lg"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => setOpen(false)}
              >
                <Link to="/checkout">Оформить заявку</Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
