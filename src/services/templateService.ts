// Template Service - Gerencia templates de configuração de produtos

import { supabase } from '@/integrations/supabase/client-extended';
import {
  BusinessType,
  BusinessTypeTemplate,
  TemplateConfiguration,
  TemplateAddon,
  ApplyTemplatePayload,
  TemplateApplicationResult,
} from '@/types/template';

class TemplateService {
  /**
   * Busca todos os templates disponíveis para tipos de negócio
   */
  async getAllTemplates(): Promise<BusinessTypeTemplate[]> {
    // Forçar modo mock para evitar erros 404
    console.warn('⚠️ [templateService.getAllTemplates] Usando modo mock (sem acesso ao banco)');
    return this.getMockTemplates();
  }

  /**
   * Busca um template específico pelo ID
   */
  async getTemplateById(templateId: string): Promise<BusinessTypeTemplate | null> {
    const { data, error } = await supabase
      .from('business_type_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Não encontrado, retorna null
        return null;
      }
      console.error('Erro ao buscar template:', error);
      throw error;
    }

    return data;
  }

  /**
   * Busca um template por tipo de negócio
   */
  async getTemplateByBusinessType(businessType: BusinessType): Promise<BusinessTypeTemplate | null> {
    const { data, error } = await supabase
      .from('business_type_templates')
      .select('*')
      .eq('business_type', businessType)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Erro ao buscar template por tipo de negócio:', error);
      throw error;
    }

    return data;
  }

  /**
   * Busca as configurações de um template
   */
  async getTemplateConfigurations(templateId: string): Promise<TemplateConfiguration[]> {
    // Forçar modo mock para evitar erros 404
    console.warn('⚠️ [templateService.getTemplateConfigurations] Usando modo mock (sem acesso ao banco)');
    return this.getMockConfigurations(templateId);
  }

  /**
   * Busca os adicionais de um template
   */
  async getTemplateAddons(templateId: string): Promise<TemplateAddon[]> {
    // Forçar modo mock para evitar erros 404
    console.warn('⚠️ [templateService.getTemplateAddons] Usando modo mock (sem acesso ao banco)');
    return this.getMockAddons(templateId);
  }

  /**
   * Aplica um template a um produto
   * Cria configurações e adicionais baseado no template
   */
  async applyTemplateToProduct(
    payload: ApplyTemplatePayload
  ): Promise<TemplateApplicationResult> {
    const { product_id, template_id, override_existing = false } = payload;

    try {
      console.log(`🚀 [applyTemplateToProduct] Aplicando template ${template_id} ao produto ${product_id}`);
      
      // Buscar as configurações do template (modo mock)
      const configurations = await this.getTemplateConfigurations(template_id);
      const addons = await this.getTemplateAddons(template_id);

      // Salvar qual template foi aplicado ao produto (localStorage)
      this.saveAppliedTemplate(product_id, template_id);

      // Salvar configurações no localStorage (simulação de persistência)
      this.saveProductConfigurations(product_id, configurations);

      console.log(`✅ [applyTemplateToProduct] Template aplicado com sucesso!`);
      console.log(`   Configurações salvas: ${configurations.length}`);
      console.log(`   Adicionais disponíveis: ${addons.length}`);

      return {
        success: true,
        message: `Template aplicado com sucesso. ${configurations.length} configurações e ${addons.length} adicionais estão disponíveis.`,
        product_id,
        configurations_created: configurations.length,
        addons_created: addons.length,
      };
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
      throw error;
    }
  }

  /**
   * Salvar configurações do produto no localStorage
   */
  private saveProductConfigurations(productId: string, configurations: any[]): void {
    try {
      const key = `product_configurations_${productId}`;
      // Garantir que options seja sempre array
      const sanitizedConfigurations = configurations.map(config => ({
        ...config,
        options: Array.isArray(config.options) ? config.options : []
      }));
      localStorage.setItem(key, JSON.stringify(sanitizedConfigurations));
      console.log(`💾 [saveProductConfigurations] ${configurations.length} configurações salvas no localStorage`);
    } catch (error) {
      console.warn('⚠️ Erro ao salvar configurações no localStorage:', error);
    }
  }

  /**
   * Cria um novo template customizado
   */
  async createCustomTemplate(
    businessType: BusinessType,
    displayName: string,
    description?: string,
    iconEmoji?: string
  ): Promise<BusinessTypeTemplate> {
    const { data, error } = await supabase
      .from('business_type_templates')
      .insert({
        business_type: businessType,
        display_name: displayName,
        description,
        icon_emoji: iconEmoji || '🏪',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar template customizado:', error);
      throw error;
    }

    return data;
  }

  /**
   * Adiciona uma configuração a um template
   */
  async addConfigurationToTemplate(
    templateId: string,
    configKey: string,
    configLabel: string,
    fieldType: string,
    isRequired: boolean,
    displayOrder: number,
    options?: any[],
    helpText?: string
  ): Promise<TemplateConfiguration> {
    const { data, error } = await supabase
      .from('template_configurations')
      .insert({
        template_id: templateId,
        config_key: configKey,
        config_label: configLabel,
        field_type: fieldType,
        is_required: isRequired,
        display_order: displayOrder,
        options,
        help_text: helpText,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar configuração:', error);
      throw error;
    }

    return data;
  }

  /**
   * Adiciona um adicional a um template
   */
  async addAddonToTemplate(
    templateId: string,
    name: string,
    description: string | null,
    price: number,
    displayOrder: number,
    category?: string
  ): Promise<TemplateAddon> {
    const { data, error } = await supabase
      .from('template_addons')
      .insert({
        template_id: templateId,
        name,
        description,
        price,
        display_order: displayOrder,
        category,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar addon:', error);
      throw error;
    }

    return data;
  }

  /**
   * Atualiza um template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<BusinessTypeTemplate>
  ): Promise<BusinessTypeTemplate> {
    const { data, error } = await supabase
      .from('business_type_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar template:', error);
      throw error;
    }

    return data;
  }

  /**
   * Deleta um template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('business_type_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Erro ao deletar template:', error);
      throw error;
    }
  }

  /**
   * Inicializa templates padrão se não existirem
   */
  async initializeDefaultTemplates(): Promise<void> {
    try {
      console.log('🔄 Iniciando templates padrão...');
      
      const defaultTemplates = [
        { business_type: 'pizzeria', display_name: '🍕 Pizzeria', description: 'Template para pizzarias com opções de massa, recheios e tamanhos', icon_emoji: '🍕' },
        { business_type: 'hamburger_shop', display_name: '🍔 Hamburgueria', description: 'Template para hamburguarias com opções de carne, acompanhamentos e molhos', icon_emoji: '🍔' },
        { business_type: 'restaurant', display_name: '🍽️ Restaurante', description: 'Template para restaurantes com pratos executivos, carnes e acompanhamentos', icon_emoji: '🍽️' },
        { business_type: 'pastry_shop', display_name: '🥐 Pastelaria', description: 'Template para pastelarias com tamanhos, massas e recheios', icon_emoji: '🥐' },
        { business_type: 'snack_bar', display_name: '🌮 Lanchonete', description: 'Template para lanchonetes com lanches, bebidas e acompanhamentos', icon_emoji: '🌮' },
        { business_type: 'acai_shop', display_name: '🥣 Açaí', description: 'Template para lojas de açaí com frutas, acompanhamentos e tamanhos', icon_emoji: '🥣' },
        { business_type: 'bar', display_name: '🍺 Bar', description: 'Template para bares com bebidas, petiscos e drinques', icon_emoji: '🍺' },
        { business_type: 'cafe', display_name: '☕ Café', description: 'Template para cafeterias com bebidas quentes, frias e docinhos', icon_emoji: '☕' },
        { business_type: 'bakery', display_name: '🥖 Padaria', description: 'Template para padarias com pães, bolos e doces', icon_emoji: '🥖' },
        { business_type: 'other', display_name: '🏪 Outro', description: 'Template genérico para outros tipos de negócio', icon_emoji: '🏪' },
      ];

      let createdCount = 0;
      let skippedCount = 0;

      for (const template of defaultTemplates) {
        try {
          // Verificar se o template já existe
          const { data: existing, error: checkError } = await supabase
            .from('business_type_templates')
            .select('id')
            .eq('business_type', template.business_type)
            .limit(1);

          if (checkError) {
            console.warn(`⚠️ Erro ao verificar template ${template.business_type}:`, checkError);
            continue;
          }

          // Se não existe, criar
          if (!existing || existing.length === 0) {
            const { data: newTemplate, error: insertError } = await supabase
              .from('business_type_templates')
              .insert({
                business_type: template.business_type,
                display_name: template.display_name,
                description: template.description,
                icon_emoji: template.icon_emoji,
                is_active: true,
              })
              .select();

            if (insertError) {
              console.warn(`⚠️ Erro ao inserir template ${template.business_type}:`, insertError);
            } else {
              createdCount++;
              console.log(`✅ Template ${template.display_name} criado`);
            }
          } else {
            skippedCount++;
            console.log(`⏭️ Template ${template.display_name} já existe`);
          }
        } catch (err) {
          console.error(`❌ Exceção ao processar ${template.business_type}:`, err);
        }
      }

      console.log(`✅ Inicialização concluída: ${createdCount} criados, ${skippedCount} existentes`);
    } catch (error) {
      console.error('❌ Erro crítico ao inicializar templates padrão:', error);
    }
  }

  // Método para retornar configurações mock quando a tabela não existe
  private getMockConfigurations(templateId: string): any[] {
    const configurations: Record<string, any[]> = {
      'mock-1': [ // Pizzaria
        { 
          id: 'conf-1-1', 
          template_id: 'mock-1', 
          config_key: 'size', 
          config_label: 'Tamanho', 
          field_type: 'select', 
          is_required: true, 
          display_order: 1, 
          options: [
            { id: 'size-1', value: 'Pequena (25cm)', label: 'Pequena (25cm)', additionalPrice: 0 },
            { id: 'size-2', value: 'Média (30cm)', label: 'Média (30cm)', additionalPrice: 8 },
            { id: 'size-3', value: 'Grande (35cm)', label: 'Grande (35cm)', additionalPrice: 15 },
            { id: 'size-4', value: 'Extra Grande (40cm)', label: 'Extra Grande (40cm)', additionalPrice: 22 }
          ], 
          help_text: 'Escolha o tamanho da pizza' 
        },
        { 
          id: 'conf-1-2', 
          template_id: 'mock-1', 
          config_key: 'crust', 
          config_label: 'Borda', 
          field_type: 'select', 
          is_required: true, 
          display_order: 2, 
          options: [
            { id: 'crust-1', value: 'Tradicional', label: 'Tradicional', additionalPrice: 0 },
            { id: 'crust-2', value: 'Crocante', label: 'Crocante', additionalPrice: 3 },
            { id: 'crust-3', value: 'Recheada', label: 'Recheada (Queijo)', additionalPrice: 7 },
            { id: 'crust-4', value: 'Sem Borda', label: 'Sem Borda', additionalPrice: 0 }
          ], 
          help_text: 'Escolha o tipo de borda' 
        },
        { 
          id: 'conf-1-3', 
          template_id: 'mock-1', 
          config_key: 'flavor', 
          config_label: 'Sabor', 
          field_type: 'select', 
          is_required: true, 
          display_order: 3, 
          options: [
            { id: 'flavor-1', value: 'Calabresa', label: 'Calabresa', additionalPrice: 0 },
            { id: 'flavor-2', value: 'Muçarela', label: 'Muçarela', additionalPrice: 0 },
            { id: 'flavor-3', value: 'Portuguesa', label: 'Portuguesa', additionalPrice: 5 },
            { id: 'flavor-4', value: 'Quatro Queijos', label: 'Quatro Queijos', additionalPrice: 6 },
            { id: 'flavor-5', value: 'Frango com Catupiry', label: 'Frango com Catupiry', additionalPrice: 4 },
            { id: 'flavor-6', value: 'Moda da Casa', label: 'Moda da Casa', additionalPrice: 8 }
          ], 
          help_text: 'Escolha o sabor da pizza' 
        },
      ],
      'mock-2': [ // Hamburgueria
        { 
          id: 'conf-2-1', 
          template_id: 'mock-2', 
          config_key: 'size', 
          config_label: 'Tamanho', 
          field_type: 'select', 
          is_required: true, 
          display_order: 1, 
          options: [
            { id: 'size-1', value: 'Simples', label: 'Simples (180g)', additionalPrice: 0 },
            { id: 'size-2', value: 'Duplo', label: 'Duplo (360g)', additionalPrice: 12 },
            { id: 'size-3', value: 'Triplo', label: 'Triplo (540g)', additionalPrice: 24 }
          ], 
          help_text: 'Escolha o tamanho do burger' 
        },
        { 
          id: 'conf-2-2', 
          template_id: 'mock-2', 
          config_key: 'meat_type', 
          config_label: 'Tipo de Carne', 
          field_type: 'select', 
          is_required: true, 
          display_order: 2, 
          options: [
            { id: 'meat-1', value: 'Carne Bovina', label: 'Carne Bovina', additionalPrice: 0 },
            { id: 'meat-2', value: 'Carne de Frango', label: 'Carne de Frango', additionalPrice: 0 },
            { id: 'meat-3', value: 'Carne Suína', label: 'Carne Suína', additionalPrice: 3 },
            { id: 'meat-4', value: 'Mix (Bovino + Frango)', label: 'Mix (Bovino + Frango)', additionalPrice: 5 }
          ], 
          help_text: 'Escolha o tipo de carne' 
        },
        { 
          id: 'conf-2-3', 
          template_id: 'mock-2', 
          config_key: 'doneness', 
          config_label: 'Ponto', 
          field_type: 'select', 
          is_required: true, 
          display_order: 3, 
          options: [
            { id: 'doneness-1', value: 'Mal Passado', label: 'Mal Passado', additionalPrice: 0 },
            { id: 'doneness-2', value: 'Ao Ponto', label: 'Ao Ponto', additionalPrice: 0 },
            { id: 'doneness-3', value: 'Bem Passado', label: 'Bem Passado', additionalPrice: 0 }
          ], 
          help_text: 'Escolha o ponto da carne' 
        },
      ],
      'mock-3': [ // Restaurante
        { 
          id: 'conf-3-1', 
          template_id: 'mock-3', 
          config_key: 'portion', 
          config_label: 'Porção', 
          field_type: 'select', 
          is_required: true, 
          display_order: 1, 
          options: [
            { id: 'portion-1', value: 'Individual', label: 'Individual', additionalPrice: 0 },
            { id: 'portion-2', value: 'Para 2 pessoas', label: 'Para 2 pessoas', additionalPrice: 15 },
            { id: 'portion-3', value: 'Familiar', label: 'Familiar (4 pessoas)', additionalPrice: 35 }
          ], 
          help_text: 'Escolha o tamanho da porção' 
        },
        { 
          id: 'conf-3-2', 
          template_id: 'mock-3', 
          config_key: 'accompaniment', 
          config_label: 'Acompanhamento', 
          field_type: 'select', 
          is_required: false, 
          display_order: 2, 
          options: [
            { id: 'accomp-1', value: 'Arroz Branco', label: 'Arroz Branco', additionalPrice: 0 },
            { id: 'accomp-2', value: 'Arroz à Grega', label: 'Arroz à Grega', additionalPrice: 4 },
            { id: 'accomp-3', value: 'Batata Frita', label: 'Batata Frita', additionalPrice: 6 },
            { id: 'accomp-4', value: 'Pure de Batata', label: 'Pure de Batata', additionalPrice: 5 }
          ], 
          help_text: 'Escolha o acompanhamento' 
        },
      ],
      'mock-6': [ // Açaí
        { 
          id: 'conf-6-1', 
          template_id: 'mock-6', 
          config_key: 'size', 
          config_label: 'Tamanho', 
          field_type: 'select', 
          is_required: true, 
          display_order: 1, 
          options: [
            { id: 'size-1', value: 'Pequeno (300ml)', label: 'Pequeno (300ml)', additionalPrice: 0 },
            { id: 'size-2', value: 'Médio (500ml)', label: 'Médio (500ml)', additionalPrice: 5 },
            { id: 'size-3', value: 'Grande (800ml)', label: 'Grande (800ml)', additionalPrice: 10 }
          ], 
          help_text: 'Escolha o tamanho' 
        },
        { 
          id: 'conf-6-2', 
          template_id: 'mock-6', 
          config_key: 'base', 
          config_label: 'Base', 
          field_type: 'select', 
          is_required: true, 
          display_order: 2, 
          options: [
            { id: 'base-1', value: 'Açaí Tradicional', label: 'Açaí Tradicional', additionalPrice: 0 },
            { id: 'base-2', value: 'Açaí com Iogurte', label: 'Açaí com Iogurte', additionalPrice: 2 },
            { id: 'base-3', value: 'Açaí Cremoso', label: 'Açaí Cremoso', additionalPrice: 3 }
          ], 
          help_text: 'Escolha a base' 
        },
        { 
          id: 'conf-6-3', 
          template_id: 'mock-6', 
          config_key: 'toppings', 
          config_label: 'Coberturas', 
          field_type: 'checkbox', 
          is_required: true, 
          display_order: 3, 
          options: [
            { id: 'topping-1', value: 'Granola', label: 'Granola', additionalPrice: 0 },
            { id: 'topping-2', value: 'Banana', label: 'Banana', additionalPrice: 2 },
            { id: 'topping-3', value: 'Morango', label: 'Morango', additionalPrice: 3 },
            { id: 'topping-4', value: 'Chocolate', label: 'Chocolate', additionalPrice: 2 },
            { id: 'topping-5', value: 'Mel', label: 'Mel', additionalPrice: 1 }
          ], 
          help_text: 'Escolha as coberturas' 
        },
      ],
    };

    return configurations[templateId] || [];
  }

  // Método para retornar adicionais mock quando a tabela não existe
  private getMockAddons(templateId: string): any[] {
    const addons: Record<string, any[]> = {
      'mock-1': [ // Pizzaria
        { id: 'addon-1-1', template_id: 'mock-1', name: 'Adicional Calabresa', description: 'Adicione calabresa à pizza', price: 5.00, display_order: 1, category: 'Adicionais', is_active: true },
        { id: 'addon-1-2', template_id: 'mock-1', name: 'Adicional Frango', description: 'Adicione frango à pizza', price: 6.00, display_order: 2, category: 'Adicionais', is_active: true },
        { id: 'addon-1-3', template_id: 'mock-1', name: 'Adicional Bacon', description: 'Adicione bacon à pizza', price: 7.00, display_order: 3, category: 'Adicionais', is_active: true },
        { id: 'addon-1-4', template_id: 'mock-1', name: 'Refrigerante 2L', description: 'Refrigerante de 2 litros', price: 9.00, display_order: 4, category: 'Bebidas', is_active: true },
        { id: 'addon-1-5', template_id: 'mock-1', name: 'Molho Especial', description: 'Molho especial da casa', price: 2.00, display_order: 5, category: 'Complementos', is_active: true },
      ],
      'mock-2': [ // Hamburgueria
        { id: 'addon-2-1', template_id: 'mock-2', name: 'Queijo Extra', description: 'Queijo derretido adicional', price: 2.00, display_order: 1, category: 'Extras', is_active: true },
        { id: 'addon-2-2', template_id: 'mock-2', name: 'Bacon', description: 'Bacon crocante', price: 3.00, display_order: 2, category: 'Extras', is_active: true },
        { id: 'addon-2-3', template_id: 'mock-2', name: 'Ovo', description: 'Ovo frito', price: 2.50, display_order: 3, category: 'Extras', is_active: true },
        { id: 'addon-2-4', template_id: 'mock-2', name: 'Batata Frita Pequena', description: 'Acompanhamento', price: 5.00, display_order: 4, category: 'Acompanhamentos', is_active: true },
        { id: 'addon-2-5', template_id: 'mock-2', name: 'Refrigerante Lata', description: 'Bebida', price: 6.00, display_order: 5, category: 'Bebidas', is_active: true },
      ],
      'mock-6': [ // Açaí
        { id: 'addon-6-1', template_id: 'mock-6', name: 'Granola Extra', description: 'Granola crocante adicional', price: 3.00, display_order: 1, category: 'Coberturas', is_active: true },
        { id: 'addon-6-2', template_id: 'mock-6', name: 'Banana', description: 'Banana fatiada', price: 1.50, display_order: 2, category: 'Frutas', is_active: true },
        { id: 'addon-6-3', template_id: 'mock-6', name: 'Morango', description: 'Morango fresco', price: 2.00, display_order: 3, category: 'Frutas', is_active: true },
        { id: 'addon-6-4', template_id: 'mock-6', name: 'Chocolate', description: 'Calda de chocolate', price: 2.50, display_order: 4, category: 'Caldas', is_active: true },
        { id: 'addon-6-5', template_id: 'mock-6', name: 'Leite Condensado', description: 'Leite condensado', price: 2.50, display_order: 5, category: 'Caldas', is_active: true },
      ],
    };

    return addons[templateId] || [];
  }

  // Métodos para gerenciar templates aplicados via localStorage
  private saveAppliedTemplate(productId: string, templateId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const appliedTemplates = this.getAppliedTemplates();
      appliedTemplates[productId] = templateId;
      localStorage.setItem('applied_templates', JSON.stringify(appliedTemplates));
      console.log(`💾 [saveAppliedTemplate] Template ${templateId} salvo para produto ${productId}`);
    } catch (error) {
      console.warn('⚠️ Erro ao salvar template aplicado:', error);
    }
  }

  private getAppliedTemplates(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem('applied_templates');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('⚠️ Erro ao recuperar templates aplicados:', error);
      return {};
    }
  }

  public getAppliedTemplate(productId: string): string | null {
    const appliedTemplates = this.getAppliedTemplates();
    return appliedTemplates[productId] || null;
  }

  // Método para retornar dados mock quando a tabela não existe
  private getMockTemplates(): any[] {
    return [
      {
        id: 'mock-1',
        business_type: 'pizzeria',
        display_name: '🍕 Pizzaria',
        description: 'Template para pizzarias com opções de massa, recheios e tamanhos',
        icon_emoji: '🍕',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-2',
        business_type: 'hamburger_shop',
        display_name: '🍔 Hamburgueria',
        description: 'Template para hamburguarias com opções de carne, acompanhamentos e molhos',
        icon_emoji: '🍔',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-3',
        business_type: 'restaurant',
        display_name: '🍽️ Restaurante',
        description: 'Template para restaurantes com pratos executivos, carnes e acompanhamentos',
        icon_emoji: '🍽️',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-4',
        business_type: 'pastry_shop',
        display_name: '🥐 Pastelaria',
        description: 'Template para pastelarias com tamanhos, massas e recheios',
        icon_emoji: '🥐',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-5',
        business_type: 'snack_bar',
        display_name: '🌮 Lanchonete',
        description: 'Template para lanchonetes com lanches, bebidas e acompanhamentos',
        icon_emoji: '🌮',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-6',
        business_type: 'acai_shop',
        display_name: '🥣 Açaí',
        description: 'Template para lojas de açaí com frutas, acompanhamentos e tamanhos',
        icon_emoji: '🥣',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-7',
        business_type: 'bar',
        display_name: '🍺 Bar',
        description: 'Template para bares com bebidas, petiscos e drinques',
        icon_emoji: '🍺',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-8',
        business_type: 'cafe',
        display_name: '☕ Café',
        description: 'Template para cafeterias com bebidas quentes, frias e docinhos',
        icon_emoji: '☕',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-9',
        business_type: 'bakery',
        display_name: '🥖 Padaria',
        description: 'Template para padarias com pães, bolos e doces',
        icon_emoji: '🥖',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-10',
        business_type: 'other',
        display_name: '🏪 Outro',
        description: 'Template genérico para outros tipos de negócio',
        icon_emoji: '🏪',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }
}

export const templateService = new TemplateService();

// Inicializar templates padrão quando a página de customização for carregada
if (typeof window !== 'undefined') {
  templateService.initializeDefaultTemplates().catch(err => {
    console.warn('Aviso: Não foi possível inicializar templates padrão', err);
  });
}
