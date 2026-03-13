/**
 * INTEGRAÇÃO - AUTO-EMISSÃO DE NFC-e
 * 
 * Este arquivo demonstra como integrar a auto-emissão de NFC-e
 * aos componentes existentes de atualização de status de pedido.
 * 
 * LOCAL: src/integrations/nfce-payment-integration.ts
 */

import { useAutoEmitNFCe } from '@/hooks/useAutoEmitNFCe';
import { supabase } from '@/integrations/supabase/client';

/**
 * EXEMPLO 1: Atualizar Status de Pedido com Auto-emissão
 * 
 * Use este padrão ao marcar um pedido como "pago"
 */
export async function updateOrderStatusWithNFCe(
  orderId: string,
  restaurantId: string,
  newStatus: 'pendente' | 'pago' | 'entregue' | 'cancelado'
) {
  try {
    // 1. Atualizar status do pedido
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        data_pagamento: newStatus === 'pago' ? new Date().toISOString() : null,
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 2. Se status é "pago", emitir NFC-e automaticamente
    if (newStatus === 'pago') {
      const { emitNFCeOnPayment } = useAutoEmitNFCe();

      // Obter dados completos do pedido com itens
      const { data: orderWithItems, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            produto:product_id (
              ncm
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // Chamar emissão automática
      await emitNFCeOnPayment(orderWithItems, restaurantId);
    }

    return updatedOrder;
  } catch (error) {
    console.error('Erro ao atualizar pedido e emitir NFC-e:', error);
    throw error;
  }
}

/**
 * EXEMPLO 2: Integração em Componente React
 * 
 * Adicionar este padrão ao seu componente de atualização de status:
 */
export function ComponentIntegrationExample() {
  // import { useAutoEmitNFCe } from '@/hooks/useAutoEmitNFCe';
  // import { useAuth } from '@/contexts/AuthContext';
  // import { useToast } from '@/hooks/use-toast';
  //
  // function OrderStatusButton({ orderId }: { orderId: string }) {
  //   const { restaurant } = useAuth();
  //   const { toast } = useToast();
  //   const { emitNFCeOnPayment } = useAutoEmitNFCe();
  //   const [loading, setLoading] = useState(false);
  //
  //   const handleMarkAsPaid = async () => {
  //     try {
  //       setLoading(true);
  //
  //       // 1. Obter dados do pedido
  //       const { data: order, error: fetchError } = await supabase
  //         .from('orders')
  //         .select(`
  //           *,
  //           order_items (
  //             *,
  //             produto:product_id ( ncm )
  //           )
  //         `)
  //         .eq('id', orderId)
  //         .single();
  //
  //       if (fetchError) throw fetchError;
  //
  //       // 2. Atualizar status
  //       const { error: updateError } = await supabase
  //         .from('orders')
  //         .update({
  //           status: 'pago',
  //           data_pagamento: new Date().toISOString(),
  //         })
  //         .eq('id', orderId);
  //
  //       if (updateError) throw updateError;
  //
  //       // 3. Emitir NFC-e se fiscal_settings ativa
  //       if (restaurant?.id) {
  //         const nfce = await emitNFCeOnPayment(order, restaurant.id);
  //
  //         if (nfce) {
  //           toast({
  //             title: 'Pedido marcado como pago',
  //             description: `NFC-e ${nfce.numero_nfce} foi emitida automaticamente`,
  //           });
  //         } else {
  //           toast({
  //             title: 'Pedido marcado como pago',
  //             description: 'NFC-e não foi emitida (fiscal_settings desativada)',
  //           });
  //         }
  //       }
  //     } catch (error: any) {
  //       toast({
  //         title: 'Erro ao marcar como pago',
  //         description: error.message,
  //         variant: 'destructive',
  //       });
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //
  //   return (
  //     <Button onClick={handleMarkAsPaid} disabled={loading}>
  //       {loading ? 'Processando...' : 'Marcar como Pago'}
  //     </Button>
  //   );
  // }

  return null;
}

/**
 * EXEMPLO 3: Trigget Automático com Realtime Supabase
 * 
 * Se você quiser implementar automação no lado do servidor:
 */
export function RealtimeIntegrationExample() {
  // import { useEffect } from 'react';
  // import { supabase } from '@/integrations/supabase/client';
  // import { useAutoEmitNFCe } from '@/hooks/useAutoEmitNFCe';
  // import { useAuth } from '@/contexts/AuthContext';
  //
  // export function OrderStatusListener({ orderId }: { orderId: string }) {
  //   const { restaurant } = useAuth();
  //   const { emitNFCeOnPayment } = useAutoEmitNFCe();
  //
  //   useEffect(() => {
  //     const subscription = supabase
  //       .from(`orders:order_id=eq.${orderId}`)
  //       .on('postgres_changes', {
  //         event: 'UPDATE',
  //         schema: 'public',
  //         table: 'orders',
  //         filter: `status=eq.pago`,
  //       }, async (payload: any) => {
  //         // Pedido foi marcado como pago
  //         const order = payload.new;
  //
  //         // Obter items
  //         const { data: orderWithItems } = await supabase
  //           .from('orders')
  //           .select(`
  //             *,
  //             order_items (
  //               *,
  //               produto:product_id ( ncm )
  //             )
  //           `)
  //           .eq('id', order.id)
  //           .single();
  //
  //         // Emitir NFC-e
  //         if (restaurant?.id && orderWithItems) {
  //           await emitNFCeOnPayment(orderWithItems, restaurant.id);
  //         }
  //       })
  //       .subscribe();
  //
  //     return () => {
  //       subscription.unsubscribe();
  //     };
  //   }, [orderId, restaurant?.id, emitNFCeOnPayment]);
  //
  //   return null;
  // }

  return null;
}

/**
 * EXEMPLO 4: Integração com API Route (se usar Vite + Supabase Functions)
 */
export const apiIntegrationCode = `
// src/api/orders/mark-as-paid.ts
import { defineEventHandler, readBody } from 'h3';

export default defineEventHandler(async (event) => {
  const { orderId, restaurantId } = await readBody(event);

  // 1. Atualizar pedido
  const order = await updateOrder(orderId, { status: 'pago' });

  // 2. Emitir NFC-e
  const nfce = await emitNFCe(orderId, restaurantId);

  return {
    success: true,
    order,
    nfce,
  };
});
`;

/**
 * ==========================================
 * INSTRUÇÕES DE USO
 * ==========================================
 * 
 * 1. CONFIGURAÇÃO INICIAL (ETAPA 2 - já feita)
 *    ✅ Criar fiscal_settings para o restaurante
 *    ✅ Ativar is_ativo = true
 * 
 * 2. IMPLEMENTAR EM SEU COMPONENTE
 *    - Importe useAutoEmitNFCe
 *    - Ao marcar pedido como "pago", chame emitNFCeOnPayment()
 *    - O hook cuidará do resto (gerar XML, assinar, enviar SEFAZ)
 * 
 * 3. VALIDAR COMPORTAMENTO
 *    - Marque um pedido como pago em ambiente homologacao
 *    - Verifique em /admin/nfce-history
 *    - Confirme que NFC-e foi emitida com status "autorizada"
 * 
 * 4. PRODUÇÃO
 *    - Após validar em homologacao, mude ambiente para \"producao\"
 *    - NFC-e reais serão emitidas com protocolo SEFAZ válido
 * 
 * 5. MONITORAMENTO
 *    - Verifique nfce_log para auditoria
 *    - Veja nfce_invoices.mensagem_retorno para erros
 *    - Use nfce_cancelamento se precisar revogar notas
 * 
 * ==========================================
 */

export default {
  updateOrderStatusWithNFCe,
  ComponentIntegrationExample,
  RealtimeIntegrationExample,
};
