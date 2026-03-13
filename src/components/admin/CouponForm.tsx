import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useProducts } from '@/hooks/useProducts';
import { Coupon, CreateCouponInput, UpdateCouponInput } from '@/types/coupon';

const couponFormSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório').toUpperCase(),
  description: z.string().optional(),
  discount_type: z.enum(['fixed', 'percentage']),
  discount_amount: z.number().min(0).optional(),
  discount_percentage: z.number().min(0).max(100).optional(),
  coupon_type: z.enum(['purchase', 'product']),
  apply_to_all_products: z.boolean().default(true),
  applicable_products: z.array(z.string()).optional(),
  min_purchase_amount: z.number().min(0, 'Valor mínimo não pode ser negativo'),
  max_uses: z.number().int().positive('Máximo de usos deve ser positivo'),
  expires_at: z.string().optional(),
  active: z.boolean().default(true),
});

type CouponFormValues = z.infer<typeof couponFormSchema>;

interface CouponFormProps {
  coupon?: Coupon;
  onSubmit: (data: CreateCouponInput | UpdateCouponInput) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting: boolean;
}

export function CouponForm({
  coupon,
  onSubmit: onSubmitProp,
  onCancel,
  isSubmitting,
}: CouponFormProps) {
  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: '',
      description: '',
      discount_type: 'fixed',
      discount_amount: 0,
      discount_percentage: 0,
      coupon_type: 'purchase',
      apply_to_all_products: true,
      applicable_products: [],
      min_purchase_amount: 0,
      max_uses: 100,
      expires_at: '',
      active: true,
    },
  });

  const { data: products } = useProducts();

  useEffect(() => {
    if (coupon) {
      form.reset({
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_amount: coupon.discount_type === 'fixed' ? coupon.discount_amount : 0,
        discount_percentage: coupon.discount_type === 'percentage' ? coupon.discount_percentage : 0,
        coupon_type: coupon.coupon_type,
        apply_to_all_products: coupon.apply_to_all_products,
        applicable_products: coupon.applicable_products || [],
        min_purchase_amount: coupon.min_purchase_amount,
        max_uses: coupon.max_uses || 100,
        expires_at: coupon.expires_at
          ? new Date(coupon.expires_at).toISOString().split('T')[0]
          : '',
        active: coupon.active,
      });
    } else {
      form.reset();
    }
  }, [coupon, form]);

  async function onSubmit(values: CouponFormValues) {
    try {
      const input = {
        code: values.code,
        description: values.description,
        discount_type: values.discount_type,
        discount_amount: values.discount_type === 'fixed' ? values.discount_amount : 0,
        discount_percentage: values.discount_type === 'percentage' ? values.discount_percentage : 0,
        coupon_type: values.coupon_type,
        apply_to_all_products: values.apply_to_all_products,
        applicable_products: values.apply_to_all_products ? [] : values.applicable_products,
        min_purchase_amount: values.min_purchase_amount,
        max_uses: values.max_uses,
        expires_at: values.expires_at
          ? new Date(values.expires_at).toISOString()
          : null,
      };

      if (coupon) {
        await onSubmitProp({ ...input, active: values.active });
      } else {
        await onSubmitProp(input);
      }
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
    }
  }

  const applyToAll = form.watch('apply_to_all_products');
  const discountType = form.watch('discount_type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do Cupom</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="EX: DESCONTO10"
                      disabled={!!coupon}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição do cupom para exibição ao cliente"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="coupon_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cupom</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="purchase">Desconto na Compra</SelectItem>
                        <SelectItem value="product">Desconto no Produto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discount_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Desconto</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                        <SelectItem value="percentage">
                          Percentual (%)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {discountType === 'fixed' ? (
                <FormField
                  control={form.control}
                  name="discount_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor de Desconto (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="discount_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentual de Desconto (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="apply_to_all_products"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    Aplicar em todos os produtos
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!applyToAll && (
              <FormField
                control={form.control}
                name="applicable_products"
                render={() => (
                  <FormItem>
                    <FormLabel>Selecione os Produtos</FormLabel>
                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded p-3">
                      {products?.map((product) => (
                        <FormField
                          key={product.id}
                          control={form.control}
                          name="applicable_products"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(product.id)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), product.id]
                                      : field.value?.filter(
                                          (id) => id !== product.id
                                        ) || [];
                                    field.onChange(newValue);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {product.name}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_purchase_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Mínimo de Compra</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_uses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo de Usos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expires_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Expiração</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>Deixe em branco para sem expiração</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    Ativo
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {coupon ? 'Atualizar' : 'Criar'} Cupom
          </Button>
        </div>
      </form>
    </Form>
  );
}
