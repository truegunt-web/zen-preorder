import { Link } from "@tanstack/react-router";
import { Fish } from "lucide-react";
import { CartSheet } from "./CartSheet";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Fish className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold">Свежий улов</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Предзаказ недели</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <CartSheet />
        </div>
      </div>
    </header>
  );
}
