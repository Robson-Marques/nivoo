import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { playNotificationSound, stopNotificationSound } from "@/utils/audio-system";
import { initializeNotifications, notifyNewOrder, requestNotificationPermission } from "@/utils/browser-notification";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  orderNumber: string;
  customerName: string;
}

interface UseNotificationsOptions {
  soundEnabled?: boolean;
  soundVolume?: number;
}

export function useNotifications(options?: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    // Inicializar notificações do navegador
    console.log('========================================');
    console.log('🚀 INICIANDO HOOK useNotifications');
    console.log('📢 Inicializando sistema de notificações...');
    console.log('========================================');
    initializeNotifications();

    // Carregar pedidos pendentes do Supabase apenas uma vez no início
    const loadPendingOrders = async () => {
      try {
        console.log('🔄 Carregando pedidos pendentes...');
        
        const { count: totalCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true });
        console.log(`✅ Realtime ativado! Total de pedidos: ${totalCount}`);

        const { data: orders, error } = await supabase
          .from("orders")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (error) {
          console.error('❌ Erro ao carregar pedidos:', error);
          return;
        }

        if (orders && orders.length > 0) {
          console.log('✅ Pedidos pendentes encontrados:', orders.length);
          const orderNotifications = orders.map(orderToNotification);
          setNotifications(orderNotifications);
        } else {
          console.log('ℹ️  Nenhum pedido pendente encontrado');
        }
      } catch (err) {
        console.error('❌ Erro ao carregar pedidos:', err);
      } finally {
        setInitialLoadDone(true);
      }
    };

    // Carregar apenas uma vez
    loadPendingOrders();

    // Inscrever para mudanças nos pedidos (sem recarregamento periódico)
    console.log('🔌 Registrando listeners de mudanças nos pedidos...');
    console.log('📡 Aguardando eventos INSERT e UPDATE...');
    
    const subscription = supabase
      .channel("orders-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const newOrder = payload.new as any;
          console.log('========================================');
          console.log('🔔🔔🔔 ✅ EVENTO INSERT RECEBIDO DO SUPABASE!');
          console.log('========================================');
          console.log('📋 Novo pedido:', {
            id: newOrder.id,
            number: newOrder.number,
            customer_name: newOrder.customer_name,
            status: newOrder.status,
            total: newOrder.total,
            created_at: newOrder.created_at,
          });
          
          if (newOrder.status === "pending") {
            console.log('✅ Status é PENDING, processando notificação...');
            const notification = orderToNotification(newOrder);
            
            setNotifications((prev) => {
              // Verificar se já existe para não duplicar
              if (prev.some(n => n.id === newOrder.id)) {
                console.log('⚠️ Notificação duplicada detectada, ignorando');
                return prev;
              }
              console.log(`✅ Adicionando notificação. Total agora: ${prev.length + 1}`);
              return [notification, ...prev];
            });
            
            // 🔊 TOCAR SOM - APENAS AQUI NO ADMIN!
            console.log('========================================');
            console.log('🔊🔊🔊 DISPARANDO SOM DE NOTIFICAÇÃO');
            console.log('========================================');
            
            // Executar som em background (não bloqueia)
            (async () => {
              try {
                console.log('🎵 [NOTIFICATIONS] Chamando playNotificationSound()...');
                const result = await playNotificationSound(
                  options?.soundEnabled,
                  options?.soundVolume ?? 1.0
                );
                console.log(`🎵 [NOTIFICATIONS] playNotificationSound() retornou: ${result}`);
              } catch (error) {
                console.error('❌ [NOTIFICATIONS] ERRO ao disparar som:', error);
              }
            })();
            
            // 📢 ENVIAR NOTIFICAÇÃO DO NAVEGADOR
            console.log('📢 Enviando notificação do navegador...');
            notifyNewOrder(newOrder.number || newOrder.id, newOrder.customer_name);
          } else {
            console.log(`⚠️ Status NÃO é PENDING (é ${newOrder.status}), ignorando`);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updatedOrder = payload.new as any;
          const oldOrder = payload.old as any;
          console.log('🔄 Pedido atualizado:', { 
            id: updatedOrder.id, 
            statusAntigo: oldOrder?.status, 
            statusNovo: updatedOrder.status 
          });
          
          setNotifications((prev) => {
            // Se o pedido não está mais pendente, remover da lista
            if (updatedOrder.status !== "pending") {
              console.log('✅ Removendo notificação para pedido:', updatedOrder.id);
              const filtered = prev.filter((notification) => notification.id !== updatedOrder.id);
              return filtered;
            }
            
            // Se ainda está pendente, atualizar a notificação
            const existingIndex = prev.findIndex((notification) => notification.id === updatedOrder.id);
            if (existingIndex >= 0) {
              const updatedNotifications = [...prev];
              updatedNotifications[existingIndex] = orderToNotification(updatedOrder);
              return updatedNotifications;
            }
            
            return prev;
          });
        }
      )
      .subscribe(
        (status, err) => {
          console.log('========================================');
          console.log(`🔌 STATUS DA SUBSCRIPTION: ${status.toUpperCase()}`);
          console.log('========================================');
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ ✅ ✅ SUBSCRIPTION ATIVA E PRONTA! ✅ ✅ ✅');
            console.log('✅ Conectado ao Realtime do Supabase');
            console.log('🔊 Sistema pronto para receber notificações em TEMPO REAL');
            console.log('📡 Aguardando novos pedidos (INSERT events)...');
            console.log('🎯 NOTA: INSERT events serão recebidos assim que novos pedidos forem criados');
          } else if (status === 'CLOSED') {
            console.log('❌ Subscription foi FECHADA');
            console.log('⚠️ Notificações em tempo real não funcionarão');
            console.log('💡 Tente recarregar a página ou entrar em contato com o suporte');
          } else if (status === 'CHANNEL_ERROR') {
            console.log('❌ Erro no CANAL da subscription');
            console.error('❌ Erro da subscription:', err);
            if (err?.message?.includes('permission')) {
              console.error('❌ ERRO: Permissão negada. Verifique as RLS policies');
            }
          } else {
            console.log(`ℹ️ Status: ${status}`);
          }
        }
      );

    return () => {
      console.log('🔌 Desconectando subscriptions');
      subscription.unsubscribe();
    };
  }, [options?.soundEnabled, options?.soundVolume]);

  const markAsRead = (notificationId: string) => {
    // Remover da lista de notificações ativas
    setNotifications((prev) => {
      const filtered = prev.filter((notification) => notification.id !== notificationId);
      console.log(`📢 Notificação ${notificationId} marcada como lida. Restantes: ${filtered.length}`);
      
      // Se não há mais notificações pendentes, parar o som
      if (filtered.length === 0) {
        console.log('🔇 Nenhuma notificação pendente, parando som...');
        stopNotificationSound();
      }
      
      return filtered;
    });
  };

  const acceptOrder = async (orderId: string) => {
    try {
      console.log('========================================');
      console.log('✅ ACEITANDO PEDIDO:', orderId);
      console.log('========================================');
      
      // 🔇 PARAR O SOM IMEDIATAMENTE ANTES DE PROCESSAR
      console.log('🔇 Parando som da notificação...');
      stopNotificationSound();
      
      // Atualizar o status do pedido para 'confirmed' (confirmado)
      // Status válidos: pending, confirmed, preparing, ready, out_for_delivery, delivered, canceled
      const { error } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', orderId);

      if (error) {
        console.error('❌ Erro ao aceitar pedido:', error);
        return false;
      }

      console.log('✅ Pedido confirmado com sucesso:', orderId);
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao processar pedido:', error);
      return false;
    }
  };

  const orderToNotification = (order: Order): Notification => {
    return {
      id: order.id,
      title: "Novo pedido recebido",
      description: `Pedido #${order.number} - Cliente: ${order.customer_name}`,
      time: new Date(order.created_at).toLocaleString(),
      orderNumber: order.number || order.id,
      customerName: order.customer_name,
    };
  };

  return {
    notifications,
    unreadCount: notifications.length,
    markAsRead,
    acceptOrder,
  };
}
