import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Check,
  ChevronLeft,
  Clock,
  CookingPot,
  Package,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GoogleReviewSettings {
  enabled: boolean;
  url: string;
  message: string;
}

// Tipos de status de pedido
type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivering"
  | "completed"
  | "canceled"
  | "cancelled"
  | "out_for_delivery"
  | "delivered";

// Interface do pedido
interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  created_at: string;
  scheduled_for?: string | null;
  customer_name: string;
  customer_phone: string;
  order_type: "delivery" | "takeaway" | "instore";
  delivery_address?: string | null;
  table_number?: string | null;
  payment_method: string;
  payment_status: string;
  total: number;
  estimated_delivery_time?: string | null;
  notes?: string | null;
}

interface PromotionNumberRow {
  id: string;
  promotion_id: string;
  number: string;
  order_id: string;
  created_at: string;
}

// Interface para os itens do pedido
interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string | null;
  product_name: string;
  product_image_url?: string | null;
  addons?: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    addon: {
      id: string;
      name: string;
      price: number;
    };
  }>;
  configurations?: {
    id: string;
    configurations: Record<string, any>;
    additional_price: number;
  } | null;
}

// Adicionar interface para método de pagamento
interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

// Componente principal de rastreamento
export function OrderTracker() {
  const { orderId } = useParams<{ orderId: string }>();
  const [promotionNumbers, setPromotionNumbers] = useState<PromotionNumberRow[]>([]);

  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);

  const [googleReviewSettings, setGoogleReviewSettings] =
    useState<GoogleReviewSettings>({ enabled: false, url: "", message: "" });
  const [googleReviewModalOpen, setGoogleReviewModalOpen] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copiado!');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const enrichItemsWithExtras = async (items: OrderItem[]) => {
    if (!items || items.length === 0) return items;

    const itemIds = items.map((i) => i.id);

    try {
      const [{ data: addonsRows }, { data: configRows }] = await Promise.all([
        supabase
          .from("order_item_addons")
          .select(
            `*,
             addon:product_addons(*)`
          )
          .in("order_item_id", itemIds),
        (supabase.from("order_item_configurations" as any) as any)
          .select("*")
          .in("order_item_id", itemIds),
      ]);

      const addonsByItemId = new Map<string, any[]>();
      (addonsRows || []).forEach((row: any) => {
        const key = row.order_item_id;
        const arr = addonsByItemId.get(key) || [];
        arr.push(row);
        addonsByItemId.set(key, arr);
      });

      const configByItemId = new Map<string, any>();
      (configRows || []).forEach((row: any) => {
        if (!configByItemId.has(row.order_item_id)) {
          configByItemId.set(row.order_item_id, row);
        }
      });

      return items.map((item) => ({
        ...item,
        addons: item.addons?.length ? item.addons : addonsByItemId.get(item.id) || [],
        configurations: item.configurations ||
          (configByItemId.has(item.id)
            ? {
                id: configByItemId.get(item.id).id,
                configurations: configByItemId.get(item.id).configurations || {},
                additional_price: configByItemId.get(item.id).additional_price || 0,
              }
            : null),
      }));
    } catch {
      return items;
    }
  };

  // Função para formatar o status do pedido em português
  const formatStatus = (status: OrderStatus) => {
    const statusMap: Record<string, string> = {
      pending: "📥 Recebido",
      confirmed: "✅ Confirmado",
      preparing: "👨‍🍳 Em preparação",
      ready: "📦 Pronto para entrega/retirada",
      delivering: "🚚 Em entrega",
      out_for_delivery: "🚚 Em entrega",
      completed: "🎉 Entregue",
      delivered: "🎉 Entregue",
      canceled: "❌ Cancelado",
      cancelled: "❌ Cancelado",
    };
    return statusMap[status] || status;
  };

  // Função para formatar o tipo de pedido em português
  const formatOrderType = (type: string) => {
    const typeMap: Record<string, string> = {
      delivery: "Entrega",
      takeaway: "Retirada",
      instore: "No local",
    };
    return typeMap[type] || type;
  };

  // Função para formatar valores em moeda brasileira
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Função para formatar data e hora
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Adicionar um efeito separado para buscar métodos de pagamento
  useEffect(() => {
    const fetchPaymentMethodsData = async () => {
      setLoadingPaymentMethods(true);
      try {
        console.log("Buscando métodos de pagamento");
        const { data, error } = await supabase
          .from("payment_methods")
          .select("*");

        if (error) {
          console.error("Erro ao buscar métodos de pagamento:", error);
          throw error;
        }

        console.log("Métodos de pagamento encontrados:", data);
        setPaymentMethods(data || []);
      } catch (error) {
        console.error("Erro ao buscar métodos de pagamento:", error);
        // Não definir erro global para não afetar o fluxo principal
      } finally {
        setLoadingPaymentMethods(false);
      }
    };

    fetchPaymentMethodsData();
  }, []);

  useEffect(() => {
    const fetchGoogleReviewSettings = async () => {
      try {
        const { data } = await supabase
          .from("restaurants")
          .select("theme_settings")
          .limit(1)
          .maybeSingle();

        const themeSettings = (data as any)?.theme_settings;
        const enabled = Boolean((themeSettings as any)?.google_review_enabled);
        const url = String((themeSettings as any)?.google_review_url || "").trim();
        const message = String((themeSettings as any)?.google_review_message || "").trim();

        setGoogleReviewSettings({ enabled, url, message });
      } catch {
        // ignore
      }
    };

    fetchGoogleReviewSettings();
  }, []);

  // Função para obter o nome do método de pagamento a partir do ID
  const getPaymentMethodName = (paymentMethodId: string): string => {
    if (!paymentMethodId) return "Não informado";

    // Se os métodos de pagamento ainda não foram carregados, exibir Carregando...
    if (paymentMethods.length === 0) {
      return "Carregando...";
    }

    const method = paymentMethods.find((m) => m.id === paymentMethodId);
    if (method) {
      return method.name;
    }

    // Tentar mapear com base em IDs comuns
    const commonMethods: Record<string, string> = {
      pix: "PIX",
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      cash: "Dinheiro",
      transfer: "Transferência Bancária",
    };

    if (paymentMethodId in commonMethods) {
      return commonMethods[paymentMethodId];
    }

    return "Método desconhecido";
  };

  // Carregar dados do pedido
  useEffect(() => {
    let interval: number | null = null;

    const fetchOrderData = async () => {
      if (!orderId) {
        setError("ID do pedido não fornecido");
        setLoading(false);
        return;
      }

      // Verificar se o orderId tem formato de UUID válido
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(orderId)) {
        setError("ID do pedido inválido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        console.log("🔄 Buscando dados do pedido:", orderId);

        // Buscar dados do pedido
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (orderError) {
          console.error("❌ Erro ao buscar pedido:", orderError);
          throw new Error(orderError.message || "Erro ao buscar pedido");
        }

        // Buscar números de promoção vinculados ao pedido
        try {
          const { data: promoNumbers, error: promoNumbersError } = await (supabase.from(
            "promotion_numbers" as any
          ) as any)
            .select("id, promotion_id, number, order_id, created_at")
            .eq("order_id", orderId)
            .order("created_at", { ascending: true });

          if (!promoNumbersError) {
            setPromotionNumbers((promoNumbers as PromotionNumberRow[]) || []);
          }
        } catch {
          // ignore
        }

        if (!orderData) {
          console.error("❌ Pedido não encontrado");
          throw new Error("Pedido não encontrado");
        }

        console.log("✅ Dados do pedido encontrados:", orderData);
        setOrder(orderData as Order);

        // Buscar itens do pedido com join
        console.log("🔄 Buscando itens do pedido");
        const { data: orderItemsData, error: orderItemsError } = await supabase
          .from("order_items")
          .select(
            `
            *,
            products(name, image_url),
            addons:order_item_addons(
              *,
              addon:product_addons(*)
            ),
            configurations:order_item_configurations(*)
          `
          )
          .eq("order_id", orderId);

        if (orderItemsError) {
          console.error("❌ Erro ao buscar itens do pedido:", orderItemsError);
          throw new Error(
            orderItemsError.message || "Erro ao buscar itens do pedido"
          );
        }

        console.log("✅ Itens do pedido encontrados:", orderItemsData);

        // Transformar os dados obtidos no formato esperado para orderItems
        if (orderItemsData) {
          const formattedItems: OrderItem[] = orderItemsData.map((item) => ({
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            notes: item.notes,
            product_name: item.products?.name || "Produto indisponível",
            product_image_url: item.products?.image_url || null,
            addons: item.addons || [],
            configurations:
              Array.isArray(item.configurations) && item.configurations.length > 0
                ? {
                    id: item.configurations[0].id,
                    configurations: item.configurations[0].configurations || {},
                    additional_price: item.configurations[0].additional_price || 0,
                  }
                : null,
          }));

          const enriched = await enrichItemsWithExtras(formattedItems);
          setOrderItems(enriched);
        }
      } catch (error: unknown) {
        console.error("❌ Erro ao carregar dados do pedido:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erro ao carregar dados do pedido";
        setError(errorMessage);
        toast.error("Erro ao carregar dados do pedido");
      } finally {
        setLoading(false);
      }
    };

    // Executar a busca inicial
    fetchOrderData();

    // Configurar subscription em tempo real para mudanças no pedido
    let orderSubscription: any;
    let itemsSubscription: any;
    
    const setupRealtimeSubscription = async () => {
      if (!orderId) return;

      try {
        // Subscrever a mudanças na tabela de orders (status, valores, etc)
        orderSubscription = supabase
          .channel(`orders-${orderId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `id=eq.${orderId}`,
            },
            (payload) => {
              console.log('📡 Mudança no pedido detectada em tempo real:', payload);
              // Atualizar o estado do pedido com os novos dados
              if (payload.new) {
                const newOrder = payload.new as Order;
                setOrder(newOrder);
                
                // Notificar usuário about status change
                if (payload.old && payload.old.status !== newOrder.status) {
                  const statusMessages: Record<string, string> = {
                    'pending': '⏳ Seu pedido foi recebido',
                    'confirmed': '✅ Pedido confirmado',
                    'preparing': '👨‍🍳 Seu pedido está sendo preparado',
                    'ready': '📦 Seu pedido está pronto para busca/entrega',
                    'out_for_delivery': '🚗 Seu pedido está em entrega',
                    'delivering': '🚗 Seu pedido está em entrega',
                    'delivered': '✨ Seu pedido foi entregue',
                    'completed': '✨ Pedido concluído',
                    'canceled': '❌ Pedido cancelado',
                    'cancelled': '❌ Pedido cancelado',
                  };
                  
                  const message = statusMessages[newOrder.status] || 'Seu pedido foi atualizado';
                  toast.success(message);
                }
              }
            }
          )
          .subscribe();

        // Subscrever a mudanças nos itens do pedido (opcionalmente)
        itemsSubscription = supabase
          .channel(`order-items-${orderId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'order_items',
              filter: `order_id=eq.${orderId}`,
            },
            (payload) => {
              console.log('📡 Mudança nos itens do pedido detectada:', payload);
              // Recarregar itens do pedido se houver mudanças
              fetchOrderData();
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Erro ao configurar subscription em tempo real:', error);
      }
    };

    setupRealtimeSubscription();

    // Retorno com limpeza
    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
      // Unsubscribe do realtime quando component desmontar ou orderId mudar
      if (orderSubscription) {
        orderSubscription.unsubscribe();
      }
      if (itemsSubscription) {
        itemsSubscription.unsubscribe();
      }
    };
  }, [orderId]);

  useEffect(() => {
    if (!order?.id) return;

    const isDelivered = order.status === "delivered" || order.status === "completed";
    if (!isDelivered) return;

    if (!googleReviewSettings.enabled) return;
    if (!googleReviewSettings.url) return;

    const storageKey = `googleReviewPromptShown:${order.id}`;
    try {
      const alreadyShown = window.localStorage.getItem(storageKey) === "1";
      if (alreadyShown) return;

      window.localStorage.setItem(storageKey, "1");
    } catch {
      // ignore
    }

    setGoogleReviewModalOpen(true);
  }, [order?.id, order?.status, googleReviewSettings.enabled, googleReviewSettings.url]);

  const handleGoogleReviewClick = async () => {
    try {
      if (!order?.id) return;
      if (!googleReviewSettings.url) return;

      try {
        await supabase.from("google_review_clicks" as any).insert({
          order_id: order.id,
          review_url: googleReviewSettings.url,
          user_agent: navigator.userAgent,
        });
      } catch {
        // ignore
      }

      window.open(googleReviewSettings.url, "_blank", "noopener,noreferrer");
    } finally {
      setGoogleReviewModalOpen(false);
    }
  };

  // Subscrição em tempo real para atualizações da nota do pedido
  useEffect(() => {
    if (!orderId) return;

    console.log("🔄 Configurando subscrição de tempo real para pedido:", orderId);

    const subscription = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log("📢 Pedido atualizado em tempo real:", payload.new);
          setOrder((prevOrder) => ({
            ...prevOrder,
            ...(payload.new as any),
          }));
        }
      )
      .subscribe((status) => {
        console.log("🔄 Status da subscrição:", status);
      });

    return () => {
      console.log("🔄 Limpando subscrição de tempo real");
      subscription.unsubscribe();
    };
  }, [orderId]);

  // Configurar subscriptions real-time para atualizações de status do pedido
  useEffect(() => {
    if (!orderId) {
      console.log('⚠️ orderId não definido');
      return;
    }

    console.log('🔄 Configurando subscription de tempo real para pedido:', orderId);

    const subscription = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          const updatedOrder = payload.new as any;
          console.log('📢 📢 📢 STATUS DO PEDIDO ATUALIZADO:', {
            id: updatedOrder.id,
            statusAntigo: order?.status,
            statusNovo: updatedOrder.status,
            timestamp: new Date().toISOString()
          });
          
          setOrder(updatedOrder as Order);
          
          if (updatedOrder.status === "delivered" || updatedOrder.status === "completed") {
            console.log('✅ Pedido entregue/completado!');
            toast.success("Pedido entregue com sucesso!");
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_items", filter: `order_id=eq.${orderId}` },
        (payload) => {
          console.log('📢 Novo item adicionado ao pedido:', payload.new);
          // Recarregar itens
          const fetchUpdatedItems = async () => {
            const { data: orderItemsData } = await supabase
              .from("order_items")
              .select(
                `*,
                 products(name, image_url),
                 addons:order_item_addons(*, addon:product_addons(*)),
                 configurations:order_item_configurations(*)`
              )
              .eq("order_id", orderId);

            if (orderItemsData) {
              const formattedItems: OrderItem[] = orderItemsData.map((item) => ({
                id: item.id,
                order_id: item.order_id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                notes: item.notes,
                product_name: item.products?.name || "Produto indisponível",
                product_image_url: item.products?.image_url || null,
                addons: item.addons || [],
                configurations:
                  Array.isArray(item.configurations) && item.configurations.length > 0
                    ? {
                        id: item.configurations[0].id,
                        configurations: item.configurations[0].configurations || {},
                        additional_price: item.configurations[0].additional_price || 0,
                      }
                    : null,
              }));
              const enriched = await enrichItemsWithExtras(formattedItems);
              setOrderItems(enriched);
            }
          };
          fetchUpdatedItems();
        }
      )
      .subscribe((status) => {
        console.log('🔄 Status da subscription do pedido:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed com sucesso! Aguardando updates...');
        }
      });

    return () => {
      console.log('🔌 Limpando subscription do pedido:', orderId);
      subscription.unsubscribe();
    };
  }, [orderId]);

  // Determinar o progresso atual do pedido
  const getOrderProgress = () => {
    if (!order) return 0;

    const statusOrder: OrderStatus[] = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "out_for_delivery",
      "delivered",
    ];

    // Encontrar o índice do status atual
    let currentIndex = statusOrder.indexOf(order.status);

    // Se o status não for encontrado ou for cancelado, retornar 0
    if (currentIndex === -1 || order.status === "cancelled") {
      console.log('⚠️ Status não mapeado ou cancelado:', order.status);
      return 0;
    }

    // Calcular o progresso em percentual (0-100)
    const maxSteps = statusOrder.length;
    const progress = Math.min(100, Math.round(((currentIndex + 1) / maxSteps) * 100));
    console.log('📊 Progresso do pedido:', { status: order.status, index: currentIndex, progress });
    return progress;
  };

  // Função para determinar a cor de fundo do status
  const getStatusBackgroundColor = (status: OrderStatus) => {
    // Status concluídos com sucesso em verde
    if (status === "completed" || status === "delivered") {
      return "bg-green-50";
    }

    // Status de cancelado em vermelho claro
    if (status === "cancelled") {
      return "bg-red-50";
    }

    // Outros status em rosa claro (padrão)
    return "bg-delivery-50";
  };

  // Função para determinar a cor do texto do status
  const getStatusTextColor = (status: OrderStatus) => {
    // Status concluídos com sucesso em verde
    if (status === "completed" || status === "delivered") {
      return "text-green-600";
    }

    // Status de cancelado em vermelho
    if (status === "cancelled") {
      return "text-red-600";
    }

    // Outros status em preto (padrão)
    return "text-delivery-700";
  };

  // Se estiver carregando, mostrar um indicador de carregamento
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-delivery-500"></div>
      </div>
    );
  }

  // Se ocorrer um erro, mostrar mensagem de erro
  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Erro ao carregar pedido</h2>
        <p className="text-muted-foreground mb-6">
          {error || "Pedido não encontrado"}
        </p>
        <Button onClick={() => navigate("/")}>Voltar para o início</Button>
      </div>
    );
  }

  // Ícones para os diferentes status
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="h-6 w-6" />;
      case "confirmed":
        return <Check className="h-6 w-6" />;
      case "preparing":
        return <CookingPot className="h-6 w-6" />;
      case "ready":
        return <ShoppingBag className="h-6 w-6" />;
      case "delivering":
        return <Truck className="h-6 w-6" />;
      case "out_for_delivery":
        return <Truck className="h-6 w-6" />;
      case "completed":
        return <Check className="h-6 w-6" />;
      case "delivered":
        return <Check className="h-6 w-6" />;
      case "cancelled":
        return <Package className="h-6 w-6" />;
      default:
        return <Clock className="h-6 w-6" />;
    }
  };

  // No componente de renderização, lidar com métodos de pagamento comuns diretamente
  const mapPaymentMethodToName = (paymentMethodId: string): string => {
    if (loadingPaymentMethods) {
      return "Carregando...";
    }

    // Verificar se temos o método nos dados carregados do banco
    const method = paymentMethods.find((m) => m.id === paymentMethodId);
    if (method) return method.name;

    // Mapeamento para métodos de pagamento comuns
    const commonMethods: Record<string, string> = {
      pix: "PIX",
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      cash: "Dinheiro",
      transfer: "Transferência Bancária",
    };

    // Verificar se é um dos métodos comuns
    return commonMethods[paymentMethodId] || paymentMethodId;
  };

  // Renderizar o componente de rastreamento
  return (
    <div className="max-w-2xl mx-auto p-4">
      <Dialog open={googleReviewModalOpen} onOpenChange={setGoogleReviewModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="p-6">
            <DialogHeader className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xl">Avalie no Google</DialogTitle>
                  <DialogDescription className="mt-1 text-sm leading-relaxed">
                    {googleReviewSettings.message &&
                    googleReviewSettings.message.trim() !== ""
                      ? googleReviewSettings.message
                      : "Seu pedido foi entregue. Você pode avaliar nossa empresa no Google."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6">
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setGoogleReviewModalOpen(false)}
                type="button"
              >
                Agora não
              </Button>
              <Button onClick={handleGoogleReviewClick} type="button" className="gap-2">
                <Star className="h-4 w-4" />
                Avaliar agora
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4 pl-0"
          onClick={() => navigate("/")}
        >
          <ChevronLeft className="mr-2 h-5 w-5" /> Voltar para o menu
        </Button>
        <h1 className="text-2xl font-bold">Acompanhar Pedido</h1>
        <p className="text-muted-foreground">
          Pedido #{order.number} • {formatDateTime(order.created_at)}
        </p>
        {order.scheduled_for && (
          <p className="text-muted-foreground">
            Agendado: {formatDateTime(order.scheduled_for)}
          </p>
        )}
      </div>

      {promotionNumbers.length > 0 && (
        <div className="mb-6 border rounded-lg bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-bold">Seu(s) número(s) do sorteio</div>
              <div className="text-xs text-muted-foreground">
                Copie e guarde para acompanhar a promoção
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(promotionNumbers.map((n) => n.number).join(', '))}
            >
              Copiar todos
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {promotionNumbers.map((n) => (
              <button
                key={n.id}
                className="px-3 py-2 rounded border font-mono font-bold text-sm hover:bg-gray-50"
                onClick={() => handleCopy(n.number)}
                type="button"
              >
                {n.number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status atual - Aplicar cores dinâmicas */}
      <div
        className={`p-4 rounded-lg mb-6 ${getStatusBackgroundColor(
          order.status
        )}`}
      >
        <div className="flex items-center gap-3">
          <div className={getStatusTextColor(order.status)}>
            {getStatusIcon(order.status)}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status atual</p>
            <h2
              className={`text-xl font-semibold ${getStatusTextColor(
                order.status
              )}`}
            >
              {formatStatus(order.status)}
            </h2>
          </div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mb-8">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-delivery-500 h-2.5 rounded-full"
            style={{ width: `${getOrderProgress()}%` }}
          ></div>
        </div>
        <div className="mt-6 grid grid-cols-5 gap-2">
          {/* Etapas do pedido */}
          <StatusStep
            title="Recebido"
            isActive={[
              "pending",
              "preparing",
              "ready",
              "delivering",
              "out_for_delivery",
              "completed",
              "delivered",
            ].includes(order.status)}
            icon={
              <Clock
                className={`h-5 w-5 ${
                  [
                    "pending",
                    "preparing",
                    "ready",
                    "delivering",
                    "out_for_delivery",
                    "completed",
                    "delivered",
                  ].includes(order.status)
                    ? "text-delivery-500"
                    : "text-gray-400"
                }`}
              />
            }
          />
          <StatusStep
            title="Preparando"
            isActive={[
              "preparing",
              "ready",
              "delivering",
              "out_for_delivery",
              "completed",
              "delivered",
            ].includes(order.status)}
            icon={
              <CookingPot
                className={`h-5 w-5 ${
                  [
                    "preparing",
                    "ready",
                    "delivering",
                    "out_for_delivery",
                    "completed",
                    "delivered",
                  ].includes(order.status)
                    ? "text-delivery-500"
                    : "text-gray-400"
                }`}
              />
            }
          />
          <StatusStep
            title="Pronto"
            isActive={[
              "ready",
              "delivering",
              "out_for_delivery",
              "completed",
              "delivered",
            ].includes(order.status)}
            icon={
              <ShoppingBag
                className={`h-5 w-5 ${
                  [
                    "ready",
                    "delivering",
                    "out_for_delivery",
                    "completed",
                    "delivered",
                  ].includes(order.status)
                    ? "text-delivery-500"
                    : "text-gray-400"
                }`}
              />
            }
          />
          <StatusStep
            title={
              order.order_type === "delivery"
                ? "Em entrega"
                : "Aguardando retirada"
            }
            isActive={[
              "delivering",
              "out_for_delivery",
              "completed",
              "delivered",
            ].includes(order.status)}
            icon={
              order.order_type === "delivery" ? (
                <Truck
                  className={`h-5 w-5 ${
                    [
                      "delivering",
                      "out_for_delivery",
                      "completed",
                      "delivered",
                    ].includes(order.status)
                      ? "text-delivery-500"
                      : "text-gray-400"
                  }`}
                />
              ) : (
                <ShoppingBag
                  className={`h-5 w-5 ${
                    [
                      "delivering",
                      "out_for_delivery",
                      "completed",
                      "delivered",
                    ].includes(order.status)
                      ? "text-delivery-500"
                      : "text-gray-400"
                  }`}
                />
              )
            }
          />
          <StatusStep
            title={
              order.order_type === "delivery"
                ? "Entregue"
                : order.order_type === "takeaway"
                ? "Retirado"
                : "Servido"
            }
            isActive={["completed", "delivered"].includes(order.status)}
            icon={
              <Check
                className={`h-5 w-5 ${
                  ["completed", "delivered"].includes(order.status)
                    ? "text-delivery-500"
                    : "text-gray-400"
                }`}
              />
            }
          />
        </div>
      </div>

      {/* Detalhes do pedido */}
      <div className="border rounded-lg mb-6">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Detalhes do pedido</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tipo de pedido</span>
            <span>{formatOrderType(order.order_type)}</span>
          </div>

          {order.order_type === "delivery" && order.delivery_address && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Endereço de entrega</span>
              <span className="text-right">{order.delivery_address}</span>
            </div>
          )}

          {order.order_type === "instore" && order.table_number && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Número da mesa</span>
              <span>{order.table_number}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">Forma de pagamento</span>
            <span>{mapPaymentMethodToName(order.payment_method)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Status do pagamento</span>
            <span>{order.payment_status === "paid" ? "Pago" : "Pendente"}</span>
          </div>

          {order.notes && order.notes.trim() !== "" && (
            <div className="border-t pt-3">
              <span className="text-muted-foreground block mb-2">📝 Nota do pedido</span>
              <p className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900">
                {order.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Itens do pedido */}
      <div className="border rounded-lg mb-6">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Itens do pedido</h3>
        </div>
        <div className="divide-y">
          {orderItems.map((item) => (
            <div key={item.id} className="p-4 flex items-center gap-3">
              {item.product_image_url ? (
                <div className="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={item.product_image_url}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center text-gray-500">
                  <Package className="h-6 w-6" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qtd: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const discountMatch = (item.notes || "").match(
                        /\bCupom-produto-desconto:\s*([0-9]+(?:\.[0-9]+)?)\b/i
                      );
                      const discount = discountMatch ? Number(discountMatch[1]) : 0;
                      const totalAfterDiscount = Math.max(0, item.total_price - discount);

                      return (
                        <>
                          <p className="font-medium">
                            {formatCurrency(item.total_price)}
                            {discount > 0 && (
                              <span className="text-xs text-green-600 font-medium ml-2">
                                (-{formatCurrency(discount)})
                              </span>
                            )}
                          </p>
                          {discount > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Total: {formatCurrency(totalAfterDiscount)}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Adicionais e Configurações abaixo do valor total */}
                <div className="mt-2 space-y-1">
                  {item.addons && item.addons.length > 0 && (
                    <div className="space-y-0.5">
                      {item.addons.map((addon) => (
                        <div
                          key={addon.id}
                          className="text-xs text-muted-foreground flex justify-between"
                        >
                          <span>+ {addon.quantity}x {addon.addon.name}</span>
                          <span>{formatCurrency(addon.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.configurations && (
                    <div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <div>
                          {Object.entries(item.configurations.configurations || {})
                            .map(([key, value]) => {
                              if (typeof value === "object" && value && "label" in value) {
                                return `${(value as any).label}`;
                              }
                              // Se for array de objetos (checkbox múltiplo)
                              if (Array.isArray(value)) {
                                return value.map(v => 
                                  typeof v === "object" && v && "label" in v 
                                    ? (v as any).label 
                                    : String(v)
                                ).join(", ");
                              }
                              return String(value);
                            })
                            .join(", ")}
                        </div>
                        {item.configurations.additional_price > 0 && (
                          <div>
                            {formatCurrency(item.configurations.additional_price)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      Obs: {item.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total do pedido */}
      <div className="border rounded-lg">
        <div className="p-4">
          {order.order_type === "delivery" && (
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Taxa de entrega</span>
              <span>{formatCurrency((order as any).delivery_fee || 0)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para cada etapa do rastreamento
interface StatusStepProps {
  title: string;
  isActive: boolean;
  icon: React.ReactNode;
}

function StatusStep({ title, isActive, icon }: StatusStepProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
          isActive ? "bg-delivery-100" : "bg-gray-100"
        }`}
      >
        {icon}
      </div>
      <span
        className={`text-xs text-center ${
          isActive ? "text-delivery-700 font-medium" : "text-gray-500"
        }`}
      >
        {title}
      </span>
    </div>
  );
}
