
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ProductAddons } from './ProductAddons';
import { ProductGallery, ProductConfigurator, ProductEnhancedDisplay } from '@/components/products';
import { Product, ProductAddon } from '@/types';
import { Star, Plus, Minus, ShoppingCart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductAddons } from '@/hooks/useProductAddons';
import { useProductExtended, useProductConfigurations } from '@/hooks/useProductAdvanced';
import { Skeleton } from '@/components/ui/skeleton';
import { CouponInput } from '@/components/checkout/CouponInput';
import { Coupon } from '@/types/coupon';
import { productValidationService } from '@/services/productAdvancedService';
import { toast } from 'sonner';
import { useRef } from 'react';
import { useZeroPriceLogic } from '@/hooks/useZeroPriceLogic';

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (product: Product, quantity: number, selectedAddons: ProductAddon[], notes?: string, selectedConfigurations?: Record<string, any>, configurationPrice?: number) => void;
}

export function ProductDetailDialog({ 
  product, 
  open, 
  onOpenChange,
  onAddToCart 
}: ProductDetailDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);
  const [additionalPrice, setAdditionalPrice] = useState(0);
  const [selectedConfigurations, setSelectedConfigurations] = useState<Record<string, any>>({});
  const [appliedProductCoupon, setAppliedProductCoupon] = useState<Coupon | null>(null);
  const [configurationValidationErrors, setConfigurationValidationErrors] = useState<Record<string, string>>({});
  const configuratorRef = useRef<HTMLDivElement>(null);
  const { isZeroPriceProduct } = useZeroPriceLogic();
  const { addons: fetchedAddons, loading: addonsLoading } = useProductAddons(open && !product?.addons?.length ? product?.id : undefined);
  const { product: extendedProduct, isLoading: extendedLoading, showSkeleton } = useProductExtended(open && product?.id ? product.id : '');
  const { configurations: fetchedConfigurations, isLoading: configsLoading } = useProductConfigurations(product?.id || '');
  
  const productAddons = product?.addons || fetchedAddons;
  const images = extendedProduct?.images || [];
  const configurations = fetchedConfigurations || [];
  const hasConfigurations = configurations && configurations.length > 0;
  
  // Debug log
  console.log(`🔍 [ProductDetailDialog] Produto: ${product?.id}, Configurações: ${configurations.length}, HasConfig: ${hasConfigurations}`);
  console.log(`🔍 [ProductDetailDialog] ConfigsLoading: ${configsLoading}, ExtendedLoading: ${extendedLoading}`);
  console.log(`🔍 [ProductDetailDialog] Open: ${open}, Product: ${!!product}`);
  if (configurations.length > 0) {
    console.log(`🔍 [ProductDetailDialog] Primeira configuração:`, configurations[0]);
  }
  const hasAddons = productAddons && productAddons.length > 0;
  const hasOptions = hasConfigurations || hasAddons;

  // Reset state when product changes or dialog closes
  useEffect(() => {
    if (open && product) {
      setQuantity(1);
      setNotes('');
      setSelectedAddons([]);
      setSelectedConfigurations({});
      setAppliedProductCoupon(null);
      setConfigurationValidationErrors({});
    }
  }, [open, product]);

  if (!product) {
    return null;
  }

  const handleAddToCart = () => {
    if (hasConfigurations) {
      const validation = productValidationService.validateConfigurations(
        configurations,
        selectedConfigurations
      );

      if (!validation.isValid) {
        const mapped = (validation.errors || []).reduce(
          (acc: Record<string, string>, e: any) => {
            if (e?.field && e?.message) acc[e.field] = e.message;
            return acc;
          },
          {}
        );
        setConfigurationValidationErrors(mapped);

        // UX: mostrar toast com o primeiro erro e rolar para o campo
        const firstError = validation.errors?.[0];
        if (firstError?.message) {
          toast.error(firstError.message);
        }
        // Rolar para o topo das configurações
        configuratorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    // Combinar dados: adicionais + configurações + preço adicional
    const couponNote = appliedProductCoupon?.code ? `Cupom-produto: ${appliedProductCoupon.code}` : '';
    const couponDiscountNote = appliedProductCoupon
      ? `Cupom-produto-desconto: ${productCouponDiscount.toFixed(2)}`
      : '';
    const mergedNotes = [notes, couponNote, couponDiscountNote].filter(Boolean).join('\n');
    onAddToCart(product, quantity, selectedAddons, mergedNotes, selectedConfigurations, additionalPrice);
    onOpenChange(false);
  };

  const handleConfigChange = (configId: string, value: any) => {
    setSelectedConfigurations(prev => ({
      ...prev,
      [configId]: value
    }));
    setConfigurationValidationErrors((prev) => {
      if (!prev[configId]) return prev;
      const { [configId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleAddonSelection = (addon: ProductAddon, selected: boolean, quantity: number = 1) => {
    if (selected) {
      const existingAddonIndex = selectedAddons.findIndex(a => a.id === addon.id);
      
      if (existingAddonIndex >= 0) {
        // Update existing addon
        const updatedAddons = [...selectedAddons];
        updatedAddons[existingAddonIndex] = {
          ...updatedAddons[existingAddonIndex],
          quantity,
          selected: true
        };
        setSelectedAddons(updatedAddons);
      } else {
        // Add new addon
        setSelectedAddons([...selectedAddons, { ...addon, quantity, selected: true }]);
      }
    } else {
      // Remove addon
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    }
  };

  const totalPrice = (
    product.price * quantity + 
    selectedAddons.reduce((sum, addon) => sum + addon.price * (addon.quantity || 1), 0) +
    additionalPrice
  );

  const clampToTwoDecimals = (value: number) => Math.round(value * 100) / 100;
  const calculateProductCouponDiscount = () => {
    if (!appliedProductCoupon) return 0;
    // Aplica APENAS no valor do produto base (sem adicionais/configurações)
    const baseAmount = product.price * quantity;
    const raw =
      appliedProductCoupon.discount_type === 'fixed'
        ? appliedProductCoupon.discount_amount
        : (baseAmount * appliedProductCoupon.discount_percentage) / 100;
    return clampToTwoDecimals(Math.max(0, Math.min(raw, baseAmount)));
  };

  const productCouponDiscount = calculateProductCouponDiscount();
  const totalAfterProductCoupon = clampToTwoDecimals(Math.max(0, totalPrice - productCouponDiscount));

  // Renderizar skeleton apenas se realmente estiver demorando
  // (mostra apenas após 200ms de carregamento - se dados chegarem rápido, skeleton nem aparece)
  if (showSkeleton) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          {/* Skeleton Loading State */}
          <div className="space-y-4">
            {/* Imagem Principal Skeleton */}
            <Skeleton className="w-full aspect-square rounded-lg" />
            
            {/* Miniaturas Skeleton */}
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="w-16 h-16 rounded-md" />
              ))}
            </div>

            {/* Título e Descrição Skeleton */}
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            
            {/* Preço Skeleton */}
            <Skeleton className="h-6 w-1/3" />

            {/* Configurações Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-1/2" />
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>

            {/* Observações Skeleton */}
            <Skeleton className="h-20 w-full" />

            {/* Quantidade e Botão Skeleton */}
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="w-full rounded-md bg-gray-100 mb-4 relative">
            {images.length > 0 ? (
              <ProductGallery 
                images={images} 
                productName={product.name}
                isLoading={false}
              />
            ) : (
              <div className="w-full aspect-square relative">
                <img
                  src={product.imageUrl || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.featured && (
                  <Badge className="absolute top-4 left-4 bg-delivery-500 hover:bg-delivery-600">
                    <Star className="h-3 w-3 mr-1 fill-current" /> Destaque
                  </Badge>
                )}
              </div>
            )}
          </div>
          <DialogTitle className="text-xl">{product.name}</DialogTitle>
          <p className="text-muted-foreground">{product.description}</p>
          
          {!isZeroPriceProduct(product.price) && (
            <div className="text-lg font-bold text-delivery-700 mt-2 flex items-center gap-2 flex-wrap">
              <span>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(product.price)}
              </span>
              {additionalPrice > 0 && (
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  +R$ {additionalPrice.toFixed(2)}
                </span>
              )}
            </div>
          )}
          {isZeroPriceProduct(product.price) && (
            <div className="text-sm text-muted-foreground mt-2">
              Preço será calculado com suas escolhas
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Enhancements (badges, trust triggers, warranty) */}
          {(Boolean(extendedProduct?.enhancements) || (extendedProduct?.badges || []).length > 0) && (
            <ProductEnhancedDisplay 
              badges={extendedProduct.badges || []}
              enhancement={extendedProduct.enhancements}
            />
          )}

          {/* Button para abrir Opções (Configurações + Adicionais) */}
          {!extendedLoading && hasOptions && (
            <div className="border-t pt-4">
              <CouponInput
                heading="Cupom do produto"
                containerClassName="mb-4"
                orderValue={product.price * quantity}
                appliedCoupon={appliedProductCoupon}
                cartProductIds={[String(product.id)]}
                mode="product"
                onCouponApply={(c) => setAppliedProductCoupon(c)}
              />

              {/* Product Configurations */}
              {configsLoading ? (
                <div className="py-4 text-center text-muted-foreground">
                  Carregando configurações...
                </div>
              ) : hasConfigurations && (
                <div className="mb-4" ref={configuratorRef}>
                  <ProductConfigurator
                    configurations={configurations}
                    selectedConfigs={selectedConfigurations}
                    validationErrors={configurationValidationErrors}
                    onConfigChange={handleConfigChange}
                    onAdditionalPriceChange={setAdditionalPrice}
                    disabled={false}
                  />
                </div>
              )}

              {/* Product Addons */}
              {addonsLoading ? (
                <div className="py-4 text-center text-muted-foreground">
                  Carregando adicionais...
                </div>
              ) : hasAddons ? (
                <ProductAddons 
                  addons={productAddons.map(addon => ({
                    ...addon,
                    selected: selectedAddons.some(a => a.id === addon.id),
                    quantity: selectedAddons.find(a => a.id === addon.id)?.quantity || 0
                  }))} 
                  onSelect={handleAddonSelection} 
                />
              ) : null}
            </div>
          )}

          {/* Carregando configurações */}
          {extendedLoading && (
            <div className="border-t pt-4">
              <div className="py-4 text-center text-muted-foreground">
                Carregando opções...
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Observações</h4>
            <Textarea
              placeholder="Ex: Sem cebola, molho à parte, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="font-medium">Quantidade</div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={quantity <= 1}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2 sm:space-y-2">
          <div className="w-full flex justify-between items-center">
            <span className="font-medium">Total</span>
            <span className="text-lg font-bold text-delivery-700">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totalAfterProductCoupon)}
            </span>
          </div>
          
          <div className="flex w-full gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={handleAddToCart} 
              className={cn(
                "flex-1 gap-2 bg-delivery-500 hover:bg-delivery-600",
                !product.available && "opacity-50 cursor-not-allowed"
              )}
              disabled={!product.available}
            >
              <ShoppingCart className="h-4 w-4" />
              Adicionar ao pedido
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
