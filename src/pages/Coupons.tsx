import { Header } from '@/components/layout/Header';
import { CouponsManager } from '@/components/admin/CouponsManager';

export default function Coupons() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Cupons de Desconto" />
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <CouponsManager />
      </div>
    </div>
  );
}
