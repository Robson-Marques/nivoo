import { useMemo, useState } from 'react';
import { useCoupons, useValidateCoupon } from '@/hooks/useCouponsPromotions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Coupon } from '@/types/coupon';
import { Copy, Check, X } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface CouponInputProps {
  orderValue: number;
  onCouponApply?: (coupon: Coupon) => void;
  appliedCoupon?: Coupon | null;
  cartProductIds?: string[];
  mode?: 'checkout' | 'product';
  heading?: string;
  containerClassName?: string;
}

export function CouponInput({ orderValue, onCouponApply, appliedCoupon, cartProductIds, mode = 'checkout', heading, containerClassName }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [showInput, setShowInput] = useState(!appliedCoupon);
  const { data: validatedCoupon, isLoading, error } = useValidateCoupon(code, orderValue);
  const { data: coupons } = useCoupons();

  const handleApply = () => {
    if (validatedCoupon) {
      if (mode === 'checkout') {
        const ok =
          validatedCoupon.coupon_type === 'purchase' ||
          (validatedCoupon.coupon_type === 'product' && validatedCoupon.apply_to_all_products);
        if (!ok) return;
      }

      if (mode === 'product') {
        const ok =
          validatedCoupon.coupon_type === 'product' &&
          !validatedCoupon.apply_to_all_products;
        if (!ok) return;
      }

      onCouponApply?.(validatedCoupon);
      setCode('');
      setShowInput(false);
    }
  };

  const handleRemove = () => {
    onCouponApply?.(null as any);
    setCode('');
    setShowInput(true);
  };

  const appliedDiscountLabel = () => {
    if (!appliedCoupon) return '';
    if (appliedCoupon.discount_type === 'fixed') {
      return formatCurrency(appliedCoupon.discount_amount);
    }
    return `${appliedCoupon.discount_percentage}%`;
  };

  const availableCoupons = useMemo(() => {
    const now = new Date();
    const cartSet = new Set((cartProductIds || []).map(String));

    return (coupons || [])
      .filter((c) => c.active)
      .filter((c) => !c.expires_at || new Date(c.expires_at) >= now)
      .filter((c) => !c.max_uses || c.current_uses < c.max_uses)
      .filter((c) => orderValue >= c.min_purchase_amount)
      .filter((c) => {
        // Regras de escopo:
        // - checkout: cupom de compra OU cupom de produto que vale para todos os produtos
        // - product: somente cupom de produto específico (não apply_to_all_products)
        if (mode === 'checkout') {
          return c.coupon_type === 'purchase' || (c.coupon_type === 'product' && c.apply_to_all_products);
        }

        return c.coupon_type === 'product' && !c.apply_to_all_products;
      })
      .filter((c) => {
        if (c.coupon_type !== 'product') return true;
        if (c.apply_to_all_products) return true;
        const applicable = (c.applicable_products || []).map(String);
        return applicable.some((id) => cartSet.has(id));
      });
  }, [coupons, orderValue, cartProductIds, mode]);

  const shouldRender = !!appliedCoupon || availableCoupons.length > 0;
  if (!shouldRender) return null;

  if (appliedCoupon && !showInput) {
    return (
      <div className={containerClassName || ""}>
        {heading && <div className="font-medium text-sm mb-2">{heading}</div>}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="font-bold text-green-600">Cupom Aplicado</span>
            </div>
            <div className="text-sm space-y-1">
              <p className="font-mono font-bold">{appliedCoupon.code}</p>
              {appliedCoupon.description && (
                <p className="text-gray-600">{appliedCoupon.description}</p>
              )}
              <p className="text-green-600 font-bold">
                Desconto: {appliedDiscountLabel()}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className={("space-y-3 " + (containerClassName || "")).trim()}>
      {heading && <div className="font-medium text-sm">{heading}</div>}

      <div className="flex items-center justify-between">
        <Label>Cupom de Desconto</Label>
      </div>

      {showInput && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Digite o código do cupom"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="flex-1"
            />
            <Button
              onClick={handleApply}
              disabled={!code || isLoading || !validatedCoupon}
              className="gap-2"
            >
              {isLoading ? 'Validando...' : 'Usar'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {validatedCoupon && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-blue-600">{validatedCoupon.code}</p>
                  {validatedCoupon.description && (
                    <p className="text-gray-600 text-xs">{validatedCoupon.description}</p>
                  )}
                  <p className="text-blue-600 font-bold mt-1">
                    Desconto:{' '}
                    {validatedCoupon.discount_type === 'fixed'
                      ? formatCurrency(validatedCoupon.discount_amount)
                      : `${validatedCoupon.discount_percentage}%`}
                  </p>
                </div>
                <Badge className="bg-green-600 whitespace-nowrap">
                  Válido ✓
                </Badge>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dicas de Cupons Populares */}
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          Cupons disponíveis
        </summary>
        <div className="mt-2 space-y-2 bg-gray-50 p-2 rounded text-gray-600">
          {availableCoupons.length === 0 ? (
            <p>Nenhum cupom disponível para este pedido.</p>
          ) : (
            <div className="space-y-2">
              {availableCoupons.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border rounded p-2 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-mono font-bold truncate">{c.code}</div>
                    {c.description && <div className="text-[11px] text-gray-500">{c.description}</div>}
                    <div className="text-[11px] mt-1">
                      {c.discount_type === 'fixed'
                        ? `Desconto: ${formatCurrency(c.discount_amount)}`
                        : `Desconto: ${c.discount_percentage}%`}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      onCouponApply?.(c);
                      setCode('');
                      setShowInput(false);
                    }}
                  >
                    Usar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
