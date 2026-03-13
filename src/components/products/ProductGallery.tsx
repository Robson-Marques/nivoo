// ProductGallery.tsx
// Galeria avançada de imagens com suporte a até 7 imagens
// Retrocompatível: 1 imagem = sem mudanças visuais

import React, { useState, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/types/productAdvanced";
import "./ProductGallery.module.css";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  isLoading?: boolean;
  onImageChange?: (image: ProductImage) => void;
  onAddImage?: () => void;
  className?: string;
}

export function ProductGallery({
  images,
  productName,
  isLoading = false,
  onImageChange,
  onAddImage,
  className,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageLoadingState, setImageLoadingState] = useState<
    Record<number, boolean>
  >(() => {
    // Inicializar com todas as imagens como JÁ CARREGADAS para mostrar background imediatamente
    const initialState: Record<number, boolean> = {};
    images.forEach((_, index) => {
      initialState[index] = false;
    });
    return initialState;
  });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reinicializar estado de loading quando as imagens mudam
  useEffect(() => {
    const initialState: Record<number, boolean> = {};
    images.forEach((_, index) => {
      initialState[index] = false;
    });
    setImageLoadingState(initialState);
    setActiveIndex(0);
    
    // Pré-carregar primeira imagem IMEDIATAMENTE com fetch de alta prioridade
    if (images.length > 0) {
      // Usar fetch em vez de Image() para mais velocidade
      fetch(images[0].imageUrl, { priority: 'high' as any }).catch(() => {});
    }
    // Carregar demais em background
    images.slice(1).forEach((image, idx) => {
      setTimeout(() => {
        fetch(image.imageUrl).catch(() => {});
      }, idx * 10); // Spacing mínimo
    });
  }, [images]);

  // Retrocompatibilidade: se apenas 1 imagem, manter layout simples
  const isSingleImage = images.length <= 1;
  const hasMultipleImages = images.length > 1;

  const activeImage = images[activeIndex];

  // Handlers de navegação
  const handlePrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setActiveIndex(index);
    if (onImageChange && images[index]) {
      onImageChange(images[index]);
    }
  };

  // Touch events para mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      // Swipe threshold: 50px
      if (diff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }

    setTouchStartX(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasMultipleImages) return;

      switch (e.key) {
        case "ArrowLeft":
          handlePrevious();
          e.preventDefault();
          break;
        case "ArrowRight":
          handleNext();
          e.preventDefault();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasMultipleImages]);

  const handleImageLoaded = (index: number) => {
    setImageLoadingState((prev) => ({
      ...prev,
      [index]: false,
    }));
  };

  const handleImageError = (index: number) => {
    setImageLoadingState((prev) => ({
      ...prev,
      [index]: false,
    }));
  };

  // =====================================================
  // LAYOUT: UMA IMAGEM (Retrocompatível)
  // =====================================================
  if (isSingleImage && images.length === 1) {
    return (
      <div
        className={cn("relative w-full aspect-square overflow-hidden rounded-lg bg-gray-100", className)}
      >
        <img
          src={images[0].imageUrl}
          alt={images[0].altText || productName}
          className="object-cover w-full h-full"
          onError={() => console.error("Erro ao carregar imagem")}
        />
      </div>
    );
  }

  // =====================================================
  // LAYOUT: MÚLTIPLAS IMAGENS
  // =====================================================
  if (hasMultipleImages) {
    return (
      <div className={cn("flex flex-col gap-1 w-full", className)}>
        {/* Imagem Principal */}
        <div
          ref={containerRef}
          className="relative w-full aspect-square overflow-hidden rounded-lg cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="region"
          aria-label="Galeria de imagens do produto"
          style={{
            // Background como placeholder rápido enquanto imagem carrega
            backgroundImage: activeImage ? `url(${activeImage.imageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#f3f4f6',
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-gray-200/50 flex items-center justify-center z-10">
              <Loader2 className="animate-spin w-8 h-8 text-gray-600" />
            </div>
          )}

          {activeImage && (
            <>
              <img
                key={activeIndex}
                src={activeImage.imageUrl}
                alt={activeImage.altText || productName}
                loading="eager"
                fetchPriority="high"
                className={cn(
                  "object-cover w-full h-full transition-opacity duration-75",
                  imageLoadingState[activeIndex] === false ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => handleImageLoaded(activeIndex)}
                onError={() => handleImageError(activeIndex)}
              />

              {/* Badge: Imagem Primária */}
              {activeImage.isPrimary && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Principal
                </div>
              )}
            </>
          )}

          {/* Controles de Navegação - OCULTOS (mantém funcionalidade via touch/keyboard) */}
          {images.length > 1 && (
            <div 
              className="sr-only"
              role="navigation"
              aria-label="Controles da galeria de imagens"
            >
              <button
                onClick={handlePrevious}
                aria-label="Imagem anterior"
                style={{ display: 'none' }}
              />
              <button
                onClick={handleNext}
                aria-label="Próxima imagem"
                style={{ display: 'none' }}
              />
              <div style={{ display: 'none' }}>
                {activeIndex + 1} / {images.length}
              </div>
            </div>
          )}
        </div>

        {/* Miniaturas e Indicadores de Página */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1 bg-white rounded-lg p-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => handleThumbnailClick(index)}
                className={cn(
                  "flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all relative",
                  activeIndex === index
                    ? "border-delivery-500 scale-100 ring-2 ring-delivery-500/50"
                    : "border-gray-200 hover:border-gray-300"
                )}
                aria-label={`Imagem ${index + 1}`}
                aria-current={activeIndex === index}
                style={{
                  // Blur-up effect para miniaturas também
                  backgroundImage: `url(${image.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: '#f3f4f6',
                }}
              >
                <img
                  src={image.imageUrl}
                  alt={image.altText || `Miniatura ${index + 1}`}
                  loading="lazy"
                  className={cn(
                    "object-cover w-full h-full transition-opacity duration-100",
                    imageLoadingState[index] ? "opacity-0" : "opacity-100"
                  )}
                  onLoad={() => handleImageLoaded(index)}
                  onError={() => handleImageError(index)}
                />
              </button>
            ))}
          </div>
        )}

        {/* Indicador numérico quando múltiplas imagens */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1 bg-white rounded-lg p-2">
            <span className="text-xs text-gray-500">
              {activeIndex + 1} de {images.length}
            </span>
          </div>
        )}

        {/* Botão Adicionar Imagem (se callback fornecido) */}
        {onAddImage && images.length < 7 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddImage}
            className="w-full mt-2"
          >
            + Adicionar Imagem ({images.length}/7)
          </Button>
        )}
      </div>
    );
  }

  // =====================================================
  // LAYOUT: SEM IMAGENS (Placeholder)
  // =====================================================
  return (
    <div className={cn("relative aspect-square  overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center", className)}>
      <div className="text-center">
        <div className="text-gray-400 text-sm mb-4">Nenhuma imagem</div>
        {onAddImage && (
          <Button variant="outline" size="sm" onClick={onAddImage}>
            Adicionar Primeira Imagem
          </Button>
        )}
      </div>
    </div>
  );
}

export default ProductGallery;
