import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Fish } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Вход для сотрудников — Rybman" },
      { name: "description", content: "Вход в панель управления магазина Rybman." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Вход для сотрудников — Rybman" },
      { property: "og:description", content: "Вход в панель управления магазина Rybman." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fn = mode === "signin" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
      const { error } = await fn.call(supabase.auth, { email, password });
      if (error) throw error;
      toast.success(mode === "signin" ? "Вход выполнен" : "Аккаунт создан");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md p-8">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Fish className="h-5 w-5" />
          </div>
          <span className="font-bold">Rybman</span>
        </Link>
        <h1 className="text-2xl font-bold">
          {mode === "signin" ? "Вход в админку" : "Регистрация администратора"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Введите e-mail и пароль администратора каталога."
            : "Первый созданный аккаунт получит права администратора."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Подождите…" : mode === "signin" ? "Войти" : "Создать аккаунт"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
        </button>
      </Card>
    </div>
  );
}
