
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from "lucide-react";

export function UserPassword() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validar se tem usuário logado
    if (!user) {
      toast({
        title: "Erro ao alterar senha",
        description: "Você precisa estar logado para alterar a senha.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Validar se campos estão preenchidos
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Erro ao alterar senha",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro ao alterar senha",
        description: "As senhas não conferem.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro ao alterar senha",
        description: "A nova senha deve ter no mínimo 6 caracteres.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // Chamar função RPC para atualizar senha
      const { data, error } = await supabase.rpc('update_user_password', {
        p_user_id: user.id,
        p_current_password: currentPassword,
        p_new_password: newPassword
      });

      if (error) {
        throw error;
      }

      if (data && data.length > 0 && data[0].success) {
        toast({
          title: "Sucesso!",
          description: "Sua senha foi alterada com sucesso.",
        });

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const errorMessage = data && data.length > 0 ? data[0].message : "Erro ao alterar senha";
        toast({
          title: "Erro ao alterar senha",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      toast({
        title: "Erro ao alterar senha",
        description: error?.message || "Ocorreu um erro ao alterar sua senha.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alterar Senha</CardTitle>
        <CardDescription>
          Atualize sua senha para manter sua conta segura.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha atual</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="Digite sua senha atual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Digite uma nova senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirme a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Alterando...
              </>
            ) : (
              "Alterar senha"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
