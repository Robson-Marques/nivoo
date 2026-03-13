// Tipos para CUPONS

export type DiscountType = 'fixed' | 'percentage';
export type CouponType = 'purchase' | 'product';
export type PromotionType = 'code' | 'number';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_amount: number;
  discount_percentage: number;
  discount_type: DiscountType;
  coupon_type: CouponType;
  active: boolean;
  apply_to_all_products: boolean;
  applicable_products: string[];
  min_purchase_amount: number;
  max_uses?: number;
  current_uses: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CouponApplied {
  code: string;
  discount_amount: number;
  discount_percentage: number;
  discount_type: DiscountType;
}

// Tipos para PROMOÇÕES

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  promotion_type: PromotionType;
  participation_value: number;
  is_free: boolean;
  min_order_value: number;
  active: boolean;
  start_date: string;
  end_date: string;
  draw_date: string;
  number_of_winners: number;
  total_numbers?: number;
  image_url?: string;
  banner_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PromotionNumber {
  id: string;
  promotion_id: string;
  number: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  is_winner: boolean;
  prize_position?: number;
  created_at: string;
}

export interface PromotionWinner {
  id: string;
  promotion_id: string;
  promotion_number_id: string;
  order_id: string;
  number: string;
  prize_position: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  prize_description?: string;
  drawn_at: string;
  claimed_at?: string;
  created_at: string;
}

export interface CreateCouponInput {
  code: string;
  description?: string;
  discount_amount?: number;
  discount_percentage?: number;
  discount_type: DiscountType;
  coupon_type: CouponType;
  apply_to_all_products: boolean;
  applicable_products?: string[];
  min_purchase_amount?: number;
  max_uses?: number;
  expires_at?: string;
}

export interface UpdateCouponInput extends Partial<CreateCouponInput> {
  active?: boolean;
}

export interface CreatePromotionInput {
  name: string;
  description?: string;
  promotion_type: PromotionType;
  participation_value: number;
  is_free: boolean;
  min_order_value?: number;
  start_date: string;
  end_date: string;
  draw_date: string;
  number_of_winners: number;
  total_numbers?: number;
  image_url?: string;
  banner_url?: string;
}

export interface UpdatePromotionInput extends Partial<CreatePromotionInput> {
  active?: boolean;
}

export interface DrawWinnerResult {
  number: string;
  customer_name: string;
  customer_phone: string;
  order_id: string;
  prize_position: number;
}
