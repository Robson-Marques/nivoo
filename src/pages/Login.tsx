import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [adminLogoUrl, setAdminLogoUrl] = useState<string>("");
  const [brandingLoaded, setBrandingLoaded] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadAdminLogo = async () => {
      try {
        const { data } = await supabase
          .from("restaurants")
          .select("theme_settings")
          .limit(1)
          .maybeSingle();

        const themeSettings =
          data?.theme_settings && typeof data.theme_settings === "object"
            ? (data.theme_settings as any)
            : null;
        const url = themeSettings?.admin_logo_url || themeSettings?.adminLogoUrl;
        if (typeof url === "string") setAdminLogoUrl(url);
      } catch (_) {
        // ignore
      } finally {
        setBrandingLoaded(true);
      }
    };

    loadAdminLogo();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="relative">
          <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-b from-delivery-500/10 via-transparent to-transparent blur-2xl" />

          <div className="text-center mb-8">
            <div className="bg-delivery-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-delivery-500/20 ring-1 ring-black/5">
            {brandingLoaded && adminLogoUrl ? (
              <img
                src={adminLogoUrl}
                alt="Logo do Admin"
                className="w-full h-full object-contain p-2"
              />
            ) : null}
          </div>
          <h1 className="text-3xl font-bold">Painel Admin</h1>
          <p className="text-muted-foreground mt-2">
            Sistema de Gestão de Pedidos e Entregas
          </p>

          </div>

          <Card className="rounded-3xl shadow-xl shadow-black/5 border-border/60 backdrop-blur-sm">
            <CardHeader className="space-y-2">
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Apenas administradores podem acessar o sistema
            </CardDescription>
            </CardHeader>

            <form onSubmit={handleLogin}>
              <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full delivery-gradient h-11 rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
                <div className="text-xs text-muted-foreground text-center">
                  Se você não possui acesso, contate o administrador
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
