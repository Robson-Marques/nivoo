/**
 * Hook para Auto-emissão de NFC-e quando pedido é marcado como pago
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import NFCeService from '@/services/nfceService';
import { NFCeItem } from '@/types/nfce';

interface OrderData {
  id: string;
  restaurant_id: string;
  numero_pedido: string;
  status: string;
  valor_total: number;
  desconto?: number;
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  valor_desconto?: number;
  produto?: {
    ncm?: string;
  };
  addon_ids?: string[];
}

export function useAutoEmitNFCe() {
  const { toast } = useToast();

  /**
   * Emite NFC-e automaticamente quando pedido é marcado como pago
   */
  const emitNFCeOnPayment = useCallback(
    async (order: OrderData, restaurantId: string) => {
      try {
        // Verificar se fiscal_settings está ativa
        const fiscalSettings = await NFCeService.getFiscalSettings(restaurantId);

        if (!fiscalSettings) {
          console.log('Fiscal settings não configurada, emissão ignorada');
          return;
        }

        if (!fiscalSettings.is_ativo) {
          console.log('Emissão automática desativada');
          return;
        }

        // Construir itens para NFC-e
        const items = await buildNFCeItems(order);

        if (!items || items.length === 0) {
          throw new Error('Nenhum item para emitir');
        }

        // Gerar XML
        const xml = await NFCeService.generateNFCeXML(
          order,
          items,
          fiscalSettings,
          '01' // Dinheiro como padrão (TODO: obter do pedido)
        );

        // Assinar XML (placeholder - implementação real aguarda node-pkcs12)
        const xmlAssinado = await NFCeService.signXML(
          xml,
          Buffer.from(''), // Certificado viria do storage
          fiscalSettings.certificado_senha || ''
        );

        // Submeter para SEFAZ
        const response = await NFCeService.submitToSEFAZ(
          xmlAssinado,
          fiscalSettings.uf,
          fiscalSettings.ambiente
        );

        // Salvar NFC-e no banco
        const nfce = await NFCeService.saveNFCeInvoice(
          restaurantId,
          order.id,
          fiscalSettings.id,
          fiscalSettings.proxima_nfce_numero,
          xmlAssinado,
          null, // XML autorizado
          response.protNFe?.infProt?.nProt || null,
          order.valor_total,
          items,
          '01'
        );

        // Log
        await NFCeService.logNFCeOperation(
          nfce.id,
          'emissao_automatica',
          `NFC-e emitida automaticamente ao marcar pedido ${order.numero_pedido} como pago`,
          'rascunho',
          'autorizada'
        );

        // Incrementar número próxima NFC-e
        await supabase
          .from('fiscal_settings')
          .update({
            proxima_nfce_numero: fiscalSettings.proxima_nfce_numero + 1,
          })
          .eq('id', fiscalSettings.id);

        toast({
          title: 'NFC-e emitida com sucesso',
          description: `{Chave: ${nfce.chave_nfce}} Protocolo: ${response.protNFe?.infProt?.nProt}`,
        });

        return nfce;
      } catch (error: any) {
        console.error('Erro ao emitir NFC-e automaticamente:', error);

        // Log de erro
        toast({
          title: 'Erro ao emitir NFC-e',
          description: error.message,
          variant: 'destructive',
        });

        return null;
      }
    },
    [toast]
  );

  return {
    emitNFCeOnPayment,
  };
}

/**
 * Constrói itens NFCe a partir dos dados do pedido
 */
async function buildNFCeItems(order: OrderData): Promise<NFCeItem[] | null> {
  try {
    if (!order.order_items || order.order_items.length === 0) {
      return null;
    }

    const items: NFCeItem[] = [];

    for (const item of order.order_items) {
      const nfceItem: NFCeItem = {
        descricao: item.produto_nome,
        ncm: item.produto?.ncm || '21069090', // Default: alimentos preparados
        cfop: '5102', // Venda de mercadoria
        quantidade: item.quantidade,
        unidade_medida: 'UN',
        valor_unitario: item.preco_unitario,
        valor_desconto: item.valor_desconto || 0,
        valor_total: (item.preco_unitario * item.quantidade) - (item.valor_desconto || 0),
        icms_situacao_tributaria: '40', // Não tributada
      };

      items.push(nfceItem);
    }

    return items;
  } catch (error) {
    console.error('Erro ao construir itens NFC-e:', error);
    return null;
  }
}

/**
 * Verificar e emitir NFC-e para pedido
 * Função auxiliar principal
 */
export async function checkAndEmitNFCe(orderId: string, restaurantId: string) {
  try {
    const { data: order, error } = await supabase
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

    if (error) throw error;

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    // Chamar emissão
    const nfce = await useAutoEmitNFCe().emitNFCeOnPayment(order, restaurantId);

    return nfce;
  } catch (error: any) {
    console.error('Erro ao verificar e emitir NFC-e:', error);
    throw error;
  }
}

export default useAutoEmitNFCe;
