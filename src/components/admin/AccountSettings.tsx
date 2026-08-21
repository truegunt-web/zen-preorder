import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export function AccountSettings() {
  const [currentEmail, setCurrentEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const e = data.user?.email ?? "";
      setCurrentEmail(e);
      setEmail(e);
    });
  }, []);

  const saveEmail = async () => {
    const next = email.trim();
    if (!next || next === currentEmail) {
      toast.error("Введите новый логин");
      return;
    }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: next });
    setSavingEmail(false);
    if (error) toast.error(error.message);
    else {
      setCurrentEmail(next);
      toast.success("Логин обновлён");
    }
  };

  const savePassword = async () => {
    if (password.length < 8) {
      toast.error("Пароль должен быть не короче 8 символов");
      return;
    }
    if (password !== password2) {
      toast.error("Пароли не совпадают");
      return;
    }
    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPass(false);
    if (error) toast.error(error.message);
    else {
      setPassword("");
      setPassword2("");
      toast.success("Пароль обновлён");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Логин (e-mail)</h2>
          <p className="text-sm text-muted-foreground">
            Текущий: {currentEmail || "…"}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-email">Новый логин</Label>
          <Input
            id="new-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button onClick={saveEmail} disabled={savingEmail}>
          {savingEmail ? "Сохранение…" : "Сменить логин"}
        </Button>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Пароль</h2>
          <p className="text-sm text-muted-foreground">Минимум 8 символов.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-pass">Новый пароль</Label>
          <Input
            id="new-pass"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-pass2">Повторите пароль</Label>
          <Input
            id="new-pass2"
            type="password"
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />
        </div>
        <Button onClick={savePassword} disabled={savingPass}>
          {savingPass ? "Сохранение…" : "Сменить пароль"}
        </Button>
      </Card>
    </div>
  );
}
