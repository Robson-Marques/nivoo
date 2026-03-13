import { usePromotionNumbers } from '@/hooks/useCouponsPromotions';
import { Badge } from '@/components/ui/badge';
import { Trophy, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PromotionNumberDisplayProps {
  promotionId: string;
  orderId: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PromotionNumberDisplay({
  promotionId,
  orderId,
  size = 'md',
}: PromotionNumberDisplayProps) {
  const { data: numbers } = usePromotionNumbers(promotionId);

  const promotionNumber = numbers?.find((n) => n.order_id === orderId);

  if (!promotionNumber) {
    return null;
  }

  if (size === 'sm') {
    return (
      <Badge className="bg-purple-600 gap-1">
        <Trophy className="w-3 h-3" />
        Número: {promotionNumber.number}
      </Badge>
    );
  }

  if (size === 'lg') {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-5 h-5 text-purple-600" />
          <span className="font-bold text-purple-600">Número da Sorte</span>
        </div>

        <div className="bg-white rounded-lg p-4 mb-3">
          <div className="text-4xl font-bold font-mono text-purple-600">
            {promotionNumber.number}
          </div>
        </div>

        {promotionNumber.is_winner && (
          <Alert className="bg-green-50 border-green-200 mb-3">
            <Trophy className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              🎉 Parabéns! Você é ganhador da {promotionNumber.prize_position}ª posição!
            </AlertDescription>
          </Alert>
        )}

        {!promotionNumber.is_winner && (
          <div className="text-sm text-gray-600 mb-3">
            Aguardando o sorteio... Boa sorte!
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>Guarde bem este número!</p>
          <p>O sorteio acontecerá em breve.</p>
        </div>
      </div>
    );
  }

  // Tamanho padrão (md)
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-600">Número da Promoção</p>
          <p className="text-3xl font-bold font-mono text-purple-600">
            {promotionNumber.number}
          </p>
        </div>

        <div className="text-right">
          {promotionNumber.is_winner ? (
            <Badge className="bg-green-600 text-lg px-3 py-1">
              <Trophy className="w-4 h-4 mr-1" />
              Ganhador
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-600">
              Sorteio Pendente
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
