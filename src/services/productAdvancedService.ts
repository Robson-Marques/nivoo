// Serviço para API de Galeria, Configurações e Enhancements
// Comunicação com RPCs e manipulação de dados

import { supabase } from "@/integrations/supabase/client";
import {
  ProductImage,
  ProductConfiguration,
  ProductBadge,
  ProductEnhancement,
  ProductExtended,
  ValidationResult,
  ValidationError,
} from "@/types/productAdvanced";

// Cache para produtos estendidos (5 minutos)
const productCache = new Map<string, { data: ProductExtended | null; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Helper para acessar tabelas que ainda não existem no tipo Supabase
const db = () => supabase as any;

// =====================================================
// PRODUCT IMAGES SERVICE
// =====================================================

export const productImagesService = {
  /**
   * Buscar todas as imagens de um produto
   */
  async getProductImages(productId: string): Promise<ProductImage[]> {
    try {
      // Tentar query direta à tabela (mais rápido e confiável que RPC)
      const { data, error } = await db()
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("is_primary", { ascending: false })
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Erro ao buscar imagens (query):", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((img: any) => ({
        id: img.id,
        productId: img.product_id,
        imageUrl: img.image_url,
        altText: img.alt_text,
        displayOrder: img.display_order,
        isPrimary: img.is_primary,
        createdAt: img.created_at,
        updatedAt: img.updated_at,
      }));
    } catch (error) {
      console.error("❌ Erro ao buscar imagens do produto:", error);
      // Retornar array vazio em vez de lançar erro para não quebrar UI
      return [];
    }
  },

  async addProductImage(
    productId: string,
    imageUrl: string,
    altText?: string,
    setAsPrimary: boolean = false
  ): Promise<ProductImage> {
    try {
      const existingImages = await this.getProductImages(productId);
      const isPrimary = setAsPrimary || existingImages.length === 0;
      const displayOrder = existingImages.length;

      const { data, error } = await db()
        .from("product_images")
        .insert({
          product_id: productId,
          image_url: imageUrl,
          alt_text: altText || "",
          display_order: displayOrder,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Erro ao inserir na tabela:");
        console.error("   Código:", error.code);
        console.error("   Mensagem:", error.message);
        console.error("   Detalhes:", error.details);
        console.error("   Dica:", error.hint);
        console.error("   Erro completo:", JSON.stringify(error, null, 2));
        throw new Error(`Erro ao salvar imagem: ${error.message || error.code || "Desconhecido"}`);
      }

      if (!data) {
        console.error("❌ Nenhum dado retornado após insert");
        throw new Error("Nenhum dado retornado após salvar imagem");
      }

      // Se a imagem foi marcada como primária, sincronizar também no produto
      // (a UI do sistema usa products.image_url como imagem principal)
      if (data.is_primary) {
        const { error: productUpdateError } = await supabase
          .from("products")
          .update({ image_url: data.image_url })
          .eq("id", productId);
        if (productUpdateError) {
          console.error("Erro ao sincronizar imagem principal no produto:", productUpdateError);
          throw new Error(
            `Erro ao atualizar imagem principal do produto: ${productUpdateError.message || "falha desconhecida"}`
          );
        }

        // Invalida cache do produto estendido para refletir mudança imediatamente
        productCache.delete(productId);
      }

      return {
        id: data.id,
        productId: data.product_id,
        imageUrl: data.image_url,
        altText: data.alt_text,
        displayOrder: data.display_order,
        isPrimary: data.is_primary,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error("❌ Erro ao adicionar imagem:", error);
      throw error;
    }
  },

  /**
   * Deletar imagem de um produto
   */
  async deleteProductImage(imageId: string): Promise<void> {
    try {
      const { error } = await db()
        .from("product_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao deletar imagem:", error);
      throw error;
    }
  },

  /**
   * Atualizar ordem das imagens
   */
  async reorderProductImages(
    productId: string,
    imageOrders: Array<{ id: string; order: number }>
  ): Promise<void> {
    try {
      for (const order of imageOrders) {
        const { error } = await db()
          .from("product_images")
          .update({ display_order: order.order })
          .eq("id", order.id);
        if (error) throw error;
      }
    } catch (error) {
      console.error("Erro ao reordenar imagens:", error);
      throw error;
    }
  },

  /**
   * Definir imagem primária
   */
  async setPrimaryImage(imageId: string, productId: string): Promise<void> {
    try {
      // Remove primary de todas as imagens do produto
      await db()
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", productId);

      // Define nova imagem como primary
      const { error } = await db()
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", imageId);

      if (error) throw error;

      // Sincronizar a imagem primária com a tabela products
      // (várias telas leem products.image_url para exibir a imagem do produto)
      const { data: imageRow, error: imageFetchError } = await db()
        .from("product_images")
        .select("image_url")
        .eq("id", imageId)
        .single();

      if (!imageFetchError && imageRow?.image_url) {
        const { error: productUpdateError } = await supabase
          .from("products")
          .update({ image_url: imageRow.image_url })
          .eq("id", productId);

        if (productUpdateError) {
          console.error("Erro ao atualizar products.image_url:", productUpdateError);
          throw new Error(
            `Erro ao atualizar imagem principal do produto: ${productUpdateError.message || "falha desconhecida"}`
          );
        }

        // Invalida cache do produto estendido para refletir mudança imediatamente
        productCache.delete(productId);
      } else if (imageFetchError) {
        console.error("Erro ao buscar URL da imagem primária:", imageFetchError);
        throw imageFetchError;
      }
    } catch (error) {
      console.error("Erro ao definir imagem primária:", error);
      throw error;
    }
  },
};

// =====================================================
// PRODUCT CONFIGURATIONS SERVICE
// =====================================================

export const productConfigurationsService = {
  /**
   * Carrega configurações de um produto do banco de dados
   */
  async getProductConfigurations(
    productId: string
  ): Promise<ProductConfiguration[]> {
    console.log(`🔧 [getProductConfigurations] Carregando configurações do produto ${productId}...`);
    
    try {
      // Primeiro, tentar carregar do localStorage
      const localStorageKey = `product_configurations_${productId}`;
      const storedConfigurations = localStorage.getItem(localStorageKey);
      
      if (storedConfigurations) {
        const configurations = JSON.parse(storedConfigurations);
        console.log(`✅ [getProductConfigurations] ${configurations.length} configurações carregadas do localStorage`);
        
        // Converter para o formato esperado pela UI
        return configurations.map((config: any) => ({
          id: config.id || `local-${Date.now()}`,
          productId: productId,
          configKey: config.configKey || config.config_key,
          configLabel: config.configLabel || config.config_label,
          fieldType: config.fieldType || config.field_type,
          isRequired: config.isRequired || config.is_required,
          displayOrder: config.displayOrder || config.display_order,
          maxSelections: config.maxSelections || config.max_selections,
          minLength: config.minLength || config.min_length,
          maxLength: config.maxLength || config.max_length,
          step: config.step,
          minValue: config.minValue || config.min_value,
          maxValue: config.maxValue || config.max_value,
          defaultValue: config.defaultValue || config.default_value,
          helpText: config.helpText || config.help_text,
          createdAt: config.createdAt || config.created_at || new Date().toISOString(),
          updatedAt: config.updatedAt || config.updated_at || new Date().toISOString(),
          options: Array.isArray(config.options) ? config.options : [],
          productConfigurationOptions: []
        }));
      }

      // Se não encontrar no localStorage, retornar array vazio
      console.warn('⚠️ Nenhuma configuração encontrada no localStorage. Retornando vazio...');
      return [];
      
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      
      // Fallback para array vazio
      console.warn('⚠️ Usando array vazio como fallback');
      return [];
    }
  },

  /**
   * Salvar múltiplas configurações de uma vez
   */
  async saveProductConfigurations(
    productId: string,
    configurations: any[]
  ): Promise<void> {
    try {
      // Deleta configurações antigas
      await db()
        .from("product_configurations")
        .delete()
        .eq("product_id", productId);

      // Insere novas
      for (const config of configurations) {
        const { data: configData, error: configError } = await db()
          .from("product_configurations")
          .insert({
            product_id: productId,
            config_key: config.configKey,
            config_label: config.configLabel,
            field_type: config.fieldType,
            is_required: config.isRequired || false,
            display_order: config.displayOrder || 0,
            max_selections: config.maxSelections || null,
            min_length: config.minLength || null,
            max_length: config.maxLength || null,
            min_value: config.minValue || null,
            max_value: config.maxValue || null,
            step: config.step || null,
            default_value: config.defaultValue || null,
            help_text: config.helpText || null,
          })
          .select()
          .single();

        if (configError) throw configError;

        // Insere opções
        if (config.options && config.options.length > 0) {
          const { error: optError } = await db()
            .from("product_configuration_options")
            .insert(
              config.options.map((opt: any, idx: number) => ({
                configuration_id: configData.id,
                option_label: opt.label,
                option_value: opt.value,
                additional_price: opt.additionalPrice || 0,
                display_order: idx,
                is_active: true,
              }))
            );
          if (optError) throw optError;
        }
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      throw error;
    }
  },

  /**
   * Adicionar uma configuração individual (modo localStorage)
   */
  async addConfiguration(
    productId: string,
    config: any
  ): Promise<ProductConfiguration> {
    try {
      console.log(`➕ [addConfiguration] Adicionando configuração ${config.configKey} ao produto ${productId}`);
      
      // Buscar configurações existentes
      const existingConfigs = await this.getProductConfigurations(productId);
      
      // Criar nova configuração com ID único
      const newConfig: ProductConfiguration = {
        id: `local-${Date.now()}`,
        productId,
        configKey: config.configKey,
        configLabel: config.configLabel,
        fieldType: config.fieldType,
        isRequired: config.isRequired || false,
        displayOrder: config.displayOrder || 0,
        maxSelections: config.maxSelections || null,
        minLength: config.minLength || null,
        maxLength: config.maxLength || null,
        step: config.step || null,
        minValue: config.minValue || null,
        maxValue: config.maxValue || null,
        defaultValue: config.defaultValue || null,
        helpText: config.helpText || null,
        options: Array.isArray(config.options) ? config.options : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Adicionar às configurações existentes
      const updatedConfigs = [...existingConfigs, newConfig];
      
      // Salvar no localStorage
      const key = `product_configurations_${productId}`;
      localStorage.setItem(key, JSON.stringify(updatedConfigs));
      
      console.log(`✅ [addConfiguration] Configuração adicionada com sucesso`);
      return newConfig;
    } catch (error) {
      console.error("❌ Erro ao adicionar configuração:", error);
      throw error;
    }
  },

  /**
   * Atualizar uma configuração individual
   */
  async updateConfiguration(
    configId: string,
    config: any
  ): Promise<ProductConfiguration> {
    try {
      // Atualizar configuração
      const { data: configData, error: configError } = await db()
        .from("product_configurations")
        .update({
          config_key: config.configKey,
          config_label: config.configLabel,
          field_type: config.fieldType,
          is_required: config.isRequired || false,
          display_order: config.displayOrder || 0,
          max_selections: config.maxSelections || null,
          min_length: config.minLength || null,
          max_length: config.maxLength || null,
          min_value: config.minValue || null,
          max_value: config.maxValue || null,
          step: config.step || null,
          default_value: config.defaultValue || null,
          help_text: config.helpText || null,
        })
        .eq("id", configId)
        .select()
        .single();

      if (configError) {
        console.error("❌ Erro ao atualizar configuração no banco:", configError);
        throw configError;
      }

      // Deletar opções antigas
      const { error: delError } = await db()
        .from("product_configuration_options")
        .delete()
        .eq("configuration_id", configId);

      if (delError) {
        console.error("❌ Erro ao deletar opções antigas:", delError);
        throw delError;
      }
      // Inserir opções novas
      if (config.options && config.options.length > 0) {
        const { error: optError } = await db()
          .from("product_configuration_options")
          .insert(
            config.options.map((opt: any, idx: number) => ({
              configuration_id: configId,
              option_label: opt.label,
              option_value: opt.value || opt.label,
              additional_price: opt.additionalPrice || 0,
              display_order: idx,
              is_active: true,
            }))
          );

        if (optError) {
          console.error("❌ Erro ao inserir opções:", optError);
          throw optError;
        }
      }

      const result: ProductConfiguration = {
        id: configId,
        productId: config.productId,
        configKey: config.configKey,
        configLabel: config.configLabel,
        fieldType: config.fieldType,
        isRequired: config.isRequired || false,
        displayOrder: config.displayOrder || 0,
        maxSelections: config.maxSelections || null,
        minLength: config.minLength || null,
        maxLength: config.maxLength || null,
        step: config.step || null,
        minValue: config.minValue || null,
        maxValue: config.maxValue || null,
        defaultValue: config.defaultValue || null,
        helpText: config.helpText || null,
        options: config.options || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return result;
    } catch (error) {
      console.error("Erro ao atualizar configuração:", error);
      throw error;
    }
  },

  /**
   * Deletar uma configuração (modo localStorage)
   */
  async deleteConfiguration(configId: string): Promise<void> {
    try {
      console.log(`🗑️ [deleteConfiguration] Removendo configuração ${configId} do localStorage`);
      
      // Encontrar todas as chaves de configurações de produtos
      const keys = Object.keys(localStorage).filter(key => key.startsWith('product_configurations_'));
      
      for (const key of keys) {
        const configurations = JSON.parse(localStorage.getItem(key) || '[]');
        const updatedConfigurations = configurations.filter((config: any) => config.id !== configId);
        
        if (updatedConfigurations.length !== configurations.length) {
          localStorage.setItem(key, JSON.stringify(updatedConfigurations));
          console.log(`✅ [deleteConfiguration] Configuração ${configId} removida do localStorage`);
          return;
        }
      }
      
      console.warn(`⚠️ [deleteConfiguration] Configuração ${configId} não encontrada`);
    } catch (error) {
      console.error('❌ Erro ao deletar configuração:', error);
      throw error;
    }
  },

  /**
   * Atualizar uma configuração individual (modo localStorage)
   */
  async updateConfiguration(
    configId: string,
    config: any
  ): Promise<ProductConfiguration> {
    try {
      console.log(`📝 [updateConfiguration] Atualizando configuração ${configId} no localStorage`);
      
      // Encontrar a chave do produto
      const keys = Object.keys(localStorage).filter(key => key.startsWith('product_configurations_'));
      
      for (const key of keys) {
        const configurations = JSON.parse(localStorage.getItem(key) || '[]');
        const configIndex = configurations.findIndex((c: any) => c.id === configId);
        
        if (configIndex !== -1) {
          // Atualizar configuração
          configurations[configIndex] = {
            ...configurations[configIndex],
            config_key: config.configKey,
            config_label: config.configLabel,
            field_type: config.fieldType,
            is_required: config.isRequired,
            display_order: config.displayOrder,
            max_selections: config.maxSelections,
            min_length: config.minLength,
            max_length: config.maxLength,
            step: config.step,
            min_value: config.minValue,
            max_value: config.maxValue,
            default_value: config.defaultValue,
            help_text: config.helpText,
            options: Array.isArray(config.options) ? config.options : [],
            updated_at: new Date().toISOString()
          };
          
          localStorage.setItem(key, JSON.stringify(configurations));
          console.log(`✅ [updateConfiguration] Configuração ${configId} atualizada`);
          
          return {
            id: configId,
            productId: configurations[configIndex].product_id,
            configKey: config.configKey,
            configLabel: config.configLabel,
            fieldType: config.fieldType,
            isRequired: config.isRequired,
            displayOrder: config.displayOrder,
            maxSelections: config.maxSelections,
            minLength: config.minLength,
            maxLength: config.maxLength,
            step: config.step,
            minValue: config.minValue,
            maxValue: config.maxValue,
            defaultValue: config.defaultValue,
            helpText: config.helpText,
            options: Array.isArray(config.options) ? config.options : [],
            createdAt: configurations[configIndex].created_at,
            updatedAt: new Date().toISOString()
          };
        }
      }
      
      throw new Error(`Configuração ${configId} não encontrada`);
    } catch (error) {
      console.error("❌ Erro ao atualizar configuração:", error);
      throw error;
    }
  },

  /**
   * Obter preview de configuração (calculado localmente)
   */
  async getConfigurationPreview(productId: string): Promise<any> {
    try {
      const configurations = await this.getProductConfigurations(productId);
      // Retorna apenas as configurações, não há RPC no mockup
      return {
        html: `<div>${configurations.map((c) => `<p>${c.configLabel}</p>`).join("")}</div>`,
        total_additional_price: 0,
      };
    } catch (error) {
      console.error("Erro ao obter preview:", error);
      return { html: "", total_additional_price: 0 };
    }
  },
};

// =====================================================
// PRODUCT BADGES SERVICE
// =====================================================

export const productBadgesService = {
  /**
   * Buscar badges de um produto
   */
  async getProductBadges(productId: string): Promise<ProductBadge[]> {
    try {
      const { data, error } = await db()
        .from("product_badges")
        .select("*")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("badge_position", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar badges:", error);
      return [];
    }
  },

  /**
   * Adicionar badge ao produto
   */
  async addProductBadge(
    productId: string,
    badge: any
  ): Promise<ProductBadge> {
    try {
      const { data, error } = await db()
        .from("product_badges")
        .insert({
          product_id: productId,
          badge_type: badge.badgeType,
          badge_label: badge.badgeLabel,
          badge_color: badge.badgeColor,
          badge_position: badge.badgePosition,
          show_condition: badge.showCondition,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao adicionar badge:", error);
      throw error;
    }
  },

  /**
   * Deletar badge
   */
  async deleteBadge(badgeId: string): Promise<void> {
    try {
      const { error } = await db()
        .from("product_badges")
        .update({ is_active: false })
        .eq("id", badgeId);

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao deletar badge:", error);
      throw error;
    }
  },
};

// =====================================================
// PRODUCT ENHANCEMENTS SERVICE
// =====================================================

export const productEnhancementsService = {
  /**
   * Buscar enhancement de um produto
   */
  async getProductEnhancement(
    productId: string
  ): Promise<ProductEnhancement | null> {
    try {
      const { data, error } = await db()
        .from("product_enhancements")
        .select("*")
        .eq("product_id", productId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    } catch (error) {
      console.error("Erro ao buscar enhancement:", error);
      return null;
    }
  },

  /**
   * Criar ou atualizar enhancement
   */
  async upsertProductEnhancement(
    productId: string,
    enhancement: any
  ): Promise<ProductEnhancement> {
    try {
      const { data, error } = await db()
        .from("product_enhancements")
        .upsert({
          product_id: productId,
          expanded_description: enhancement.expandedDescription,
          trust_triggers: enhancement.trustTriggers || [],
          warranty_text: enhancement.warrantyText,
          stock_warning: enhancement.stockWarning,
          highlight_section: enhancement.highlightSection,
          visibility_rules: enhancement.visibilityRules,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao atualizar enhancement:", error);
      throw error;
    }
  },
};

// =====================================================
// PRODUCT EXTENDED SERVICE (Combinado)
// =====================================================

export const productExtendedService = {
  /**
   * Buscar produto com TODAS as imagens, configurações, badges e enhancements
   */
  async getProductWithGallery(
    productId: string,
    includeConfigs: boolean = true,
    includeBadges: boolean = true
  ): Promise<ProductExtended | null> {
    try {
      // Validar cache
      const cached = productCache.get(productId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          return cached.data;
      }

      // Busca produto base
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (productError) throw productError;
      if (!product) {
        console.warn("❌ Produto não encontrado:", productId);
        return null;
      }

      // Carregar imagens, configurações, badges e enhancements em PARALELO
      const [images, configurations, badges, enhancements] = await Promise.all([
        productImagesService.getProductImages(productId),
        includeConfigs 
          ? productConfigurationsService.getProductConfigurations(productId)
          : Promise.resolve([]),
        includeBadges 
          ? productBadgesService.getProductBadges(productId)
          : Promise.resolve([]),
        productEnhancementsService.getProductEnhancement(productId),
      ]);

      const result = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.image_url,
        category: product.category_id,
        available: product.available,
        featured: product.featured,
        configurationTemplate: (product as any).configuration_template || "default",
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at),
        images,
        configurations,
        badges,
        enhancements,
      };

      // Salvar no cache
      productCache.set(productId, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      console.error("❌ Erro ao buscar produto com galeria:", error);
      return null;
    }
  },

  /**
   * Buscar múltiplos produtos com galeria (para listagem)
   */
  async getProductsWithGallery(
    productIds: string[]
  ): Promise<ProductExtended[]> {
    try {
      const promises = productIds.map((id) =>
        this.getProductWithGallery(id, false, true)
      );
      const products = await Promise.all(promises);
      return products.filter((p) => p !== null) as ProductExtended[];
    } catch (error) {
      console.error("Erro ao buscar múltiplos produtos:", error);
      return [];
    }
  },
};

// =====================================================
// VALIDAÇÃO
// =====================================================

export const productValidationService = {
  /**
   * Validar configurações selecionadas
   */
  validateConfigurations(
    configurations: ProductConfiguration[],
    selectedConfigs: Record<string, any>
  ): ValidationResult {
    const errors: ValidationError[] = [];

    for (const config of configurations) {
      if (config.isRequired && !selectedConfigs[config.configKey]) {
        errors.push({
          field: config.configKey,
          message: `${config.configLabel} é obrigatório`,
        });
      }

      if (
        config.fieldType === "checkbox" &&
        config.maxSelections &&
        Array.isArray(selectedConfigs[config.configKey])
      ) {
        if (selectedConfigs[config.configKey].length > config.maxSelections) {
          errors.push({
            field: config.configKey,
            message: `Máximo ${config.maxSelections} seleções permitidas`,
          });
        }
      }

      if (config.fieldType === "text" && selectedConfigs[config.configKey]) {
        const value = String(selectedConfigs[config.configKey]);
        if (config.minLength && value.length < config.minLength) {
          errors.push({
            field: config.configKey,
            message: `Mínimo ${config.minLength} caracteres`,
          });
        }
        if (config.maxLength && value.length > config.maxLength) {
          errors.push({
            field: config.configKey,
            message: `Máximo ${config.maxLength} caracteres`,
          });
        }
      }

      if (config.fieldType === "number" && selectedConfigs[config.configKey]) {
        const value = Number(selectedConfigs[config.configKey]);
        if (config.minValue && value < config.minValue) {
          errors.push({
            field: config.configKey,
            message: `Valor mínimo: ${config.minValue}`,
          });
        }
        if (config.maxValue && value > config.maxValue) {
          errors.push({
            field: config.configKey,
            message: `Valor máximo: ${config.maxValue}`,
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Calcular preço adicional das configurações
   */
  calculateAdditionalPrice(
    configurations: ProductConfiguration[],
    selectedConfigs: Record<string, any>
  ): number {
    let totalAdditional = 0;

    for (const config of configurations) {
      const selected = selectedConfigs[config.configKey];
      if (!selected) continue;

      if (
        config.fieldType === "radio" ||
        config.fieldType === "select"
      ) {
        const option = config.options.find((o) => o.value === selected);
        if (option) {
          totalAdditional += option.additionalPrice;
        }
      } else if (config.fieldType === "checkbox") {
        const selectedValues = Array.isArray(selected) ? selected : [selected];
        for (const value of selectedValues) {
          const option = config.options.find((o) => o.value === value);
          if (option) {
            totalAdditional += option.additionalPrice;
          }
        }
      }
    }

    return totalAdditional;
  },

  // Método para retornar configurações mock quando a tabela não existe
  getMockConfigurations(productId: string): ProductConfiguration[] {
    // Verificar qual template foi aplicado ao produto via localStorage
    let appliedTemplateId: string | null = null;
    
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('applied_templates');
        const appliedTemplates = stored ? JSON.parse(stored) : {};
        appliedTemplateId = appliedTemplates[productId] || null;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao ler templates aplicados:', error);
    }
    
    console.log(`🎯 [getMockConfigurations] Template aplicado ao produto ${productId}: ${appliedTemplateId}`);
    
    // Simular configurações baseadas no template aplicado
    const mockConfigs: Record<string, ProductConfiguration[]> = {
      // Exemplo: se o produto teve template de pizzaria aplicado
      'pizzaria-config': [
        {
          id: 'mock-conf-1',
          productId: productId,
          configKey: 'size',
          configLabel: 'Tamanho',
          fieldType: 'select',
          isRequired: true,
          displayOrder: 1,
          maxSelections: 1,
          options: [
            { id: 'opt-1', label: 'Pequena (25cm)', value: 'small', additionalPrice: 0 },
            { id: 'opt-2', label: 'Média (30cm)', value: 'medium', additionalPrice: 10 },
            { id: 'opt-3', label: 'Grande (35cm)', value: 'large', additionalPrice: 20 },
            { id: 'opt-4', label: 'Extra Grande (40cm)', value: 'xlarge', additionalPrice: 30 },
          ],
          defaultValue: 'medium',
          helpText: 'Escolha o tamanho da pizza',
        },
        {
          id: 'mock-conf-2',
          productId: productId,
          configKey: 'crust',
          configLabel: 'Borda',
          fieldType: 'select',
          isRequired: true,
          displayOrder: 2,
          maxSelections: 1,
          options: [
            { id: 'opt-5', label: 'Tradicional', value: 'traditional', additionalPrice: 0 },
            { id: 'opt-6', label: 'Crocante', value: 'crispy', additionalPrice: 0 },
            { id: 'opt-7', label: 'Recheada', value: 'stuffed', additionalPrice: 5 },
            { id: 'opt-8', label: 'Sem Borda', value: 'no_crust', additionalPrice: 0 },
          ],
          defaultValue: 'traditional',
          helpText: 'Escolha o tipo de borda',
        },
        {
          id: 'mock-conf-3',
          productId: productId,
          configKey: 'flavor',
          configLabel: 'Sabor',
          fieldType: 'select',
          isRequired: true,
          displayOrder: 3,
          maxSelections: 1,
          options: [
            { id: 'opt-9', label: 'Calabresa', value: 'calabresa', additionalPrice: 0 },
            { id: 'opt-10', label: 'Muçarela', value: 'muzzarella', additionalPrice: 0 },
            { id: 'opt-11', label: 'Portuguesa', value: 'portuguesa', additionalPrice: 5 },
            { id: 'opt-12', label: 'Quatro Queijos', value: 'four_cheeses', additionalPrice: 8 },
            { id: 'opt-13', label: 'Frango com Catupiry', value: 'chicken_catupiry', additionalPrice: 7 },
            { id: 'opt-14', label: 'Moda da Casa', value: 'house_special', additionalPrice: 10 },
          ],
          defaultValue: 'muzzarella',
          helpText: 'Escolha o sabor da pizza',
        },
      ],
      // Exemplo: se o produto teve template de hamburgueria aplicado
      'hamburgueria-config': [
        {
          id: 'mock-conf-4',
          productId: productId,
          configKey: 'size',
          configLabel: 'Tamanho',
          fieldType: 'select',
          isRequired: true,
          displayOrder: 1,
          maxSelections: 1,
          options: [
            { id: 'opt-15', label: 'Simples', value: 'simple', additionalPrice: 0 },
            { id: 'opt-16', label: 'Duplo', value: 'double', additionalPrice: 8 },
            { id: 'opt-17', label: 'Triplo', value: 'triple', additionalPrice: 16 },
          ],
          defaultValue: 'simple',
          helpText: 'Escolha o tamanho do burger',
        },
        {
          id: 'mock-conf-5',
          productId: productId,
          configKey: 'meat_type',
          configLabel: 'Tipo de Carne',
          fieldType: 'select',
          isRequired: true,
          displayOrder: 2,
          maxSelections: 1,
          options: [
            { id: 'opt-18', label: 'Carne Bovina', value: 'beef', additionalPrice: 0 },
            { id: 'opt-19', label: 'Carne de Frango', value: 'chicken', additionalPrice: 0 },
            { id: 'opt-20', label: 'Carne Suína', value: 'pork', additionalPrice: 2 },
            { id: 'opt-21', label: 'Mix (Bovino + Frango)', value: 'mix', additionalPrice: 3 },
          ],
          defaultValue: 'beef',
          helpText: 'Escolha o tipo de carne',
        },
        {
          id: 'mock-conf-6',
          productId: productId,
          configKey: 'doneness',
          configLabel: 'Ponto',
          fieldType: 'select',
          isRequired: true,
          displayOrder: 3,
          maxSelections: 1,
          options: [
            { id: 'opt-22', label: 'Mal Passado', value: 'rare', additionalPrice: 0 },
            { id: 'opt-23', label: 'Ao Ponto', value: 'medium', additionalPrice: 0 },
            { id: 'opt-24', label: 'Bem Passado', value: 'well_done', additionalPrice: 0 },
          ],
          defaultValue: 'medium',
          helpText: 'Escolha o ponto da carne',
        },
      ],
      // Exemplo: se o produto teve template de açaí aplicado
      'acai-config': [
        {
          id: 'mock-conf-7',
          productId: productId,
          configKey: 'size',
          configLabel: 'Tamanho',
          fieldType: 'select',
          isRequired: true,
          displayOrder: 1,
          maxSelections: 1,
          options: [
            { id: 'opt-25', label: 'Pequeno (300ml)', value: 'small', additionalPrice: 0 },
            { id: 'opt-26', label: 'Médio (500ml)', value: 'medium', additionalPrice: 5 },
            { id: 'opt-27', label: 'Grande (800ml)', value: 'large', additionalPrice: 10 },
          ],
          defaultValue: 'medium',
          helpText: 'Escolha o tamanho',
        },
        {
          id: 'mock-conf-8',
          productId: productId,
          configKey: 'base',
          configLabel: 'Base',
          fieldType: 'select',
          isRequired: true,
          displayOrder: 2,
          maxSelections: 1,
          options: [
            { id: 'opt-28', label: 'Açaí Tradicional', value: 'traditional', additionalPrice: 0 },
            { id: 'opt-29', label: 'Açaí com Iogurte', value: 'yogurt', additionalPrice: 2 },
            { id: 'opt-30', label: 'Açaí Cremoso', value: 'creamy', additionalPrice: 3 },
          ],
          defaultValue: 'traditional',
          helpText: 'Escolha a base',
        },
        {
          id: 'mock-conf-9',
          productId: productId,
          configKey: 'toppings',
          configLabel: 'Coberturas',
          fieldType: 'checkbox',
          isRequired: true,
          displayOrder: 3,
          maxSelections: 10,
          options: [
            { id: 'opt-31', label: 'Granola', value: 'granola', additionalPrice: 0 },
            { id: 'opt-32', label: 'Banana', value: 'banana', additionalPrice: 1.5 },
            { id: 'opt-33', label: 'Morango', value: 'strawberry', additionalPrice: 2 },
            { id: 'opt-34', label: 'Chocolate', value: 'chocolate', additionalPrice: 2.5 },
            { id: 'opt-35', label: 'Mel', value: 'honey', additionalPrice: 2 },
            { id: 'opt-36', label: 'Leite Condensado', value: 'condensed_milk', additionalPrice: 2.5 },
          ],
          defaultValue: ['granola'],
          helpText: 'Escolha as coberturas',
        },
      ],
    };

    // Retornar configurações baseadas no template aplicado
    if (appliedTemplateId === 'mock-1') {
      console.log(`🍕 [getMockConfigurations] Retornando configurações de Pizzaria`);
      return mockConfigs['pizzaria-config'];
    } else if (appliedTemplateId === 'mock-2') {
      console.log(`🍔 [getMockConfigurations] Retornando configurações de Hamburgueria`);
      return mockConfigs['hamburgueria-config'];
    } else if (appliedTemplateId === 'mock-6') {
      console.log(`🥣 [getMockConfigurations] Retornando configurações de Açaí`);
      return mockConfigs['acai-config'];
    } else {
      // Se nenhum template aplicado, retornar vazio
      console.log(`⚠️ [getMockConfigurations] Nenhum template aplicado ou não reconhecido. Retornando vazio.`);
      return [];
    }
  },
};

