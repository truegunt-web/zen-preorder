import { Link } from "@tanstack/react-router";
import { Fish, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { CartSheet } from "./CartSheet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSignedIn(!!s?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Fish className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold">Rybman</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Рыба и морепродукты</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">
                <Settings className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Админка</span>
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">Войти</Link>
            </Button>
          )}
          <CartSheet />
        </div>
      </div>
    </header>
  );
}
