// ProductImageUploader.tsx
// Componente admin para upload e gerenciamento de imagens do produto

import React, { useState, useRef } from "react";
import { Upload, Trash2, GripVertical, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ProductImage } from "@/types/productAdvanced";
import { productImagesService } from "@/services/productAdvancedService";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface ProductImageUploaderProps {
  productId: string;
  images: ProductImage[];
  onImagesChange?: (images: ProductImage[]) => void;
  maxImages?: number;
  className?: string;
}

export function ProductImageUploader({
  productId,
  images,
  onImagesChange,
  maxImages = 7,
  className,
}: ProductImageUploaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isSettingPrimary, setIsSettingPrimary] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingAlt, setEditingAlt] = useState<string | null>(null);

  const updateProductsCacheImageUrl = (newImageUrl: string) => {
    queryClient.setQueryData(["products"], (oldData: any) => {
      if (!oldData) return oldData;
      if (!Array.isArray(oldData)) return oldData;

      return oldData.map((p: any) => {
        if (p?.id !== productId) return p;
        return {
          ...p,
          image_url: newImageUrl,
          imageUrl: newImageUrl,
        };
      });
    });
  };

  const canAddMore = images.length < maxImages;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione uma imagem válida",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Arquivo muito grande (máx 5MB)",
      });
      return;
    }

    if (!canAddMore) {
      toast({
        variant: "destructive",
        title: "Limite atingido",
        description: `Máximo ${maxImages} imagens por produto`,
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Comprimir imagem antes do upload
      const compressedFile = await compressImage(file);

      // Gerar nome único para arquivo
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${random}-${file.name.split('.')[0]}.jpg`;
      const filePath = `${productId}/${fileName}`;

      // Upload para Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, compressedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const imageUrl = urlData?.publicUrl;

      if (!imageUrl) {
        throw new Error("Não foi possível obter URL pública");
      }

      // Salvar no banco apenas a URL curta
      const newImage = await productImagesService.addProductImage(
        productId,
        imageUrl,
        undefined,
        images.length === 0
      );

      const updatedImages = [...images, newImage];
      const sortedImages = [...updatedImages].sort((a, b) => {
        if (a.isPrimary === b.isPrimary) return 0;
        return a.isPrimary ? -1 : 1;
      });
      if (onImagesChange) {
        onImagesChange(sortedImages);
      }

      // Atualizar imediatamente as listagens (Admin Produtos / PDV) sem refetch pesado
      if (newImage?.isPrimary) {
        updateProductsCacheImageUrl(newImage.imageUrl);
      }
      toast({
        title: "Sucesso",
        description: "Imagem adicionada com sucesso",
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : String(error);
      
      toast({
        variant: "destructive",
        title: "Erro ao fazer upload",
        description: errorMessage || "Erro desconhecido",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Função para comprimir imagem
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Não foi possível acessar canvas"));
            return;
          }

          // Redimensionar (máx 1200x1200)
          const maxWidth = 1200;
          const maxHeight = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Converter para Blob (não base64)
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Falha ao processar imagem"));
                return;
              }
              const newFile = new File([blob], file.name.split('.')[0] + '.jpg', {
                type: 'image/jpeg',
              });
              resolve(newFile);
            },
            'image/jpeg',
            0.7 // Qualidade 70% é bom para web
          );
        };
        img.onerror = () => {
          reject(new Error("Erro ao carregar imagem"));
        };
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDelete = async (imageId: string) => {
    // Proteção extra: nunca feche modal nem atualize produto aqui
    // Previne múltiplas deleções simultâneas
    if (isDeletingImage) {
      return;
    }
    
    let confirmed = false;
    try {
      confirmed = window.confirm("Tem certeza que deseja deletar esta imagem?");
    } catch {
      // fallback para ambientes sem window
      confirmed = true;
    }
    if (!confirmed) {
      return;
    }

    setIsDeletingImage(true);
    try {
      await productImagesService.deleteProductImage(imageId);
      // Atualizar apenas o estado local, SEM disparar nenhum save automático
      const updatedImages = images.filter((img) => img.id !== imageId);
      if (onImagesChange) {
        onImagesChange(updatedImages);
      }

      // Se removeu a primária, atualiza a capa do produto localmente
      const deletedWasPrimary = images.find((img) => img.id === imageId)?.isPrimary;
      if (deletedWasPrimary) {
        const newPrimary = updatedImages.find((img) => img.isPrimary);
        updateProductsCacheImageUrl(newPrimary?.imageUrl || "");
      }
      toast({
        title: "Sucesso",
        description: "Imagem removida.",
      });
    } catch (error) {
      // Nunca feche modal nem atualize produto, só mostre erro
      toast({
        variant: "destructive",
        title: "Erro ao deletar imagem",
        description: error instanceof Error ? error.message : "Erro ao deletar imagem. Tente novamente.",
      });
    } finally {
      setIsDeletingImage(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    // Previne múltiplas operações simultâneas
    if (isSettingPrimary) return;
    
    setIsSettingPrimary(true);
    try {
      await productImagesService.setPrimaryImage(imageId, productId);
      const updatedImages = images.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      }));

      // Garantir que a imagem primária apareça imediatamente como a primeira
      // (muitas telas usam a primeira imagem como capa)
      const sortedImages = [...updatedImages].sort((a, b) => {
        if (a.isPrimary === b.isPrimary) return 0;
        return a.isPrimary ? -1 : 1;
      });
      if (onImagesChange) {
        onImagesChange(sortedImages);
      }

      // Atualizar imediatamente as listagens (Admin Produtos / PDV) sem refetch pesado
      const primaryImageUrl = images.find((img) => img.id === imageId)?.imageUrl;
      if (primaryImageUrl) {
        updateProductsCacheImageUrl(primaryImageUrl);
      }
      toast({
        title: "Sucesso",
        description: "Imagem primária atualizada",
      });
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Erro ao definir imagem primária";
      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });
    } finally {
      setIsSettingPrimary(false);
    }
  };

  const handleReloadImages = async () => {
    setIsReloading(true);
    try {
      console.log("🔄 Recarregando imagens do banco de dados...");
      const freshImages = await productImagesService.getProductImages(productId);
      console.log("✅ Imagens recarregadas:", freshImages.length);
      
      if (onImagesChange) {
        onImagesChange(freshImages);
      }
      
      toast({
        title: "Sucesso",
        description: `${freshImages.length} imagens carregadas do banco de dados`,
      });
    } catch (error) {
      console.error("❌ Erro ao recarregar imagens:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao recarregar imagens do banco de dados",
      });
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Galeria de Imagens</CardTitle>
            <CardDescription>
              Adicione até {maxImages} imagens para o produto ({images.length}/{maxImages})
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReloadImages}
            disabled={isReloading}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isReloading && "animate-spin")} />
            {isReloading ? "Recarregando..." : "Recarregar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        {canAddMore && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition",
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-900">
              Clique ou arraste imagens aqui
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Aceita JPEG, PNG, WebP (máx 5MB)
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              disabled={isUploading}
              className="hidden"
            />
          </div>
        )}

        {/* Lista de Imagens */}
        {images.length > 0 && (
          <div className="space-y-2">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition"
              >
                {/* Ícone Arraste */}
                <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />

                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={image.imageUrl}
                    alt={image.altText}
                    className="object-cover w-full h-full"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      Imagem {index + 1}
                    </p>
                    {image.isPrimary && (
                      <Badge variant="secondary" className="text-xs">
                        <Check className="w-3 h-3 mr-1" />
                        Principal
                      </Badge>
                    )}
                  </div>
                  <Input
                    type="text"
                    placeholder="Texto alternativo (alt)"
                    value={image.altText || ""}
                    onChange={(e) => setEditingAlt(e.target.value)}
                    className="text-xs h-7"
                  />
                </div>

                {/* Ações */}
                <div className="flex gap-1 flex-shrink-0">
                  {!image.isPrimary && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSetPrimary(image.id);
                      }}
                      title="Definir como imagem principal"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(image.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mensagem Vazio */}
        {images.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Nenhuma imagem adicionada ainda</p>
          </div>
        )}

        {/* Aviso Limite */}
        {!canAddMore && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              Você atingiu o limite de {maxImages} imagens
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProductImageUploader;
