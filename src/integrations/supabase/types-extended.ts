// Tipos estendidos para tabelas que ainda não existem no Supabase auto-generated
// Estes serão substituídos pela tipagem automática após as migrações serem aplicadas

export interface Database {
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
      product_configurations: {
        Row: {
          id: string;
          product_id: string;
          config_key: string;
          config_label: string;
          field_type: "radio" | "checkbox" | "select" | "text" | "number";
          is_required: boolean;
          display_order: number;
          max_selections: number | null;
          min_length: number | null;
          max_length: number | null;
          min_value: number | null;
          max_value: number | null;
          step: number | null;
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
          field_type: "radio" | "checkbox" | "select" | "text" | "number";
          is_required?: boolean;
          display_order?: number;
          max_selections?: number | null;
          min_length?: number | null;
          max_length?: number | null;
          min_value?: number | null;
          max_value?: number | null;
          step?: number | null;
          default_value?: string | null;
          help_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          config_key?: string;
          config_label?: string;
          field_type?: "radio" | "checkbox" | "select" | "text" | "number";
          is_required?: boolean;
          display_order?: number;
          max_selections?: number | null;
          min_length?: number | null;
          max_length?: number | null;
          min_value?: number | null;
          max_value?: number | null;
          step?: number | null;
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
          is_active: boolean;
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
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          option_label?: string;
          option_value?: string;
          additional_price?: number;
          display_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      product_badges: {
        Row: {
          id: string;
          product_id: string;
          badge_type: "new" | "promotion" | "low_stock" | "custom";
          badge_label: string;
          badge_color: string;
          badge_position: "top_left" | "top_right" | "bottom_left" | "bottom_right";
          show_condition: Record<string, unknown> | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          badge_type: "new" | "promotion" | "low_stock" | "custom";
          badge_label: string;
          badge_color: string;
          badge_position: "top_left" | "top_right" | "bottom_left" | "bottom_right";
          show_condition?: Record<string, unknown> | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          badge_type?: "new" | "promotion" | "low_stock" | "custom";
          badge_label?: string;
          badge_color?: string;
          badge_position?: "top_left" | "top_right" | "bottom_left" | "bottom_right";
          show_condition?: Record<string, unknown> | null;
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
          highlight_section: Record<string, unknown>[] | null;
          visibility_rules: Record<string, unknown> | null;
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
          highlight_section?: Record<string, unknown>[] | null;
          visibility_rules?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          expanded_description?: string | null;
          trust_triggers?: string[] | null;
          warranty_text?: string | null;
          stock_warning?: string | null;
          highlight_section?: Record<string, unknown>[] | null;
          visibility_rules?: Record<string, unknown> | null;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_product_with_gallery: {
        Args: {
          p_product_id: string;
          p_include_configs?: boolean;
          p_include_badges?: boolean;
        };
        Returns: {
          product_id: string;
          images: Record<string, unknown>[];
          configurations: Record<string, unknown>[];
          badges: Record<string, unknown>[];
          enhancements: Record<string, unknown> | null;
        }[];
      };
      save_product_configurations: {
        Args: {
          p_product_id: string;
          p_configurations: Record<string, unknown>[];
        };
        Returns: {
          success: boolean;
          message: string;
        };
      };
      reorder_product_images: {
        Args: {
          p_product_id: string;
          p_image_orders: Record<string, unknown>[];
        };
        Returns: {
          success: boolean;
          message: string;
        };
      };
      get_product_configuration_preview: {
        Args: {
          p_product_id: string;
        };
        Returns: {
          html: string;
          total_additional_price: number;
        };
      };
      upsert_product_badge: {
        Args: {
          p_product_id: string;
          p_badge_type: string;
          p_badge_label: string;
          p_badge_color: string;
          p_badge_position: string;
        };
        Returns: {
          id: string;
          product_id: string;
          badge_type: string;
        };
      };
      upsert_product_enhancement: {
        Args: {
          p_product_id: string;
          p_expanded_description?: string;
          p_trust_triggers?: string[];
          p_warranty_text?: string;
          p_stock_warning?: string;
          p_highlight_section?: Record<string, unknown>[];
        };
        Returns: {
          id: string;
          product_id: string;
        };
      };
    };
  };
}
