import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { playNotificationAudio } from '@/utils/simple-audio';

interface RealtimeOrderEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: any;
  old?: any;
}

export function useRealtimeOrders(enabled: boolean = true) {
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);
  const lastOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !user) {
      console.log('ℹ️ [REALTIME] Realtime desabilitado ou usuário não autenticado');
      return;
    }

    console.log('🔄 [REALTIME] Iniciando escuta de pedidos em tempo real...');

    // Inscrever-se em mudanças da tabela 'orders'
    const channel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload: RealtimeOrderEvent) => {
          try {
            console.log('📍 [REALTIME] Novo pedido recebido:', payload.new?.id);
            
            // Evitar duplicatas: se for o mesmo pedido enviado múltiplas vezes
            if (payload.new?.id === lastOrderIdRef.current) {
              console.log('⏭️  [REALTIME] Pedido duplicado ignorado:', payload.new?.id);
              return;
            }

            lastOrderIdRef.current = payload.new?.id;

            // Tocar som se preferências permitirem
            console.log('🔊 [REALTIME] Tocando notificação sonora para novo pedido');
            playNotificationAudio();

            // Log do pedido para debug
            console.log('📋 [REALTIME] Detalhes do pedido:', {
              id: payload.new?.id,
              customer: payload.new?.customer_name,
              total: payload.new?.total,
              timestamp: new Date().toLocaleTimeString('pt-BR'),
            });
          } catch (error) {
            console.error('❌ [REALTIME] Erro ao processar novo pedido:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload: RealtimeOrderEvent) => {
          try {
            console.log('🔄 [REALTIME] Pedido atualizado:', payload.new?.id);
            console.log('   Status anterior:', payload.old?.status);
            console.log('   Status novo:', payload.new?.status);
          } catch (error) {
            console.error('❌ [REALTIME] Erro ao processar atualização de pedido:', error);
          }
        }
      )
      .subscribe((status: string) => {
        console.log('📡 [REALTIME] Status da conexão:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ [REALTIME] Conectado com sucesso aos pedidos em tempo real');
        } else if (status === 'CLOSED') {
          console.log('⚠️  [REALTIME] Conexão fechada');
          lastOrderIdRef.current = null; // Reset na desconexão
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [REALTIME] Erro no canal');
        }
      });

    subscriptionRef.current = channel;

    // Cleanup
    return () => {
      if (subscriptionRef.current) {
        console.log('🛑 [REALTIME] Removendo escuta de pedidos');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [enabled, user]);

  return {
    isActive: enabled && !!user,
    lastOrderId: lastOrderIdRef.current,
  };
}
