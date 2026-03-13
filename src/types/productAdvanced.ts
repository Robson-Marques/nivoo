// Tipos avançados para Sistema de Galeria, Configurações e Enhancements
// Extensão dos tipos existentes em types/index.ts

//========================================
// PRODUCT IMAGES - Galeria de Imagens
//========================================

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText?: string;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImageUploadPayload {
  productId: string;
  imageFile: File;
  altText?: string;
  setAsPrimary?: boolean;
}

//========================================
// PRODUCT CONFIGURATIONS - Campos Personalizáveis
//========================================

export type ProductFieldType = 'radio' | 'checkbox' | 'select' | 'text' | 'number';

export interface ProductConfigurationOption {
  id: string;
  label: string;
  value: string;
  additionalPrice: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductConfiguration {
  id: string;
  productId: string;
  configKey: string;
  configLabel: string;
  fieldType: ProductFieldType;
  isRequired: boolean;
  displayOrder: number;
  maxSelections?: number;
  minLength?: number;
  maxLength?: number;
  step?: number;
  minValue?: number;
  maxValue?: number;
  defaultValue?: string;
  helpText?: string;
  options: ProductConfigurationOption[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductConfigurationPayload {
  configKey: string;
  configLabel: string;
  fieldType: ProductFieldType;
  isRequired: boolean;
  displayOrder: number;
  maxSelections?: number;
  minLength?: number;
  maxLength?: number;
  step?: number;
  minValue?: number;
  maxValue?: number;
  defaultValue?: string;
  helpText?: string;
  options: Omit<ProductConfigurationOption, 'id' | 'createdAt' | 'updatedAt'>[];
}

// Valores selecionados pelo usuário durante a configuração
export interface SelectedProductConfiguration {
  configKey: string;
  value: string | string[] | number;
  additionalPrice: number;
}

//========================================
// PRODUCT BADGES - Selos Visuais
//========================================

export type ProductBadgeType = 'new' | 'promotion' | 'low_stock' | 'custom';
export type ProductBadgePosition = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';

export interface ProductBadge {
  id: string;
  productId: string;
  badgeType: ProductBadgeType;
  badgeLabel: string;
  badgeColor: string;
  badgePosition: ProductBadgePosition;
  showCondition?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductBadgePayload {
  badgeType: ProductBadgeType;
  badgeLabel: string;
  badgeColor: string;
  badgePosition: ProductBadgePosition;
  showCondition?: Record<string, any>;
}

//========================================
// PRODUCT ENHANCEMENTS - Recursos Avançados
//========================================

export interface ProductHighlightItem {
  icon?: string;
  text: string;
}

export interface ProductEnhancement {
  id: string;
  productId: string;
  expandedDescription?: string;
  trustTriggers: string[];
  warrantyText?: string;
  stockWarning?: string;
  highlightSection?: ProductHighlightItem[];
  visibilityRules?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductEnhancementPayload {
  expandedDescription?: string;
  trustTriggers?: string[];
  warrantyText?: string;
  stockWarning?: string;
  highlightSection?: ProductHighlightItem[];
  visibilityRules?: Record<string, any>;
}

//========================================
// CONFIGURAÇÃO TEMPLATE
//========================================

export type ProductTemplateType = 'food' | 'clothing' | 'electronics' | 'default';

export interface ProductTemplate {
  type: ProductTemplateType;
  defaultConfigurations: ProductConfigurationPayload[];
  defaultBadges: Omit<ProductBadgePayload, 'badgeLabel'>[];
  defaultEnhancements: Partial<ProductEnhancementPayload>;
}

//========================================
// PRODUCT EXTENDED - Produto com todos os dados
//========================================

export interface ProductExtended {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  available: boolean;
  featured?: boolean;
  configurationTemplate: ProductTemplateType;
  createdAt: Date;
  updatedAt: Date;
  
  // Related data
  images: ProductImage[];
  configurations: ProductConfiguration[];
  badges: ProductBadge[];
  enhancements?: ProductEnhancement;
}

//========================================
// RPC RETURN TYPES
//========================================

export interface GetProductWithGalleryResult {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  available: boolean;
  featured: boolean;
  configurationTemplate: string;
  createdAt: Date;
  updatedAt: Date;
  images: ProductImage[];
  configurations: ProductConfiguration[];
  badges: ProductBadge[];
  enhancements: ProductEnhancement;
}

export interface SaveProductConfigurationsResult {
  success: boolean;
  message: string;
  configurationCount: number;
}

export interface ReorderProductImagesResult {
  success: boolean;
  message: string;
}

export interface GetProductConfigurationPreviewResult {
  htmlPreview: string;
  additionalPriceTotal: number;
}

export interface UpsertProductBadgeResult {
  id: string;
  productId: string;
  badgeType: string;
  badgeLabel: string;
  createdAt: Date;
}

export interface UpsertProductEnhancementResult {
  id: string;
  productId: string;
  expandedDescription?: string;
  warrantyText?: string;
  stockWarning?: string;
}

//========================================
// VALIDAÇÃO
//========================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
