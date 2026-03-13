import { useState } from 'react';
import { useDrawWinners, usePromotion, usePromotionNumbers } from '@/hooks/useCouponsPromotions';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { motion, AnimatePresence } from 'framer-motion';

interface PromotionDrawProps {
  promotionId: string;
  onClose?: () => void;
}

export function PromotionDraw({ promotionId, onClose }: PromotionDrawProps) {
  const { data: promotion } = usePromotion(promotionId);
  const { data: numbers } = usePromotionNumbers(promotionId);
  const drawWinners = useDrawWinners(promotionId);

  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const availableNumbers = numbers?.filter((n) => !n.is_winner) || [];
  const winners = drawWinners.data || [];

  const handleStartDraw = async () => {
    if (availableNumbers.length === 0) {
      return;
    }

    setIsDrawing(true);
    setCountdownValue(3);

    // Animação de contagem regressiva
    for (let i = 3; i > 0; i--) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCountdownValue(i - 1);
    }

    // Executar sorteio
    await drawWinners.mutateAsync();
    setIsDrawing(false);
    setShowResults(true);
    setCountdownValue(null);
  };

  if (!promotion) {
    return <div>Carregando...</div>;
  }

  const canDraw = availableNumbers.length >= promotion.number_of_winners;

  return (
    <div className="space-y-4">
      {/* Informações */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border">
        <h3 className="font-bold mb-2">{promotion.name}</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Números Disponíveis</p>
            <p className="text-2xl font-bold text-blue-600">{availableNumbers.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Ganhadores</p>
            <p className="text-2xl font-bold text-purple-600">{promotion.number_of_winners}</p>
          </div>
          <div>
            <p className="text-gray-600">Total de Números</p>
            <p className="text-2xl font-bold text-green-600">{numbers?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {new Date() < new Date(promotion.draw_date) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Sorteio agendado para {new Date(promotion.draw_date).toLocaleDateString('pt-BR')}
          </AlertDescription>
        </Alert>
      )}

      {availableNumbers.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Não há números disponíveis para sorteio
          </AlertDescription>
        </Alert>
      )}

      {availableNumbers.length < promotion.number_of_winners && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Números disponíveis ({availableNumbers.length}) menores que ganhadores solicitados
            ({promotion.number_of_winners})
          </AlertDescription>
        </Alert>
      )}

      {/* Animação de Contagem Regressiva */}
      <AnimatePresence>
        {countdownValue !== null && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-full w-48 h-48 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <motion.div
                key={countdownValue}
                className="text-8xl font-bold text-purple-600"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                {countdownValue || '🎉'}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão de Sorteio */}
      <Button
        onClick={handleStartDraw}
        disabled={!canDraw || isDrawing || drawWinners.isPending}
        className="w-full h-12 text-lg gap-2"
      >
        {isDrawing || drawWinners.isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Realizando Sorteio...
          </>
        ) : (
          <>
            <Trophy className="w-5 h-5" />
            Realizar Sorteio
          </>
        )}
      </Button>

      {/* Resultados */}
      {showResults && winners.length > 0 && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-bold text-green-600">Sorteio Realizado com Sucesso!</span>
            </div>

            <div className="space-y-2">
              {winners.map((winner, index) => (
                <div
                  key={index}
                  className="bg-white p-3 rounded border border-green-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold">{winner.customer_name}</div>
                    <div className="text-sm text-gray-600">Número: {winner.number}</div>
                  </div>
                  <Badge
                    className={
                      winner.prize_position === 1
                        ? 'bg-yellow-500'
                        : winner.prize_position === 2
                          ? 'bg-gray-400'
                          : 'bg-orange-600'
                    }
                  >
                    {winner.prize_position === 1 && '🥇 1º Lugar'}
                    {winner.prize_position === 2 && '🥈 2º Lugar'}
                    {winner.prize_position === 3 && '🥉 3º Lugar'}
                    {winner.prize_position > 3 && `${winner.prize_position}º Lugar`}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Números */}
      {numbers && numbers.length > 0 && (
        <div className="max-h-64 overflow-y-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Número</th>
                <th className="px-3 py-2 text-left font-semibold">Cliente</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {numbers.map((number) => (
                <tr
                  key={number.id}
                  className={number.is_winner ? 'bg-green-50' : ''}
                >
                  <td className="px-3 py-2 font-mono font-bold">{number.number}</td>
                  <td className="px-3 py-2">{number.customer_name}</td>
                  <td className="px-3 py-2">
                    {number.is_winner ? (
                      <Badge className="bg-green-600">
                        Ganhador {number.prize_position}º
                      </Badge>
                    ) : (
                      <Badge variant="outline">Disponível</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
