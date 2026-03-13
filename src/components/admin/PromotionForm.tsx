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
import { Promotion, CreatePromotionInput, UpdatePromotionInput } from '@/types/coupon';

const promotionFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  promotion_type: z.enum(['number']).default('number'),
  participation_value: z.number().min(0, 'Valor não pode ser negativo'),
  is_free: z.boolean().default(false),
  min_order_value: z.number().min(0, 'Valor não pode ser negativo'),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().min(1, 'Data de término é obrigatória'),
  draw_date: z.string().min(1, 'Data do sorteio é obrigatória'),
  number_of_winners: z.number().int().min(1).max(10, 'Máximo 10 ganhadores'),
  total_numbers: z.number().int().min(1, 'Mínimo 1 número'),
  active: z.boolean().default(true),
}).refine(
  (data) => new Date(data.start_date) < new Date(data.end_date),
  {
    message: 'Data de início deve ser antes de data de término',
    path: ['end_date'],
  }
).refine(
  (data) => new Date(data.end_date) < new Date(data.draw_date),
  {
    message: 'Data de término deve ser antes da data do sorteio',
    path: ['draw_date'],
  }
);

type PromotionFormValues = z.infer<typeof promotionFormSchema>;

interface PromotionFormProps {
  promotion?: Promotion;
  onSubmit: (data: CreatePromotionInput | UpdatePromotionInput) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting: boolean;
}

export function PromotionForm({
  promotion,
  onSubmit: onSubmitProp,
  onCancel,
  isSubmitting,
}: PromotionFormProps) {
  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: {
      name: '',
      description: '',
      promotion_type: 'number',
      participation_value: 0,
      is_free: false,
      min_order_value: 0,
      start_date: '',
      end_date: '',
      draw_date: '',
      number_of_winners: 1,
      total_numbers: 1000,
      active: true,
    },
  });

  useEffect(() => {
    if (promotion) {
      form.reset({
        name: promotion.name,
        description: promotion.description,
        promotion_type: 'number',
        participation_value: promotion.participation_value,
        is_free: promotion.is_free,
        min_order_value: promotion.min_order_value,
        start_date: new Date(promotion.start_date).toISOString().split('T')[0],
        end_date: new Date(promotion.end_date).toISOString().split('T')[0],
        draw_date: new Date(promotion.draw_date).toISOString().split('T')[0],
        number_of_winners: promotion.number_of_winners,
        total_numbers: promotion.total_numbers || 1000,
        active: promotion.active,
      });
    } else {
      form.reset();
    }
  }, [promotion, form]);

  async function onSubmit(values: PromotionFormValues) {
    try {
      const payload = {
        ...values,
        start_date: new Date(values.start_date).toISOString(),
        end_date: new Date(values.end_date).toISOString(),
        draw_date: new Date(values.draw_date).toISOString(),
      };

      if (promotion) {
        await onSubmitProp(payload);
      } else {
        await onSubmitProp(payload);
      }
    } catch (error) {
      console.error('Erro ao salvar promoção:', error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Promoção</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex: Promoção Aniversário"
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
                      placeholder="Descrição da promoção..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_free"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    Participação grátis
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!form.watch('is_free') && (
              <FormField
                control={form.control}
                name="participation_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor de Participação (R$)</FormLabel>
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
                    <FormDescription>
                      Clientes pagam este valor para participar do sorteio
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="min_order_value"
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
                  <FormDescription>
                    Compra mínima para o cliente participar
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Término</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="draw_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Sorteio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="number_of_winners"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Ganhadores</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Quantos ganhadores serão sorteados
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="total_numbers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total de Números</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1000"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1000)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Capacidade máxima de números (1 por compra)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 pt-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="rounded border-gray-300"
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    Promoção ativa
                  </FormLabel>
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
            {promotion ? 'Atualizar' : 'Criar'} Promoção
          </Button>
        </div>
      </form>
    </Form>
  );
}
