import { useState } from 'react';
import {
  useCreateCoupon,
  useDeleteCoupon,
  useCoupons,
  useUpdateCoupon,
} from '@/hooks/useCouponsPromotions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { Coupon, CreateCouponInput, UpdateCouponInput } from '@/types/coupon';
import { CouponForm } from './CouponForm';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

export function CouponsManager() {
  const { data: coupons, isLoading, error } = useCoupons();
  const createCoupon = useCreateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateCoupon = useUpdateCoupon(selectedCoupon?.id || '');

  const handleCreate = async (data: CreateCouponInput) => {
    setIsSubmitting(true);
    try {
      await createCoupon.mutateAsync(data);
      setOpenDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: UpdateCouponInput) => {
    if (!selectedCoupon) return;
    setIsSubmitting(true);
    try {
      await updateCoupon.mutateAsync(data);
      setOpenDialog(false);
      setSelectedCoupon(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Tem certeza que deseja deletar este cupom?')) return;
    await deleteCoupon.mutateAsync(couponId);
  };

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCoupon(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-sm text-gray-500">Carregando cupons...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-red-200 rounded-lg bg-red-50">
        <p className="text-sm text-red-600 font-semibold">Erro ao carregar cupons</p>
        <p className="text-xs text-red-500 mt-2">{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Cupons</h2>
        <Button
          onClick={() => {
            setSelectedCoupon(null);
            setOpenDialog(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Cupom
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Desconto</TableHead>
              <TableHead>Aplicação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Válido Até</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!coupons || coupons.length === 0) ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-sm text-gray-500">Nenhum cupom encontrado</p>
                    <p className="text-xs text-gray-400">Clique em "Novo Cupom" para criar um</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                  <TableCell>
                    <Badge
                      variant={coupon.coupon_type === 'purchase' ? 'default' : 'secondary'}
                    >
                      {coupon.coupon_type === 'purchase' ? 'Compra' : 'Produto'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {coupon.discount_type === 'fixed'
                      ? formatCurrency(coupon.discount_amount)
                      : `${coupon.discount_percentage}%`}
                  </TableCell>
                  <TableCell>
                    {coupon.apply_to_all_products ? (
                      <Badge variant="outline">Todos</Badge>
                    ) : (
                      <Badge variant="outline">
                        {coupon.applicable_products?.length || 0} produtos
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.active ? 'default' : 'destructive'}>
                      {coupon.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {coupon.current_uses}/{coupon.max_uses || '∞'}
                  </TableCell>
                  <TableCell>
                    {coupon.expires_at ? formatDate(coupon.expires_at) : 'Sem validade'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(coupon)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(coupon.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={openDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCoupon ? 'Editar Cupom' : 'Novo Cupom'}
            </DialogTitle>
            <DialogDescription>
              {selectedCoupon
                ? 'Atualize as informações do cupom'
                : 'Crie um novo cupom de desconto'}
            </DialogDescription>
          </DialogHeader>
          <CouponForm
            onSubmit={selectedCoupon ? handleUpdate : handleCreate}
            onCancel={handleCloseDialog}
            coupon={selectedCoupon || undefined}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
