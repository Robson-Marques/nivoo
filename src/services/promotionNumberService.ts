import { supabase } from '@/integrations/supabase/client';
import { PromotionNumber } from '@/types/coupon';

// Helper para usar tabelas novas que ainda não estão no tipo do Supabase
const queryFrom = (table: string) => (supabase.from(table as any) as any);

/**
 * Gera um número único para a promoção
 */
export async function generatePromotionNumber(promotionId: string): Promise<string> {
  try {
    // Buscar promoção para validação
    const { data: promotion, error: promoError } = await queryFrom('promotions')
      .select('total_numbers')
      .eq('id', promotionId)
      .single();

    if (promoError) throw promoError;

    if (!promotion?.total_numbers || promotion.total_numbers <= 0) {
      throw new Error('Promoção sem total_numbers configurado');
    }

    // Gerar número aleatório entre 1 e total_numbers
    const randomNumber = Math.floor(Math.random() * promotion.total_numbers) + 1;
    const paddedNumber = randomNumber.toString().padStart(6, '0');

    return paddedNumber;
  } catch (error) {
    console.error('Erro ao gerar número de promoção:', error);
    throw error;
  }
}

/**
 * Cria um registro de número de promoção para uma compra
 */
export async function createPromotionNumberRecord(
  promotionId: string,
  orderId: string,
  customerName: string,
  customerPhone: string,
  customerEmail?: string
): Promise<PromotionNumber> {
  try {
    // Gerar número único
    let generatedNumber: string | null = null;
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidate = await generatePromotionNumber(promotionId);
      const duplicate = await checkDuplicateNumber(promotionId, candidate);

      if (!duplicate) {
        generatedNumber = candidate;
        break;
      }
    }

    if (!generatedNumber) {
      throw new Error('Não foi possível gerar um número único para a promoção');
    }

    // Registrar no banco de dados
    const { data, error } = await queryFrom('promotion_numbers')
      .insert([
        {
          promotion_id: promotionId,
          number: generatedNumber,
          order_id: orderId,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || null,
          is_winner: false,
          prize_position: null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as PromotionNumber;
  } catch (error) {
    console.error('Erro ao criar número de promoção:', error);
    throw error;
  }
}

/**
 * Busca todas as promoções ativas e válidas para uma compra
 */
export async function getActivePromotionsForOrder(orderValue: number): Promise<any[]> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await queryFrom('promotions')
      .select('*')
      .eq('active', true)
      .eq('promotion_type', 'number')
      .lte('start_date', now)
      .gte('end_date', now)
      .lte('min_order_value', orderValue);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar promoções ativas:', error);
    throw error;
  }
}

/**
 * Valida se um número de promoção é vencedor
 */
export async function validateIfNumberIsWinner(
  promotionId: string,
  orderId: string
): Promise<boolean> {
  try {
    const { data, error } = await queryFrom('promotion_numbers')
      .select('is_winner')
      .eq('promotion_id', promotionId)
      .eq('order_id', orderId)
      .single();

    if (error) throw error;
    return data?.is_winner || false;
  } catch (error) {
    console.error('Erro ao validar número:', error);
    return false;
  }
}

/**
 * Busca os detalhes de um número de promoção
 */
export async function getPromotionNumberDetails(
  promotionId: string,
  orderId: string
): Promise<PromotionNumber | null> {
  try {
    const { data, error } = await queryFrom('promotion_numbers')
      .select('*')
      .eq('promotion_id', promotionId)
      .eq('order_id', orderId)
      .single();

    if (error) throw error;
    return data as PromotionNumber;
  } catch (error) {
    console.error('Erro ao buscar número de promoção:', error);
    return null;
  }
}

/**
 * Atualiza o status de um número como ganhador
 */
export async function markNumberAsWinner(
  promotionNumberId: string,
  prizePosition: number
): Promise<void> {
  try {
    const { error } = await queryFrom('promotion_numbers')
      .update({
        is_winner: true,
        prize_position: prizePosition,
      })
      .eq('id', promotionNumberId);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao marcar número como ganhador:', error);
    throw error;
  }
}

/**
 * Busca números de uma promoção que estão marcados como ganhadores
 */
export async function getWinningNumbers(promotionId: string): Promise<PromotionNumber[]> {
  try {
    const { data, error } = await queryFrom('promotion_numbers')
      .select('*')
      .eq('promotion_id', promotionId)
      .eq('is_winner', true)
      .order('prize_position', { ascending: true });

    if (error) throw error;
    return (data as PromotionNumber[]) || [];
  } catch (error) {
    console.error('Erro ao buscar números ganhadores:', error);
    throw error;
  }
}

/**
 * Verifica se existe um número duplicado e retorna o existente
 */
export async function checkDuplicateNumber(
  promotionId: string,
  number: string
): Promise<PromotionNumber | null> {
  try {
    const { data, error } = await queryFrom('promotion_numbers')
      .select('*')
      .eq('promotion_id', promotionId)
      .eq('number', number)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return (data as PromotionNumber) || null;
  } catch (error) {
    console.error('Erro ao verificar número duplicado:', error);
    return null;
  }
}
