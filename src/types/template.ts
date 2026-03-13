// Types para Business Templates System

export type BusinessType =
  | 'pizzeria'
  | 'hamburger_shop'
  | 'restaurant'
  | 'pastry_shop'
  | 'snack_bar'
  | 'acai_shop'
  | 'bar'
  | 'cafe'
  | 'bakery'
  | 'other';

export interface BusinessTypeTemplate {
  id: string;
  business_type: BusinessType;
  display_name: string;
  description?: string;
  icon_emoji: string;
  is_active: boolean;
  template_config?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TemplateConfiguration {
  id: string;
  template_id: string;
  config_key: string;
  config_label: string;
  field_type: string;
  is_required: boolean;
  display_order: number;
  options?: any[];
  default_value?: string;
  help_text?: string;
  max_selections?: number;
  min_length?: number;
  max_length?: number;
  step?: number;
  min_value?: number;
  max_value?: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateAddon {
  id: string;
  template_id: string;
  name: string;
  description?: string;
  price: number;
  display_order: number;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Para aplicar template a um produto
export interface ApplyTemplatePayload {
  product_id: string;
  template_id: string;
  override_existing?: boolean; // Se true, sobrescreve configurações existentes
}

export interface TemplateApplicationResult {
  success: boolean;
  message: string;
  product_id: string;
  configurations_created: number;
  addons_created: number;
}
