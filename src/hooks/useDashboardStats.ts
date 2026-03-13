
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export function useDashboardStats() {
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);
  const fourteenDaysAgo = subDays(today, 14);

  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Get orders from last 7 days (últimos 7 dias)
      const { data: currentOrders, error: currentError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .lt('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (currentError) throw currentError;

      // Get orders from previous 7 days for comparison (7 a 14 dias atrás)
      const { data: previousOrders, error: previousError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', fourteenDaysAgo.toISOString())
        .lt('created_at', sevenDaysAgo.toISOString());

      if (previousError) throw previousError;

      // Calculate current period stats
      const totalOrders = currentOrders?.length || 0;
      const deliveredOrders = currentOrders?.filter(order => order.status === 'delivered').length || 0;
      const totalRevenue = currentOrders?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;
      const averageTicket = totalOrders ? totalRevenue / totalOrders : 0;

      // Calculate previous period stats for trend comparison
      const previousTotalOrders = previousOrders?.length || 0;
      const previousDeliveredOrders = previousOrders?.filter(order => order.status === 'delivered').length || 0;
      const previousTotalRevenue = previousOrders?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;
      const previousAverageTicket = previousTotalOrders ? previousTotalRevenue / previousTotalOrders : 0;

      // Calculate trends (percentage change) - Versão corrigida
      const calculateTrend = (current: number, previous: number): number => {
        // Se ambos são 0, não há mudança
        if (previous === 0 && current === 0) {
          return 0;
        }
        
        // Se anterior era 0 e atual é > 0, é crescimento infinito, retorna +100%
        if (previous === 0 && current > 0) {
          return 100;
        }
        
        // Se anterior era > 0 e atual é 0, é queda de 100%
        if (previous > 0 && current === 0) {
          return -100;
        }
        
        // Cálculo normal da percentagem
        return ((current - previous) / previous) * 100;
      };

      return {
        totalOrders: {
          value: totalOrders,
          trend: calculateTrend(totalOrders, previousTotalOrders)
        },
        deliveredOrders: {
          value: deliveredOrders,
          trend: calculateTrend(deliveredOrders, previousDeliveredOrders)
        },
        totalRevenue: {
          value: totalRevenue,
          trend: calculateTrend(totalRevenue, previousTotalRevenue)
        },
        averageTicket: {
          value: averageTicket,
          trend: calculateTrend(averageTicket, previousAverageTicket)
        }
      };
    }
  });
}
