import { useState } from 'react';
import { useCoupons } from '@/hooks/useCouponsPromotions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Coupon } from '@/types/coupon';
import { Tag, Copy, Check } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCallback, useEffect } from 'react';

interface ProductCouponBadgeProps {
  productId: string;
}

export function ProductCouponBadge({ productId }: ProductCouponBadgeProps) {
  const { data: coupons } = useCoupons();
  const [open, setOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filtrar cupons aplicáveis ao produto
  const applicableCoupons = coupons?.filter((coupon) => {
    // Verificar se está ativo
    if (!coupon.active) return false;

    // Verificar se expirou
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return false;
    }

    // Verificar se é aplicável a este produto
    if (coupon.apply_to_all_products) {
      return true;
    }

    return coupon.applicable_products?.includes(productId);
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!applicableCoupons || applicableCoupons.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 w-full sm:w-auto"
      >
        <Tag className="w-4 h-4" />
        {applicableCoupons.length === 1
          ? 'Ver Cupom'
          : `Ver ${applicableCoupons.length} Cupons`}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cupons Disponíveis</DialogTitle>
            <DialogDescription>
              Desconto disponível neste produto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {applicableCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4"
              >
                {/* Cabeçalho */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-blue-600">
                        <Tag className="w-3 h-3 mr-1" />
                        {coupon.coupon_type === 'purchase' ? 'Compra' : 'Produto'}
                      </Badge>
                    </div>
                    <p className="font-mono font-bold text-lg">{coupon.code}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyCode(coupon.code)}
                    className="gap-2"
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>

                {/* Descrição */}
                {coupon.description && (
                  <p className="text-sm text-gray-700 mb-2">{coupon.description}</p>
                )}

                {/* Desconto */}
                <div className="bg-white rounded p-2 mb-2">
                  <p className="text-xs text-gray-600">Desconto</p>
                  <p className="text-lg font-bold text-green-600">
                    {coupon.discount_type === 'fixed'
                      ? formatCurrency(coupon.discount_amount)
                      : `${coupon.discount_percentage}%`}
                  </p>
                </div>

                {/* Informações adicionais */}
                <div className="space-y-1 text-xs text-gray-600">
                  {coupon.min_purchase_amount > 0 && (
                    <p>
                      💰 Compra mínima:{' '}
                      <span className="font-semibold">
                        {formatCurrency(coupon.min_purchase_amount)}
                      </span>
                    </p>
                  )}
                  {coupon.expires_at && (
                    <p>
                      📅 Válido até:{' '}
                      <span className="font-semibold">
                        {new Date(coupon.expires_at).toLocaleDateString('pt-BR')}
                      </span>
                    </p>
                  )}
                  {coupon.max_uses && (
                    <p>
                      🎟️ Usos:{' '}
                      <span className="font-semibold">
                        {coupon.current_uses}/{coupon.max_uses}
                      </span>
                    </p>
                  )}
                </div>

                {/* Botão de Usar */}
                <Button
                  className="w-full mt-3 gap-2"
                  onClick={() => {
                    handleCopyCode(coupon.code);
                    // Aqui você pode adicionar lógica para aplicar automaticamente o cupom
                    // ou abrir o checkout
                  }}
                >
                  <Copy className="w-4 h-4" />
                  Usar Cupom
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
