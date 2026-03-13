// Hooks customizados para Galeria, Configurações e Enhancements
// Encapsulam lógica de estado e API

import React, { useState, useCallback, useEffect } from "react";
import {
  ProductImage,
  ProductConfiguration,
  ProductBadge,
  ProductEnhancement,
  ProductExtended,
  SelectedProductConfiguration,
} from "@/types/productAdvanced";
import {
  productImagesService,
  productConfigurationsService,
  productBadgesService,
  productEnhancementsService,
  productExtendedService,
  productValidationService,
} from "@/services/productAdvancedService";
import { useToast } from "@/hooks/use-toast";

// =====================================================
// HOOK: useProductGallery
// Gerencia galeria de imagens de um produto
// =====================================================

export function useProductGallery(productId: string) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Carregar imagens ao montar ou mudar productId
  useEffect(() => {
    const loadImages = async () => {
      setIsLoadingImages(true);
      try {
        const data = await productImagesService.getProductImages(productId);
        setImages(data);
        setActiveImageIndex(0);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao carregar imagens";
        setError(errorMsg);
        console.error("Erro ao carregar imagens:", err);
      } finally {
        setIsLoadingImages(false);
      }
    };

    loadImages();
  }, [productId]);

  const addImage = useCallback(
    async (imageUrl: string, altText?: string) => {
      try {
        const newImage = await productImagesService.addProductImage(
          productId,
          imageUrl,
          altText,
          images.length === 0
        );
        setImages([...images, newImage]);
        toast({
          title: "Sucesso",
          description: "Imagem adicionada com sucesso",
        });
        return newImage;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao adicionar imagem";
        toast({
          variant: "destructive",
          title: "Erro",
          description: errorMsg,
        });
        throw err;
      }
    },
    [productId, images, toast]
  );

  const deleteImage = useCallback(
    async (imageId: string) => {
      try {
        await productImagesService.deleteProductImage(imageId);
        setImages(images.filter((img) => img.id !== imageId));
        toast({
          title: "Sucesso",
          description: "Imagem removida com sucesso",
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao deletar imagem";
        toast({
          variant: "destructive",
          title: "Erro",
          description: errorMsg,
        });
        throw err;
      }
    },
    [images, toast]
  );

  const reorderImages = useCallback(
    async (newOrder: Array<{ id: string; order: number }>) => {
      try {
        await productImagesService.reorderProductImages(productId, newOrder);
        // Reload images after reordering
        const data = await productImagesService.getProductImages(productId);
        setImages(data);
        toast({
          title: "Sucesso",
          description: "Imagens reordenadas com sucesso",
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao reordenar imagens";
        toast({
          variant: "destructive",
          title: "Erro",
          description: errorMsg,
        });
        throw err;
      }
    },
    [productId, toast]
  );

  const setPrimaryImage = useCallback(
    async (imageId: string) => {
      try {
        await productImagesService.setPrimaryImage(imageId, productId);
        // Update local state
        const updatedImages = images.map((img) => ({
          ...img,
          isPrimary: img.id === imageId,
        }));
        setImages(updatedImages);
        toast({
          title: "Sucesso",
          description: "Imagem primária atualizada",
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao atualizar imagem primária";
        toast({
          variant: "destructive",
          title: "Erro",
          description: errorMsg,
        });
        throw err;
      }
    },
    [productId, images, toast]
  );

  const activeImage = images[activeImageIndex] || null;

  return {
    images,
    activeImage,
    activeImageIndex,
    setActiveImageIndex,
    isLoadingImages,
    error,
    addImage,
    deleteImage,
    reorderImages,
    setPrimaryImage,
  };
}

// =====================================================
// HOOK: useProductConfigurations
// Gerencia configurações personalizadas de um produto
// =====================================================

export function useProductConfigurations(productId: string) {
  const [configurations, setConfigurations] = useState<ProductConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  console.log(`🔍 [useProductConfigurations] Hook iniciado para produto: ${productId}`);

  useEffect(() => {
    const loadConfigurations = async () => {
      console.log(`🔍 [useProductConfigurations] Carregando configurações para produto: ${productId}`);
      setIsLoading(true);
      try {
        const data = await productConfigurationsService.getProductConfigurations(
          productId
        );
        console.log(`🔍 [useProductConfigurations] Recebidas ${data.length} configurações:`, data);
        setConfigurations(data);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao carregar configurações";
        setError(errorMsg);
        console.error("Erro ao carregar configurações:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfigurations();
  }, [productId]);

  const saveConfigurations = useCallback(
    async (newConfigs: any[]) => {
      try {
        await productConfigurationsService.saveProductConfigurations(
          productId,
          newConfigs
        );
        // Reload configurations
        const data = await productConfigurationsService.getProductConfigurations(
          productId
        );
        setConfigurations(data);
        toast({
          title: "Sucesso",
          description: "Configurações salvas com sucesso",
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao salvar configurações";
        toast({
          variant: "destructive",
          title: "Erro",
          description: errorMsg,
        });
        throw err;
      }
    },
    [productId, toast]
  );

  const deleteConfiguration = useCallback(
    async (configId: string) => {
      try {
        await productConfigurationsService.deleteConfiguration(configId);
        setConfigurations(configurations.filter((c) => c.id !== configId));
        toast({
          title: "Sucesso",
          description: "Configuração removida com sucesso",
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao deletar configuração";
        toast({
          variant: "destructive",
          title: "Erro",
          description: errorMsg,
        });
        throw err;
      }
    },
    [configurations, toast]
  );

  return {
    configurations,
    isLoading,
    error,
    saveConfigurations,
    deleteConfiguration,
  };
}

// =====================================================
// HOOK: useProductBadges
// Gerencia badges/selos visuais de um produto
// =====================================================

export function useProductBadges(productId: string) {
  const [badges, setBadges] = useState<ProductBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadBadges = async () => {
      setIsLoading(true);
      try {
        const data = await productBadgesService.getProductBadges(productId);
        setBadges(data);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao carregar badges";
        setError(errorMsg);
        console.error("Erro ao carregar badges:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBadges();
  }, [productId]);

  const addBadge = useCallback(
    async (badge: any) => {
      if (badges.length >= 3) {
        toast({
          variant: "destructive",
          title: "Limite atingido",
          description: "Máximo 3 badges por produto",
        });
        return;
      }

      try {
        const newBadge = await productBadgesService.addProductBadge(
          productId,
          badge
        );
        setBadges([...badges, newBadge]);
        toast({
          title: "Sucesso",
          description: "Badge adicionado com sucesso",
        });
        return newBadge;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao adicionar badge";
        toast({
          variant: "destructive",
          title: "Erro",
          description: errorMsg,
        });
        throw err;
      }
    },
    [productId, badges, toast]
  );

  const deleteBadge = useCallback(
    async (badgeId: string) => {
      try {
        await productBadgesService.deleteBadge(badgeId);
        setBadges(badges.filter((b) => b.id !== badgeId));
        toast({
          title: "Sucesso",
          description: "Badge removido com sucesso",
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao deletar badge";
        toast({
          variant: "destructive",
          title: "Erro",
          description: errorMsg,
        });
        throw err;
      }
    },
    [badges, toast]
  );

  return {
    badges,
    isLoading,
    error,
    addBadge,
    deleteBadge,
  };
}

// =====================================================
// HOOK: useProductEnhancement
// Gerencia enhancements de um produto
// =====================================================

export function useProductEnhancement(productId: string) {
  const [enhancement, setEnhancement] = useState<ProductEnhancement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadEnhancement = async () => {
      setIsLoading(true);
      try {
        const data = await productEnhancementsService.getProductEnhancement(
          productId
        );
        setEnhancement(data);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao carregar enhancement";
        setError(errorMsg);
        console.error("Erro ao carregar enhancement:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadEnhancement();
  }, [productId]);

  const updateEnhancement = useCallback(
    async (newEnhancement: any) => {
      try {
        const updated = await productEnhancementsService.upsertProductEnhancement(
          productId,
          newEnhancement
        );
        setEnhancement(updated as ProductEnhancement);
        toast({
          title: "Sucesso",
          description: "Enhancement atualizado com sucesso",
        });
        return updated;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao atualizar enhancement";
        toast({
          variant: "destructive",
          title: "Erro",
          description: errorMsg,
        });
        throw err;
      }
    },
    [productId, toast]
  );

  return {
    enhancement,
    isLoading,
    error,
    updateEnhancement,
  };
}

// =====================================================
// HOOK: useProductConfigurator
// Gerencia estado de configurações selecionadas pelo usuário
// =====================================================

export function useProductConfigurator(configurations: ProductConfiguration[]) {
  const [selectedConfigs, setSelectedConfigs] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [additionalPrice, setAdditionalPrice] = useState(0);

  const updateConfiguration = useCallback(
    (configKey: string, value: any) => {
      const newConfigs = {
        ...selectedConfigs,
        [configKey]: value,
      };
      setSelectedConfigs(newConfigs);

      // Validar e calcular
      const validation = productValidationService.validateConfigurations(
        configurations,
        newConfigs
      );

      if (validation.errors.length > 0) {
        const errorMap: Record<string, string> = {};
        validation.errors.forEach((err) => {
          errorMap[err.field] = err.message;
        });
        setValidationErrors(errorMap);
      } else {
        setValidationErrors({});
      }

      // Calcular preço adicional
      const additionalPriceValue = productValidationService.calculateAdditionalPrice(
        configurations,
        newConfigs
      );
      setAdditionalPrice(additionalPriceValue);
    },
    [configurations]
  );

  const isValid = () => {
    const validation = productValidationService.validateConfigurations(
      configurations,
      selectedConfigs
    );
    return validation.isValid;
  };

  const reset = useCallback(() => {
    setSelectedConfigs({});
    setValidationErrors({});
    setAdditionalPrice(0);
  }, []);

  return {
    selectedConfigs,
    validationErrors,
    additionalPrice,
    updateConfiguration,
    isValid,
    reset,
  };
}

// =====================================================
// HOOK: useProductExtended
// Carrega produto completo com galeria, configurações, badges
// =====================================================

export function useProductExtended(productId: string) {
  const [product, setProduct] = useState<ProductExtended | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skeletonTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setIsLoading(false);
      setShowSkeleton(false);
      if (skeletonTimeoutRef.current) {
        clearTimeout(skeletonTimeoutRef.current);
      }
      return;
    }

    const loadProduct = async () => {
      setIsLoading(true);
      setShowSkeleton(false);
      
      // Atrasar skeleton ao máximo: 500ms
      // Praticamente nunca será visto com cache/imagens rápidas
      skeletonTimeoutRef.current = setTimeout(() => {
        setShowSkeleton(true);
      }, 500);

      try {
        const data = await productExtendedService.getProductWithGallery(
          productId,
          true,
          true
        );
        setProduct(data);
        setError(null);
        setShowSkeleton(false);
        if (skeletonTimeoutRef.current) {
          clearTimeout(skeletonTimeoutRef.current);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao carregar produto";
        setError(errorMsg);
        console.error("Erro ao carregar produto:", err);
        setProduct(null);
        setShowSkeleton(false);
        if (skeletonTimeoutRef.current) {
          clearTimeout(skeletonTimeoutRef.current);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();

    return () => {
      if (skeletonTimeoutRef.current) {
        clearTimeout(skeletonTimeoutRef.current);
      }
    };
  }, [productId]);

  return {
    product,
    isLoading,
    showSkeleton,
    error,
  };
}
