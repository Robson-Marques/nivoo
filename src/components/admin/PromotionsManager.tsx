import { useState } from 'react';
import {
  useCreatePromotion,
  useDeletePromotion,
  usePromotions,
  useUpdatePromotion,
  usePromotionNumbers,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trash2,
  Edit2,
  Plus,
  Trophy,
  Users,
  AlertCircle,
} from 'lucide-react';
import { Promotion } from '@/types/coupon';
import { PromotionForm } from './PromotionForm';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PromotionDraw } from './PromotionDraw';

export function PromotionsManager() {
  const { data: promotions, isLoading, error } = usePromotions();
  const createPromotion = useCreatePromotion();
  const deletePromotion = useDeletePromotion();

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTab, setSelectedTab] = useState('list');

  const updatePromotion = useUpdatePromotion(selectedPromotion?.id || '');

  const handleCreate = async (data: any) => {
    setIsSubmitting(true);
    try {
      await createPromotion.mutateAsync(data);
      setOpenDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!selectedPromotion) return;
    setIsSubmitting(true);
    try {
      await updatePromotion.mutateAsync(data);
      setOpenDialog(false);
      setSelectedPromotion(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (promotionId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta promoção?')) return;
    await deletePromotion.mutateAsync(promotionId);
  };

  const handleEdit = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setSelectedTab('form');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPromotion(null);
    setSelectedTab('list');
  };

  const isPromotionActive = (promo: Promotion) => {
    const now = new Date();
    const startDate = new Date(promo.start_date);
    const endDate = new Date(promo.end_date);
    return promo.active && now >= startDate && now <= endDate;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-sm text-gray-500">Carregando promoções...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-red-200 rounded-lg bg-red-50">
        <p className="text-sm text-red-600 font-semibold">Erro ao carregar promoções</p>
        <p className="text-xs text-red-500 mt-2">{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Promoções</h2>
        <Button
          onClick={() => {
            setSelectedPromotion(null);
            setSelectedTab('list');
            setOpenDialog(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Promoção
        </Button>
      </div>

      {/* Alertas */}
      <div className="space-y-2">
        {promotions && promotions.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Nenhuma promoção criada ainda.</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Sorteio</TableHead>
              <TableHead>Ganhadores</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions?.map((promo) => (
              <TableRow key={promo.id}>
                <TableCell className="font-medium max-w-xs truncate">
                  {promo.name}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {promo.promotion_type === 'code' ? 'Código' : 'Número'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {promo.is_free ? (
                    <Badge variant="secondary">Grátis</Badge>
                  ) : (
                    formatCurrency(promo.participation_value)
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {formatDate(promo.start_date)} até<br />
                  {formatDate(promo.end_date)}
                </TableCell>
                <TableCell className="text-xs">
                  {formatDate(promo.draw_date)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    <Trophy className="w-3 h-3 mr-1" />
                    {promo.number_of_winners}
                  </Badge>
                </TableCell>
                <TableCell>
                  {isPromotionActive(promo) ? (
                    <Badge className="bg-green-500">Ativa</Badge>
                  ) : promo.active ? (
                    <Badge variant="outline">Agendada</Badge>
                  ) : (
                    <Badge variant="destructive">Inativa</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <PromotionDetailsButton promotion={promo} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(promo)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(promo.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={openDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPromotion ? 'Editar Promoção' : 'Nova Promoção'}
            </DialogTitle>
            <DialogDescription>
              {selectedPromotion
                ? 'Atualize as informações da promoção'
                : 'Crie uma nova promoção com sorteio'}
            </DialogDescription>
          </DialogHeader>
          <PromotionForm
            onSubmit={selectedPromotion ? handleUpdate : handleCreate}
            onCancel={handleCloseDialog}
            promotion={selectedPromotion || undefined}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente auxiliar para ver detalhes
function PromotionDetailsButton({ promotion }: { promotion: Promotion }) {
  const { data: numbers } = usePromotionNumbers(promotion.id);
  const [open, setOpen] = useState(false);
  const [openDraw, setOpenDraw] = useState(false);

  const winners = numbers?.filter((n) => n.is_winner) || [];
  const generated = numbers?.length || 0;

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Users className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes - {promotion.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-2xl font-bold text-blue-600">{generated}</div>
              <div className="text-xs text-gray-600">Números Gerados</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-2xl font-bold text-green-600">{winners.length}</div>
              <div className="text-xs text-gray-600">Ganhadores</div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {promotion.number_of_winners}
              </div>
              <div className="text-xs text-gray-600">Esperados</div>
            </div>
          </div>

          {promotion.promotion_type === 'number' && (
            <div className="pb-4">
              <Button className="w-full gap-2" onClick={() => setOpenDraw(true)}>
                <Trophy className="w-4 h-4" />
                Sorteio manual
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openDraw} onOpenChange={setOpenDraw}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sorteio - {promotion.name}</DialogTitle>
            <DialogDescription>
              Sorteio manual com contagem e resultado em tempo real
            </DialogDescription>
          </DialogHeader>
          <PromotionDraw promotionId={promotion.id} onClose={() => setOpenDraw(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
