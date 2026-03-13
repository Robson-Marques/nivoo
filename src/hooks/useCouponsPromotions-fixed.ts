import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Coupon,
  CreateCouponInput,
  UpdateCouponInput,
  Promotion,
  CreatePromotionInput,
  UpdatePromotionInput,
  PromotionNumber,
  PromotionWinner,
  DrawWinnerResult,
} from '@/types/coupon';

// Helper para usar tabelas novas
const queryFrom = (table: string) => (supabase.from(table as any) as any);

// ============================================================================
// HOOKS PARA CUPONS
// ============================================================================

export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await queryFrom('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Coupon[];
    },
  });
}

export function useCoupon(code: string) {
  return useQuery({
    queryKey: ['coupon', code],
    queryFn: async () => {
      const { data, error } = await queryFrom('coupons')
        .select('*')
        .eq('code', code)
        .single();

      if (error) throw error;
      return data as Coupon;
    },
    enabled: !!code,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCouponInput) => {
      const { data, error } = await queryFrom('coupons')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data as Coupon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Cupom criado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao criar cupom: ${error.message}`);
    },
  });
}

export function useUpdateCoupon(couponId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCouponInput) => {
      const { data, error } = await queryFrom('coupons')
        .update(input)
        .eq('id', couponId)
        .select()
        .single();

      if (error) throw error;
      return data as Coupon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon'] });
      toast.success('Cupom atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar cupom: ${error.message}`);
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (couponId: string) => {
      const { error } = await queryFrom('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Cupom deletado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao deletar cupom: ${error.message}`);
    },
  });
}

export function useValidateCoupon(code: string, orderValue: number) {
  return useQuery({
    queryKey: ['validate-coupon', code, orderValue],
    queryFn: async () => {
      const { data, error } = await queryFrom('coupons')
        .select('*')
        .eq('code', code)
        .eq('active', true)
        .single();

      if (error) throw new Error('Cupom não encontrado');

      const coupon = data as Coupon;

      // Verifica se o cupom expirou
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        throw new Error('Cupom expirado');
      }

      // Verifica se atingiu o limite de uso
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        throw new Error('Cupom atingiu o limite de uso');
      }

      // Verifica valor mínimo
      if (orderValue < coupon.min_purchase_amount) {
        throw new Error(
          `Valor mínimo de compra é R$ ${coupon.min_purchase_amount.toFixed(2)}`
        );
      }

      return coupon;
    },
    enabled: !!code && orderValue > 0,
  });
}

// ============================================================================
// HOOKS PARA PROMOÇÕES
// ============================================================================

export function usePromotions() {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const { data, error } = await queryFrom('promotions')
        .select('*')
        .order('draw_date', { ascending: false });

      if (error) throw error;
      return data as Promotion[];
    },
  });
}

export function useActivePromotions() {
  return useQuery({
    queryKey: ['active-promotions'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await queryFrom('promotions')
        .select('*')
        .eq('active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('draw_date', { ascending: true });

      if (error) throw error;
      return data as Promotion[];
    },
  });
}

export function usePromotion(promotionId: string) {
  return useQuery({
    queryKey: ['promotion', promotionId],
    queryFn: async () => {
      const { data, error } = await queryFrom('promotions')
        .select('*')
        .eq('id', promotionId)
        .single();

      if (error) throw error;
      return data as Promotion;
    },
    enabled: !!promotionId,
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePromotionInput) => {
      const { data, error } = await queryFrom('promotions')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data as Promotion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promoção criada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao criar promoção: ${error.message}`);
    },
  });
}

export function useUpdatePromotion(promotionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePromotionInput) => {
      const { data, error } = await queryFrom('promotions')
        .update(input)
        .eq('id', promotionId)
        .select()
        .single();

      if (error) throw error;
      return data as Promotion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion'] });
      toast.success('Promoção atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar promoção: ${error.message}`);
    },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promotionId: string) => {
      const { error } = await queryFrom('promotions')
        .delete()
        .eq('id', promotionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promoção deletada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao deletar promoção: ${error.message}`);
    },
  });
}

// ============================================================================
// HOOKS PARA NÚMEROS DE PROMOÇÃO
// ============================================================================

export function usePromotionNumbers(promotionId: string) {
  return useQuery({
    queryKey: ['promotion-numbers', promotionId],
    queryFn: async () => {
      const { data, error } = await queryFrom('promotion_numbers')
        .select('*')
        .eq('promotion_id', promotionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PromotionNumber[];
    },
    enabled: !!promotionId,
  });
}

export function useCreatePromotionNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<PromotionNumber, 'id' | 'created_at'>) => {
      const { data: result, error } = await queryFrom('promotion_numbers')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result as PromotionNumber;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['promotion-numbers', variables.promotion_id],
      });
    },
    onError: (error) => {
      console.error('Erro ao criar número de promoção:', error);
    },
  });
}

// ============================================================================
// HOOKS PARA SORTEIO
// ============================================================================

export function useDrawWinners(promotionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Buscar promoção
      const { data: promotion, error: promoError } = await queryFrom('promotions')
        .select('*')
        .eq('id', promotionId)
        .single();

      if (promoError) throw promoError;

      // Buscar números não vencedores
      const { data: availableNumbers, error: numbersError } = await queryFrom('promotion_numbers')
        .select('*')
        .eq('promotion_id', promotionId)
        .eq('is_winner', false);

      if (numbersError) throw numbersError;

      if (!availableNumbers || availableNumbers.length === 0) {
        throw new Error('Não há números disponíveis para sorteio');
      }

      const winners: DrawWinnerResult[] = [];

      // Sortear quantos ganhadores foram configurados
      for (let i = 0; i < promotion.number_of_winners; i++) {
        if (availableNumbers.length === 0) break;

        // Selecionar índice aleatório
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const winner = availableNumbers[randomIndex];

        // Remover da lista para não sortear novamente
        availableNumbers.splice(randomIndex, 1);

        winners.push({
          number: winner.number,
          customer_name: winner.customer_name,
          customer_phone: winner.customer_phone,
          order_id: winner.order_id,
          prize_position: i + 1,
        });

        // Atualizar número como vencedor
        await queryFrom('promotion_numbers')
          .update({ is_winner: true, prize_position: i + 1 })
          .eq('id', winner.id);

        // Criar registro de ganhador
        await queryFrom('promotion_winners').insert([
          {
            promotion_id: promotionId,
            promotion_number_id: winner.id,
            order_id: winner.order_id,
            number: winner.number,
            prize_position: i + 1,
            customer_name: winner.customer_name,
            customer_phone: winner.customer_phone,
            customer_email: winner.customer_email,
            drawn_at: new Date().toISOString(),
          },
        ]);
      }

      return winners;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion-winners'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-numbers'] });
      toast.success('Sorteio realizado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao realizar sorteio: ${error.message}`);
    },
  });
}

export function usePromotionWinners(promotionId: string) {
  return useQuery({
    queryKey: ['promotion-winners', promotionId],
    queryFn: async () => {
      const { data, error } = await queryFrom('promotion_winners')
        .select('*')
        .eq('promotion_id', promotionId)
        .order('prize_position', { ascending: true });

      if (error) throw error;
      return data as PromotionWinner[];
    },
    enabled: !!promotionId,
  });
}
