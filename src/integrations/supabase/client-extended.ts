import { createClient } from '@supabase/supabase-js';
import type { Database as GeneratedDatabase } from './types';

// Define todas as tabelas customizadas
type CustomTables = {
  business_type_templates: {
    Row: {
      id: string;
      business_type: string;
      display_name: string;
      description: string | null;
      icon_emoji: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      business_type: string;
      display_name: string;
      description?: string | null;
      icon_emoji: string;
      is_active?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      business_type?: string;
      display_name?: string;
      description?: string | null;
      icon_emoji?: string;
      is_active?: boolean;
      updated_at?: string;
    };
  };
  template_configurations: {
    Row: {
      id: string;
      template_id: string;
      config_key: string;
      config_label: string;
      field_type: string;
      is_required: boolean;
      display_order: number;
      options: string | null;
      default_value: string | null;
      help_text: string | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      template_id: string;
      config_key: string;
      config_label: string;
      field_type: string;
      is_required?: boolean;
      display_order?: number;
      options?: string | null;
      default_value?: string | null;
      help_text?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      template_id?: string;
      config_key?: string;
      config_label?: string;
      field_type?: string;
      is_required?: boolean;
      display_order?: number;
      options?: string | null;
      default_value?: string | null;
      help_text?: string | null;
      updated_at?: string;
    };
  };
  template_addons: {
    Row: {
      id: string;
      template_id: string;
      name: string;
      description: string | null;
      price: number;
      display_order: number;
      category: string | null;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      template_id: string;
      name: string;
      description?: string | null;
      price: number;
      display_order?: number;
      category?: string | null;
      is_active?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      name?: string;
      description?: string | null;
      price?: number;
      display_order?: number;
      category?: string | null;
      is_active?: boolean;
      updated_at?: string;
    };
  };
  product_configurations: {
    Row: {
      id: string;
      product_id: string;
      config_key: string;
      config_label: string;
      field_type: string;
      is_required: boolean;
      display_order: number;
      options: string | null;
      default_value: string | null;
      help_text: string | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      product_id: string;
      config_key: string;
      config_label: string;
      field_type: string;
      is_required?: boolean;
      display_order?: number;
      options?: string | null;
      default_value?: string | null;
      help_text?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      product_id?: string;
      config_key?: string;
      config_label?: string;
      field_type?: string;
      is_required?: boolean;
      display_order?: number;
      options?: string | null;
      default_value?: string | null;
      help_text?: string | null;
      updated_at?: string;
    };
  };
  product_configuration_options: {
    Row: {
      id: string;
      configuration_id: string;
      option_label: string;
      option_value: string;
      additional_price: number;
      display_order: number;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      configuration_id: string;
      option_label: string;
      option_value: string;
      additional_price?: number;
      display_order?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      configuration_id?: string;
      option_label?: string;
      option_value?: string;
      additional_price?: number;
      display_order?: number;
      updated_at?: string;
    };
  };
  product_images: {
    Row: {
      id: string;
      product_id: string;
      image_url: string;
      alt_text: string | null;
      display_order: number;
      is_primary: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      product_id: string;
      image_url: string;
      alt_text?: string | null;
      display_order?: number;
      is_primary?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      product_id?: string;
      image_url?: string;
      alt_text?: string | null;
      display_order?: number;
      is_primary?: boolean;
      updated_at?: string;
    };
  };
  product_badges: {
    Row: {
      id: string;
      product_id: string;
      badge_type: string;
      badge_label: string;
      badge_color: string;
      badge_position: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      product_id: string;
      badge_type: string;
      badge_label: string;
      badge_color: string;
      badge_position: string;
      is_active?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      badge_type?: string;
      badge_label?: string;
      badge_color?: string;
      badge_position?: string;
      is_active?: boolean;
      updated_at?: string;
    };
  };
  product_enhancements: {
    Row: {
      id: string;
      product_id: string;
      expanded_description: string | null;
      trust_triggers: string[] | null;
      warranty_text: string | null;
      stock_warning: string | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      product_id: string;
      expanded_description?: string | null;
      trust_triggers?: string[] | null;
      warranty_text?: string | null;
      stock_warning?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      expanded_description?: string | null;
      trust_triggers?: string[] | null;
      warranty_text?: string | null;
      stock_warning?: string | null;
      updated_at?: string;
    };
  };
};

// Combine generated and custom tables
type AllTables = GeneratedDatabase['public']['Tables'] & CustomTables;

// Extended Database type with all tables
export interface ExtendedDatabase extends Omit<GeneratedDatabase, 'public'> {
  public: Omit<GeneratedDatabase['public'], 'Tables'> & {
    Tables: AllTables;
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<ExtendedDatabase>(supabaseUrl, supabaseAnonKey);
