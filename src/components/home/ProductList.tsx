import React, { useState, useEffect, useRef } from "react";
import { Product, ProductAddon } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductDetailDialog } from "./ProductDetailDialog";
import { Plus, Star, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { productConfigurationsService } from "@/services/productAdvancedService";
import { useZeroPriceLogic } from "@/hooks/useZeroPriceLogic";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductListProps {
  products: Product[];
  onAddToCart: (
    product: Product,
    quantity?: number,
    selectedAddons?: ProductAddon[],
    notes?: string
  ) => void;
  isLoading?: boolean;
  isError?: boolean;
}

export function ProductList({
  products,
  onAddToCart,
  isLoading = false,
  isError = false,
}: ProductListProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productsWithConfigs, setProductsWithConfigs] = useState<Set<string>>(new Set());
  const scrollPositionRef = useRef(0);
  const { isZeroPriceProduct } = useZeroPriceLogic();

  // Preservar posição do scroll quando Dialog abre/fecha
  useEffect(() => {
    if (dialogOpen) {
      // Guardar posição atual
      scrollPositionRef.current = window.scrollY;
    } else {
      // Restaurar posição quando Dialog fecha
      if (scrollPositionRef.current > 0) {
        setTimeout(() => {
          window.scrollTo(0, scrollPositionRef.current);
        }, 0);
      }
    }
  }, [dialogOpen]);

  // Verificar quais produtos têm configurações personalizadas
  useEffect(() => {
    const checkConfigurations = async () => {
      const productsWithConfigs = new Set<string>();
      
      for (const product of products) {
        try {
          const configs = await productConfigurationsService.getProductConfigurations(product.id);
          if (configs && configs.length > 0) {
            productsWithConfigs.add(product.id);
          }
        } catch (error) {
          // Ignorar erros silenciosamente
          console.error(`Erro ao verificar configurações do produto ${product.id}:`, error);
        }
      }
      
      setProductsWithConfigs(productsWithConfigs);
    };

    if (products.length > 0) {
      checkConfigurations();
    }
  }, [products]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="overflow-hidden border">
            <div className="flex flex-col h-full">
              <div className="relative w-full aspect-square">
                <Skeleton className="w-full h-full absolute inset-0" />
              </div>
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-1/3 mt-2" />
                <Skeleton className="h-8 w-full mt-2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Erro ao carregar produtos. Tente novamente.</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum produto encontrado.</p>
      </div>
    );
  }

  const handleOpenProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleSimpleAddToCart = (product: Product) => {
    if (product.available) {
      onAddToCart(product);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card
            key={product.id}
            className="overflow-hidden border hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col h-full">
              <div className="relative w-full aspect-square">
                <img
                  src={product.imageUrl || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover absolute inset-0"
                />
                {product.featured && (
                  <Badge className="absolute top-1 right-1 bg-delivery-500 hover:bg-delivery-600">
                    <Star className="h-3 w-3 mr-1 fill-current" /> Destaque
                  </Badge>
                )}
              </div>

              <div className="flex-1 p-4 flex flex-col">
                <h3 className="font-bold text-lg mb-1 line-clamp-1 sm:line-clamp-1">
                  {product.name.length > 25 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help hidden sm:inline">{product.name}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-center">{product.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="hidden sm:inline">{product.name}</span>
                  )}
                  <span className="sm:hidden">{product.name}</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {product.description}
                </p>
                {!isZeroPriceProduct(product.price) && (
                  <div className="text-lg font-bold text-delivery-700 mt-auto">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(product.price)}
                  </div>
                )}
                {isZeroPriceProduct(product.price) && (
                  <div className="text-sm text-muted-foreground mt-auto">
                    Escolha as opções para ver o preço
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  {isZeroPriceProduct(product.price) ? (
                    // Produtos R$0,00 - APENAS opções é obrigatório
                    <Button
                      className={cn(
                        "gap-2 w-full bg-delivery-500 hover:bg-delivery-600",
                        !product.available && "opacity-50 cursor-not-allowed"
                      )}
                      size="sm"
                      onClick={() =>
                        product.available && handleOpenProductDetails(product)
                      }
                      disabled={!product.available}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      Opções
                    </Button>
                  ) : (product.addons && product.addons.length > 0) || productsWithConfigs.has(product.id) ? (
                    // Produtos com preço e com addons/configs - mostrar Opções + botão +
                    <>
                      <Button
                        className={cn(
                          "gap-2 flex-1 bg-delivery-500 hover:bg-delivery-600",
                          !product.available && "opacity-50 cursor-not-allowed"
                        )}
                        size="sm"
                        onClick={() =>
                          product.available && handleOpenProductDetails(product)
                        }
                        disabled={!product.available}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        Opções
                      </Button>
                      <Button
                        className={cn(
                          "gap-2 w-auto",
                          !product.available && "opacity-50 cursor-not-allowed"
                        )}
                        size="sm"
                        onClick={() => handleSimpleAddToCart(product)}
                        disabled={!product.available}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    // Produtos simples sem configurações - apenas adicionar
                    <Button
                      className={cn(
                        "gap-2 w-full",
                        !product.available && "opacity-50 cursor-not-allowed"
                      )}
                      size="sm"
                      onClick={() => handleSimpleAddToCart(product)}
                      disabled={!product.available}
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ProductDetailDialog
        product={selectedProduct}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAddToCart={onAddToCart}
      />
    </>
  );
}
