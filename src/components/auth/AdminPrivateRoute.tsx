import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

/**
 * AdminPrivateRoute Component
 * 
 * Protege rotas que requerem acesso de administrador.
 * Valida:
 * - Se o usuário está autenticado
 * - Se o usuário possui role de 'admin'
 * 
 * Caso contrário, redireciona para login.
 */
export function AdminPrivateRoute() {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem acessar esta página',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
