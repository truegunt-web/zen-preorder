import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  unit: string;
  minOrder: number;
  step: number;
  quantity: number;
  comment: string;
  imageUrl: string | null;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "comment"> & { quantity?: number; comment?: string }) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateComment: (productId: string, comment: string) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "preorder_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem: CartContextValue["addItem"] = (item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: +(i.quantity + item.step).toFixed(3) } : i,
        );
      }
      return [
        ...prev,
        {
          ...item,
          quantity: item.quantity ?? item.minOrder,
          comment: item.comment ?? "",
        },
      ];
    });
  };

  const updateQuantity = (productId: string, quantity: number) =>
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(i.minOrder, +quantity.toFixed(3)) } : i)),
    );

  const updateComment = (productId: string, comment: string) =>
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, comment } : i)));

  const removeItem = (productId: string) => setItems((prev) => prev.filter((i) => i.productId !== productId));
  const clear = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.length;

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, updateComment, removeItem, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export const UNIT_LABEL: Record<string, string> = {
  kg: "кг",
  g: "г",
  pcs: "шт",
  pack: "упак",
};

export const CATEGORY_LABEL: Record<string, string> = {
  fish: "Рыба",
  seafood: "Морепродукты",
  semifinished_fish: "П/ф рыбные",
  semifinished_turkey: "П/ф из индейки",
  semifinished_squid: "П/ф из кальмара",
  semifinished_cottage: "П/ф творожные",
  semifinished_apple: "П/ф яблочные",
  other: "Прочее",
};

export const DELIVERY_DAY_LABEL: Record<string, string> = {
  thursday: "Четверг",
  friday: "Пятница",
  saturday: "Суббота",
};

export function formatPrice(value: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value);
}
