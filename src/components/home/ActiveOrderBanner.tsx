import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, Package2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ActiveOrderBannerProps {
  className?: string;
}

export function ActiveOrderBanner({ className }: ActiveOrderBannerProps) {
  const navigate = useNavigate();
  const [activeOrders, setActiveOrders] = useState<
    { id: string; number: string; status: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const STORAGE_KEY = "activeOrders";

  // Função para recuperar IDs de pedidos do localStorage
  const getStoredOrderIds = (): string[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { id: string; ts: number }[];
        const now = Date.now();
        const filtered = (parsed || []).filter((o) => {
          const hoursSinceCreation = (now - Number(o.ts)) / (1000 * 60 * 60);
          return o?.id && hoursSinceCreation < 24;
        });

        // Persistir versão filtrada
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return filtered.map((o) => o.id);
      }

      // Compatibilidade com versão antiga (um pedido)
      const legacyOrderId = localStorage.getItem("lastOrderId");
      const legacyTimestamp = localStorage.getItem("lastOrderTimestamp");
      if (legacyOrderId && legacyTimestamp) {
        const createdAt = parseInt(legacyTimestamp);
        const now = Date.now();
        const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
        if (hoursSinceCreation < 24) {
          return [legacyOrderId];
        }
      }

      return [];
    } catch (error) {
      console.error("Erro ao recuperar ID do pedido do localStorage:", error);
      return [];
    }
  };

  const saveStoredOrderIds = (orderIds: string[]) => {
    try {
      const now = Date.now();
      const payload = orderIds.map((id) => ({ id, ts: now }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error("Erro ao salvar lista de pedidos no localStorage:", error);
    }
  };

  // Formatação de status para exibição
  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "Recebido",
      confirmed: "Confirmado",
      preparing: "Em preparação",
      ready: "Pronto para entrega/retirada",
      delivering: "Em entrega",
      out_for_delivery: "Em entrega",
      completed: "Entregue",
      delivered: "Entregue",
      canceled: "Cancelado",
      cancelled: "Cancelado",
    };
    return statusMap[status] || status;
  };

  // Verificar se há um pedido ativo
  useEffect(() => {
    const checkForActiveOrder = async () => {
      setIsLoading(true);

      const storedOrderIds = getStoredOrderIds();
      if (!storedOrderIds.length) {
        setActiveOrders([]);
        setIsLoading(false);
        return;
      }

      try {
        // Buscar informações atualizadas dos pedidos no banco de dados
        const { data, error } = await supabase
          .from("orders")
          .select("id, number, status")
          .in("id", storedOrderIds);

        if (error) {
          console.error("Erro ao buscar pedido:", error);
          setIsLoading(false);
          return;
        }

        const rows = (data || []) as { id: string; number: string; status: string }[];

        // Filtrar apenas status ativos
        const isActiveStatus = (status: string) =>
          !["completed", "delivered", "cancelled", "canceled"].includes(status);

        const active = rows.filter((o) => o?.id && o?.number && isActiveStatus(o.status));
        setActiveOrders(active);

        // Limpar do storage os pedidos que já finalizaram/cancelaram
        const activeIds = new Set(active.map((o) => o.id));
        const cleanedIds = storedOrderIds.filter((id) => activeIds.has(id));
        saveStoredOrderIds(cleanedIds);
      } catch (err) {
        console.error("Erro ao processar pedido:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkForActiveOrder();

    // Verificar novamente a cada 2 minutos
    const interval = setInterval(checkForActiveOrder, 120000);

    return () => clearInterval(interval);
  }, []);

  // Realtime: atualizar status quando admin move no kanban
  useEffect(() => {
    if (!activeOrders.length) return;

    const activeIds = new Set(activeOrders.map((o) => o.id));

    const channel = supabase
      .channel("active-orders-tracking")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updated = payload.new as any;
          if (!updated?.id || !activeIds.has(updated.id)) return;

          setActiveOrders((prev) =>
            prev
              .map((o) => (o.id === updated.id ? { ...o, status: updated.status, number: updated.number ?? o.number } : o))
              .filter((o) => !["completed", "delivered", "cancelled"].includes(o.status))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrders.length]);

  // Se não há pedido ativo ou está carregando, não mostrar nada
  if (isLoading || activeOrders.length === 0) {
    return null;
  }

  const countText =
    activeOrders.length === 1
      ? "um pedido"
      : activeOrders.length === 2
      ? "dois pedidos"
      : `${activeOrders.length} pedidos`;

  return (
    <div
      className={`bg-delivery-50 p-4 rounded-lg shadow-sm mb-6 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Package2 className="h-5 w-5 text-delivery-500 mt-1" />
        <div className="flex-1">
          <h3 className="font-medium text-base">
            Você tem {countText} em andamento
          </h3>
          <div className="mt-1 space-y-2">
            {activeOrders.map((o) => (
              <div
                key={o.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <span className="truncate font-medium">#{o.number}</span>
                  <span className="mx-1 flex-shrink-0">•</span>
                  <span className="truncate">Status: {formatStatus(o.status || "")}</span>
                </div>
                <Button
                  size="sm"
                  className="bg-delivery-500 hover:bg-delivery-600 w-full sm:w-auto flex-shrink-0"
                  onClick={() => navigate(`/track-order/${o.id}`)}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Acompanhar
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
