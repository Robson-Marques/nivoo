// Arquivo que estende o Database type do Supabase com novas tabelas customizadas
import { Database as GeneratedDatabase } from './types';

// Estender o módulo Supabase
declare global {
  interface SupabaseDatabase {
    public: {
      Tables: {
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
        product_images: GeneratedDatabase['public']['Tables']['categories']; // Placeholder
        product_configurations: GeneratedDatabase['public']['Tables']['categories']; // Placeholder
        product_configuration_options: GeneratedDatabase['public']['Tables']['categories']; // Placeholder
        product_badges: GeneratedDatabase['public']['Tables']['categories']; // Placeholder
        product_enhancements: GeneratedDatabase['public']['Tables']['categories']; // Placeholder
      } & GeneratedDatabase['public']['Tables'];
      Functions: GeneratedDatabase['public']['Functions'];
      Enums: GeneratedDatabase['public']['Enums'];
      CompositeTypes: GeneratedDatabase['public']['CompositeTypes'];
    };
  }
}

// Tipo final para use
export type Database = SupabaseDatabase;
