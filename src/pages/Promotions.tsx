import { Header } from '@/components/layout/Header';
import { PromotionsManager } from '@/components/admin/PromotionsManager';

export default function Promotions() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Promoções e Sorteios" />
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <PromotionsManager />
      </div>
    </div>
  );
}
