import React, { useState, useEffect } from "react";
import { Product, ProductAddon } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
  ArrowLeft,
  MapPin,
  Package2,
  AlignJustify,
  Phone,
  User,
  CreditCard,
  Banknote,
  QrCode,
  Landmark,
  Wallet,
  Check,
  Share2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { CheckoutDialog } from "../checkout/CheckoutDialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckoutForm } from "../checkout/CheckoutForm";
import { NeighborhoodSelector } from "../checkout/NeighborhoodSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Icon, IconName } from "@/components/ui/icon";
import { CouponInput } from "@/components/checkout/CouponInput";
import { Coupon } from "@/types/coupon";
import {
  createPromotionNumberRecord,
  getActivePromotionsForOrder,
} from "@/services/promotionNumberService";
import { useQueryClient } from "@tanstack/react-query";
import { OrderConfirmation } from "../checkout/OrderConfirmation";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useZeroPriceLogic } from "@/hooks/useZeroPriceLogic";

interface CartItem {
  product: Product;
  quantity: number;
  selectedAddons?: ProductAddon[];
  selectedConfigurations?: Record<string, any>;
  configurationPrice?: number;
  notes?: string;
  productCouponCode?: string;
  productCouponDiscountTotal?: number;
}

interface FloatingCartProps {
  cartItems: CartItem[];
  onAddItem: (
    product: Product,
    quantity?: number,
    selectedAddons?: ProductAddon[],
    notes?: string,
    selectedConfigurations?: Record<string, any>,
    configurationPrice?: number
  ) => void;
  onRemoveItem: (productId: string, itemIndex: number) => void;
  totalItems: number;
  totalPrice: number;
  onOpenChange?: (isOpen: boolean) => void;
}

type OrderType = "delivery" | "takeaway" | "instore";

interface CheckoutFormData {
  orderType: OrderType;
  name: string;
  phone: string;
  // Delivery fields
  zipCode?: string;
  streetName?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  // In-store fields
  tableNumber?: string;
  // Coupon
  coupon?: string;
  // Payment method
  paymentMethodId?: string;
}

// Schema de validação para o formulário
const formSchema = z.object({
  orderType: z.enum(["delivery", "takeaway", "instore"]),
  // Dados do cliente
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  phone: z.string().min(10, "Telefone inválido"),
  // Campos para delivery
  zipCode: z.string().optional(),
  streetName: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  // Campos para instore
  tableNumber: z.string().optional(),
  // Método de pagamento
  paymentMethodId: z.string().min(1, "Selecione um método de pagamento"),
  // Observações
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Tipos de métodos de pagamento do banco de dados
interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

// Adicionar novo tipo para as etapas do carrinho
type CartStep = "cart" | "order-type" | "checkout" | "confirmation";

// Adicionar interface para dados do restaurante
interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  open_time: string;
  close_time: string;
  delivery_fee: number;
  min_order_value: number;
  require_neighborhood_selection?: boolean;
  max_scheduled_per_slot?: number;
}

// Interface para horários de funcionamento
interface BusinessHour {
  id: string;
  day_of_week: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

// Formatar número de telefone para exibição
const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return "";

  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, "");

  // Formata o número para exibição (assumindo padrão BR)
  if (numbers.length === 11) {
    return `(${numbers.substring(0, 2)}) ${numbers.substring(
      2,
      7
    )}-${numbers.substring(7)}`;
  } else if (numbers.length === 10) {
    return `(${numbers.substring(0, 2)}) ${numbers.substring(
      2,
      6
    )}-${numbers.substring(6)}`;
  }

  return phone; // Retorna original se não conseguir formatar
};

// Formatar número para WhatsApp (apenas números com código do país)
const formatWhatsAppNumber = (phone: string | undefined): string => {
  if (!phone || phone.trim() === "") {
    toast.error("Número de telefone do estabelecimento não disponível");
    throw new Error("Número de telefone do estabelecimento não disponível");
  }

  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, "");

  // Verifica se o número é válido
  if (numbers.length < 8) {
    toast.error("Número de telefone do estabelecimento inválido");
    throw new Error("Número de telefone do estabelecimento inválido");
  }

  // Adiciona código do país se não tiver
  if (!numbers.startsWith("55")) {
    return `55${numbers}`;
  }

  return numbers;
};

const encodeWhatsAppText = (text: string) => {
  // Garante encoding UTF-8 correto (incluindo emojis) antes de montar a URL.
  // encodeURIComponent em alguns ambientes pode resultar em caracteres substitutos (�).
  const bytes = new TextEncoder().encode(text);
  let out = "";
  for (const b of bytes) {
    out += `%${b.toString(16).padStart(2, "0").toUpperCase()}`;
  }
  return out;
};

const openWhatsAppMessage = (phoneE164: string, message: string) => {
  const encoded = encodeWhatsAppText(message);
  window.open(
    `https://api.whatsapp.com/send?phone=${phoneE164}&text=${encoded}`,
    "_blank"
  );
};

// Nova função para formatar telefone durante a digitação
const formatPhoneInput = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, "");

  if (numbers.length <= 2) {
    return numbers;
  }

  if (numbers.length <= 7) {
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2)}`;
  }

  return `(${numbers.substring(0, 2)}) ${numbers.substring(
    2,
    7
  )}-${numbers.substring(7, 11)}`;
};

// Nova função para preparar telefone ao enviar (adicionar 55 e remover formatação)
const preparePhoneForSubmission = (phone: string): string => {
  const numbers = phone.replace(/\D/g, "");

  // Se já começar com 55, retorna como está
  if (numbers.startsWith("55") && numbers.length >= 12) {
    return numbers;
  }

  // Adiciona 55 se não tiver
  return `55${numbers}`;
};

// Função para salvar o ID do pedido no localStorage
const saveOrderIdToLocalStorage = (orderId: string) => {
  try {
    localStorage.setItem("lastOrderId", orderId);
    localStorage.setItem("lastOrderTimestamp", Date.now().toString());

    const storageKey = "activeOrders";
    const now = Date.now();
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as { id: string; ts: number }[]) : [];
    const withoutDup = (parsed || []).filter((o) => o?.id && o.id !== orderId);
    const updated = [{ id: orderId, ts: now }, ...withoutDup];
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (error) {
    console.error("Erro ao salvar ID do pedido no localStorage:", error);
  }
};

// Função para recuperar o ID do pedido do localStorage
const getStoredOrderId = (): string | null => {
  try {
    const orderId = localStorage.getItem("lastOrderId");
    const timestamp = localStorage.getItem("lastOrderTimestamp");

    // Verificar se o pedido foi criado nas últimas 24 horas
    if (orderId && timestamp) {
      const createdAt = parseInt(timestamp);
      const now = Date.now();
      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

      // Retornar apenas se o pedido foi criado há menos de 24 horas
      if (hoursSinceCreation < 24) {
        return orderId;
      }
    }

    return null;
  } catch (error) {
    console.error("Erro ao recuperar ID do pedido do localStorage:", error);
    return null;
  }
};

export function FloatingCart({
  cartItems,
  onAddItem,
  onRemoveItem,
  totalItems,
  totalPrice,
  onOpenChange,
}: FloatingCartProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [isAnimating, setIsAnimating] = useState(false);
  const [cartStep, setCartStep] = useState<CartStep>("cart");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderTime, setOrderTime] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);
  const scrollPositionRef = React.useRef(0);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [isLoadingBusinessHours, setIsLoadingBusinessHours] = useState(false);
  const queryClient = useQueryClient();
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);
  const [orderSubtotal, setOrderSubtotal] = useState(0);
  const [orderData, setOrderData] = useState<FormValues | null>(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const navigate = useNavigate();
  const [orderCreatedId, setOrderCreatedId] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("");
  const [selectedNeighborhoodFee, setSelectedNeighborhoodFee] = useState<number>(0);
  const [neighborhoodStatus, setNeighborhoodStatus] = useState<{
    neighborhoodText: string;
    isValid: boolean;
  }>({ neighborhoodText: "", isValid: false });
  const [isNeighborhoodRequiredDialogOpen, setIsNeighborhoodRequiredDialogOpen] =
    useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [availableScheduleSlots, setAvailableScheduleSlots] = useState<Date[]>([]);
  const [selectedScheduleIso, setSelectedScheduleIso] = useState<string>("");
  const [pendingScheduleData, setPendingScheduleData] = useState<FormValues | null>(
    null
  );
  const { isZeroPriceProduct } = useZeroPriceLogic();

  // Efeito para controlar o scroll da página quando o carrinho está aberto
  useEffect(() => {
    if (isOpen) {
      // Guardar posição do scroll
      scrollPositionRef.current = window.scrollY;
      // Desabilitar scroll quando o carrinho está aberto
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      // Habilitar scroll quando o carrinho está fechado
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      // Restaurar posição do scroll após 50ms
      if (scrollPositionRef.current > 0) {
        setTimeout(() => {
          window.scrollTo(0, scrollPositionRef.current);
          scrollPositionRef.current = 0;
        }, 50);
      }
    }

    // Cleanup
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Valor padrão para taxa de entrega, será substituído pelos dados do restaurante quando carregados
  // Se houver um bairro selecionado, usar a taxa do bairro, caso contrário usar a taxa padrão
  const deliveryFee = selectedNeighborhoodFee > 0 ? selectedNeighborhoodFee : (restaurant?.delivery_fee ?? null);
  // A taxa de entrega só deve ser aplicada quando tivermos um tipo de pedido definido como delivery
  // No carrinho inicial, não devemos mostrar nem aplicar a taxa
  const finalTotal =
    cartStep === "cart"
      ? totalPrice
      : totalPrice +
        (totalItems > 0 && orderType === "delivery" && deliveryFee !== null && deliveryFee !== undefined ? deliveryFee : 0);

  const clampToTwoDecimals = (value: number) => Math.round(value * 100) / 100;

  const calculateCouponDiscount = (coupon: Coupon, baseAmount: number) => {
    if (baseAmount <= 0) return 0;
    const rawDiscount =
      coupon.discount_type === "fixed"
        ? coupon.discount_amount
        : (baseAmount * coupon.discount_percentage) / 100;
    const discount = Math.max(0, Math.min(rawDiscount, baseAmount));
    return clampToTwoDecimals(discount);
  };

  const calculateCouponBaseAmount = (coupon: Coupon) => {
    // Cupom de compra: aplica no subtotal do pedido (itens)
    if (coupon.coupon_type === "purchase") {
      return totalPrice;
    }

    // Cupom de produto: aplica apenas nos produtos configurados
    if (coupon.apply_to_all_products) {
      return totalPrice;
    }

    const applicableSet = new Set((coupon.applicable_products || []).map(String));

    const applicableSubtotal = cartItems.reduce((sum, item) => {
      if (!applicableSet.has(String(item.product.id))) return sum;

      const basePrice = item.product.price;
      const addonsTotalPrice = (item.selectedAddons || []).reduce(
        (s, addon) => s + addon.price * (addon.quantity || 1),
        0
      );
      const configurationTotalPrice = item.configurationPrice || 0;

      const unitPriceWithAddons = basePrice + addonsTotalPrice + configurationTotalPrice;
      const totalItemPrice = unitPriceWithAddons * item.quantity;

      return sum + totalItemPrice;
    }, 0);

    return applicableSubtotal;
  };

  const deliveryFeeToApply =
    cartStep === "cart"
      ? 0
      : totalItems > 0 && orderType === "delivery" && deliveryFee !== null && deliveryFee !== undefined
        ? deliveryFee
        : 0;

  // Cupom do checkout: só pode ser purchase ou product apply_to_all_products (ver CouponInput mode="checkout")
  const checkoutCouponDiscountForDisplay = appliedCoupon
    ? calculateCouponDiscount(appliedCoupon, calculateCouponBaseAmount(appliedCoupon))
    : 0;

  // Observação:
  // Os cupons de produto são aplicados no modal do produto e o carrinho já carrega o total líquido.
  // Aqui no checkout exibimos/aplicamos apenas o cupom de compra (ou apply_to_all_products).
  const couponDiscountForDisplay = clampToTwoDecimals(checkoutCouponDiscountForDisplay);

  const totalBeforeDiscountForDisplay = clampToTwoDecimals(totalPrice + deliveryFeeToApply);
  const totalAfterDiscountForDisplay = clampToTwoDecimals(
    Math.max(0, totalBeforeDiscountForDisplay - couponDiscountForDisplay)
  );

  // Inicializar o formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderType: "delivery",
      name: "",
      phone: "",
      zipCode: "",
      streetName: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      tableNumber: "",
      paymentMethodId: "",
      notes: "",
    },
  });

  // Efeito para carregar métodos de pagamento
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setIsLoadingPaymentMethods(true);
      try {
        const { data, error } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("enabled", true)
          .order("display_order");

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setPaymentMethods(data);
          // Definir o primeiro método como padrão
          form.setValue("paymentMethodId", data[0].id);
        }
      } catch (error) {
        console.error("Erro ao carregar métodos de pagamento:", error);
        toast.error("Erro ao carregar métodos de pagamento");
        // Definir métodos de pagamento padrão em caso de erro
        setPaymentMethods([
          { id: "pix", name: "PIX", icon: "qr-code" },
          { id: "credit", name: "Cartão de Crédito", icon: "credit-card" },
          { id: "debit", name: "Cartão de Débito", icon: "credit-card" },
          { id: "cash", name: "Dinheiro", icon: "banknote" },
        ]);
        form.setValue("paymentMethodId", "pix");
      } finally {
        setIsLoadingPaymentMethods(false);
      }
    };

    fetchPaymentMethods();
  }, [form]);

  // Efeito para carregar dados do restaurante
  useEffect(() => {
    const fetchRestaurantData = async () => {
      setIsLoadingRestaurant(true);
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .limit(1)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setRestaurant(data);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do restaurante:", error);
        toast.error("Erro ao carregar dados do restaurante");
      } finally {
        setIsLoadingRestaurant(false);
      }
    };

    fetchRestaurantData();
  }, []);

  // Efeito para carregar horários de funcionamento
  useEffect(() => {
    const fetchBusinessHours = async () => {
      setIsLoadingBusinessHours(true);
      try {
        const { data, error } = await supabase
          .from("business_hours")
          .select("*")
          .order("id");

        if (error) {
          throw error;
        }

        if (data) {
          setBusinessHours(data);
        }
      } catch (error) {
        console.error("Erro ao carregar horários de funcionamento:", error);
        toast.error("Erro ao carregar horários de funcionamento");
      } finally {
        setIsLoadingBusinessHours(false);
      }
    };

    fetchBusinessHours();
  }, []);

  // Atualizar o tipo de pedido quando mudar
  useEffect(() => {
    form.setValue("orderType", orderType);
  }, [orderType, form]);

  // Efeito para animar o botão quando totalItems mudar
  useEffect(() => {
    if (totalItems > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  const formatTimeShort = (timeString: string) => {
    if (!timeString) return "";
    try {
      return timeString.substring(0, 5);
    } catch {
      return timeString;
    }
  };

  const getCurrentDayOfWeek = () => {
    const daysInPortuguese = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];
    const today = new Date();
    return daysInPortuguese[today.getDay()];
  };

  const isOpenNow = () => {
    if (!businessHours || businessHours.length === 0) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const currentDay = getCurrentDayOfWeek();

    const todayBusinessHour = businessHours.find((h) => h.day_of_week === currentDay);
    if (!todayBusinessHour) return false;
    if (todayBusinessHour.is_closed) return false;

    const open = formatTimeShort(todayBusinessHour.open_time);
    const close = formatTimeShort(todayBusinessHour.close_time);
    if (!open || !close) return false;

    // Se o fechamento for "menor" que a abertura, considera virada de dia.
    if (close < open) {
      // Abre hoje e fecha amanhã: está aberto se currentTime >= open OU currentTime <= close
      return currentTime >= open || currentTime <= close;
    }

    return currentTime >= open && currentTime <= close;
  };

  const getNextOpenBusinessHour = (from: Date) => {
    if (!businessHours || businessHours.length === 0) return null;
    const daysInPortuguese = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];

    for (let i = 0; i < 14; i++) {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      const dayName = daysInPortuguese[d.getDay()];
      const bh = businessHours.find((h) => h.day_of_week === dayName);
      if (!bh || bh.is_closed) continue;
      return { date: d, bh };
    }
    return null;
  };

  const buildScheduleSlots = () => {
    const now = new Date();
    const next = getNextOpenBusinessHour(now);
    if (!next) return [] as Date[];

    const { date, bh } = next;
    const openStr = formatTimeShort(bh.open_time);
    const closeStr = formatTimeShort(bh.close_time);
    if (!openStr || !closeStr) return [] as Date[];

    const [openH, openM] = openStr.split(":").map(Number);
    const [closeH, closeM] = closeStr.split(":").map(Number);

    const openDate = new Date(date);
    openDate.setHours(openH, openM || 0, 0, 0);

    const closeDate = new Date(date);
    closeDate.setHours(closeH, closeM || 0, 0, 0);

    // Se fechar no dia seguinte
    if (closeDate <= openDate) {
      closeDate.setDate(closeDate.getDate() + 1);
    }

    const start = new Date(openDate.getTime() + 60 * 60 * 1000);
    const end = new Date(closeDate.getTime() - 60 * 60 * 1000);
    if (end < start) return [] as Date[];

    const slots: Date[] = [];
    const cursor = new Date(start);
    cursor.setMinutes(0, 0, 0);

    while (cursor <= end) {
      // Se o dia retornado for "hoje" e já passou, pula
      if (cursor.getTime() > now.getTime()) {
        slots.push(new Date(cursor));
      }
      cursor.setHours(cursor.getHours() + 1);
    }

    return slots;
  };

  const formatScheduleSlotLabel = (d: Date) => {
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSlotCapacity = async (slot: Date) => {
    const slotStart = new Date(slot);
    const slotEnd = new Date(slot);
    slotEnd.setHours(slotEnd.getHours() + 1);

    const { count, error } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("scheduled_for", slotStart.toISOString())
      .lt("scheduled_for", slotEnd.toISOString());

    if (error) throw error;
    return count || 0;
  };

  const createOrder = async (data: FormValues, scheduledForIso: string | null) => {
    // Preparar o telefone para submissão (adicionar 55 se não tiver)
    const formattedPhone = preparePhoneForSubmission(data.phone);

    // Get the paymentMethodId directly - no mapping needed as we're using the ID from the database
    const paymentMethodId = data.paymentMethodId;

    // Calculate subtotal based on order items
    const subtotal = cartItems.reduce((sum, item) => {
      const basePrice = item.product.price;

      // Calcular o preço dos adicionais
      const addonsTotalPrice = (item.selectedAddons || []).reduce(
        (sum, addon) => sum + addon.price * (addon.quantity || 1),
        0
      );

      // Calcular o preço das configurações/personalizações
      const configurationTotalPrice = item.configurationPrice || 0;

      // Preço total por unidade (produto base + adicionais + personalizações)
      const unitPriceWithAddons = basePrice + addonsTotalPrice + configurationTotalPrice;

      // Preço total do item (incluindo quantidade)
      const totalItemPrice = unitPriceWithAddons * item.quantity;
      return sum + totalItemPrice;
    }, 0);

    // Calculate delivery fee based on orderType - only apply for delivery orders
    const deliveryFeeRaw =
      data.orderType === "delivery"
        ? selectedNeighborhoodFee > 0
          ? selectedNeighborhoodFee
          : restaurant?.delivery_fee ?? 0
        : 0;

    const deliveryFee = Number.isFinite(Number(deliveryFeeRaw)) ? Number(deliveryFeeRaw) : 0;

    const clampToTwoDecimals = (value: number) => Math.round(value * 100) / 100;

    const productDiscountTotal = cartItems.reduce(
      (sum, item) =>
        sum +
        (typeof item.productCouponDiscountTotal === "number"
          ? item.productCouponDiscountTotal
          : 0),
      0
    );

    const subtotalAfterProductDiscount = clampToTwoDecimals(
      Math.max(0, subtotal - productDiscountTotal)
    );

    const calculateCouponDiscount = (coupon: Coupon, baseAmount: number) => {
      if (baseAmount <= 0) return 0;
      const rawDiscount =
        coupon.discount_type === "fixed"
          ? coupon.discount_amount
          : (baseAmount * coupon.discount_percentage) / 100;
      const discount = Math.max(0, Math.min(rawDiscount, baseAmount));
      return clampToTwoDecimals(discount);
    };

    const calculateCouponBaseAmount = (coupon: Coupon) => {
      // Cupom de compra: aplica no subtotal do pedido (itens)
      if (coupon.coupon_type === "purchase") {
        return subtotalAfterProductDiscount;
      }

      // Cupom de produto: aplica apenas nos produtos configurados
      if (coupon.apply_to_all_products) {
        return subtotalAfterProductDiscount;
      }

      const applicableSet = new Set((coupon.applicable_products || []).map(String));

      const applicableSubtotal = cartItems.reduce((sum, item) => {
        if (!applicableSet.has(String(item.product.id))) return sum;

        const basePrice = item.product.price;
        const addonsTotalPrice = (item.selectedAddons || []).reduce(
          (s, addon) => s + addon.price * (addon.quantity || 1),
          0
        );
        const configurationTotalPrice = item.configurationPrice || 0;

        const unitPriceWithAddons = basePrice + addonsTotalPrice + configurationTotalPrice;
        const totalItemPrice = unitPriceWithAddons * item.quantity;

        return sum + totalItemPrice;
      }, 0);

      return applicableSubtotal;
    };

    const discount = appliedCoupon
      ? calculateCouponDiscount(appliedCoupon, calculateCouponBaseAmount(appliedCoupon))
      : 0;

    const totalDiscount = clampToTwoDecimals(Math.max(0, discount + productDiscountTotal));

    // Calculate total
    const total = clampToTwoDecimals(Math.max(0, subtotal + deliveryFee - totalDiscount));

    // Format delivery address if applicable
    let deliveryAddress = null;
    const deliveryRegionId = null;

    if (data.orderType === "delivery") {
      // Format address
      const addressParts = [
        data.streetName,
        data.number,
        data.complement,
        data.neighborhood,
        data.zipCode,
      ].filter(Boolean);

      deliveryAddress = addressParts.join(", ");
    }

    // Prepare order data
    const orderData = {
      customer_name: data.name,
      customer_phone: formattedPhone, // Usar o número formatado com o código do país
      payment_method: paymentMethodId, // Usar o ID diretamente
      payment_status: "pending",
      status: "pending",
      notes: [
        data.notes || "",
        appliedCoupon?.code ? `Cupom: ${appliedCoupon.code}` : "",
        ...cartItems
          .filter((i) => i.productCouponCode)
          .map((i) => `Cupom-produto: ${i.product.name} -> ${i.productCouponCode}`),
      ]
        .filter(Boolean)
        .join("\n") || null,
      subtotal: subtotal,
      total: total,
      delivery_fee: deliveryFee,
      discount: totalDiscount,
      order_type: data.orderType,
      table_number: data.orderType === "instore" ? data.tableNumber : null,
      delivery_address: data.orderType === "delivery" ? deliveryAddress : null,
      delivery_region_id: deliveryRegionId,
      delivery_status: data.orderType === "delivery" ? "pending" : null,
      scheduled_for: scheduledForIso,
    };

    // Insert order into database
    const { data: createdOrder, error: orderError } = await supabase
      .from("orders")
      .insert([orderData])
      .select();

    if (orderError) throw orderError;

    let orderId = null;
    if (createdOrder && createdOrder.length > 0) {
      orderId = createdOrder[0].id;
      console.log("Pedido criado com ID:", orderId);
      setOrderCreatedId(orderId); // Armazenar o ID do pedido criado

      // Salvar o ID do pedido no localStorage
      saveOrderIdToLocalStorage(orderId);
    } else {
      throw new Error("Falha ao criar pedido. Nenhum ID de pedido retornado.");
    }

    // Atualizar uso do cupom (não falha o pedido se der erro)
    if (appliedCoupon) {
      const { error: couponUpdateError } = await (supabase.from("coupons" as any) as any)
        .update({ current_uses: (appliedCoupon.current_uses || 0) + 1 })
        .eq("id", appliedCoupon.id);

      if (couponUpdateError) {
        console.warn("Falha ao atualizar current_uses do cupom:", couponUpdateError);
      }
    }

    // Gerar números de promoções elegíveis (não falha o pedido se der erro)
    try {
      const eligiblePromotions = await getActivePromotionsForOrder(subtotal);
      if (eligiblePromotions && eligiblePromotions.length > 0) {
        await Promise.all(
          eligiblePromotions.map((promotion) =>
            createPromotionNumberRecord(
              promotion.id,
              orderId,
              data.name,
              formattedPhone,
              undefined
            )
          )
        );
      }
    } catch (promoError) {
      console.warn("Falha ao gerar números de promoção:", promoError);
    }

    // Insert order items
    for (const item of cartItems) {
      // Calcular o preço unitário e total corretamente
      const basePrice = item.product.price;

      // Calcular o preço dos adicionais
      const addonsTotalPrice = (item.selectedAddons || []).reduce(
        (sum, addon) => sum + addon.price * (addon.quantity || 1),
        0
      );

      // Calcular o preço das configurações/personalizações
      const configurationTotalPrice = item.configurationPrice || 0;

      // Preço total por unidade (produto base + adicionais + personalizações)
      const unitPriceWithAddons = basePrice + addonsTotalPrice + configurationTotalPrice;

      // Preço total do item (incluindo quantidade)
      const totalItemPrice = unitPriceWithAddons * item.quantity;

      // Insert order item
      const { data: orderItem, error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: orderId,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: Number(unitPriceWithAddons.toFixed(2)),
          total_price: Number(totalItemPrice.toFixed(2)),
          notes: item.notes || null,
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Insert order item addons if any
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        const addonsToInsert = item.selectedAddons.map((addon) => ({
          order_item_id: orderItem.id,
          addon_id: addon.id,
          quantity: addon.quantity || 1,
          unit_price: Number(addon.price.toFixed(2)),
          total_price: Number((addon.price * (addon.quantity || 1)).toFixed(2)),
        }));

        const { error: addonsError } = await supabase
          .from("order_item_addons")
          .insert(addonsToInsert);

        if (addonsError) throw addonsError;
      }

      // Insert order item configurations if any
      if (item.selectedConfigurations && Object.keys(item.selectedConfigurations).length > 0) {
        const configurationPrice = item.configurationPrice || 0;

        const { error: configError } = await supabase
          .from("order_item_configurations")
          .insert({
            order_item_id: orderItem.id,
            configurations: item.selectedConfigurations,
            additional_price: Number(configurationPrice.toFixed(2)),
          });

        if (configError) {
          console.error(
            "Aviso: Erro ao inserir configurações (tabela pode não existir):",
            configError
          );
          // Não lança erro, apenas registra, pois a tabela pode não existir ainda
        }
      }
    }

    // Generate order number from created order
    setOrderNumber(
      createdOrder[0].number || String(Math.floor(10000 + Math.random() * 90000))
    );

    // Define estimated delivery/pickup time
    const now = new Date();
    const estimatedTime = new Date(now.getTime() + 30 * 60000); // +30 minutes
    setOrderTime(
      estimatedTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    // Success notification
    toast.success("Pedido realizado com sucesso!");

    // Move to confirmation
    setCartStep("confirmation");
  };

  const handleCheckoutComplete = async () => {
    try {
      // Validar o formulário
      await form.handleSubmit(submitOrder)();
    } catch (error) {
      console.error("Error during form validation:", error);
    }
  };

  const submitOrder = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const requireNeighborhoodSelection = Boolean(
        restaurant?.require_neighborhood_selection
      );

      if (
        data.orderType === "delivery" &&
        requireNeighborhoodSelection &&
        !neighborhoodStatus.isValid
      ) {
        setIsNeighborhoodRequiredDialogOpen(true);
        setIsSubmitting(false);
        return;
      }

      // Se estiver fechado, bloquear pedido imediato e solicitar agendamento
      if (!isOpenNow()) {
        const slots = buildScheduleSlots();
        if (slots.length === 0) {
          toast.error(
            "Estamos fechados no momento e não há horários disponíveis para agendamento."
          );
          setIsSubmitting(false);
          return;
        }

        setPendingScheduleData(data);
        setAvailableScheduleSlots(slots);
        setSelectedScheduleIso(slots[0].toISOString());
        setIsScheduleDialogOpen(true);
        setIsSubmitting(false);
        return;
      }

      await createOrder(data, null);

      // Salvar os itens do pedido antes de limpar o carrinho
      setOrderItems([...cartItems]);
      setOrderSubtotal(totalPrice);

      // Salvar os dados do formulário
      setOrderData({ ...data });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-orders"] });

      // Go to confirmation screen
      setCartStep("confirmation");

      // Clear cart
      [...cartItems].forEach((_, index) => {
        onRemoveItem(cartItems[0].product.id, 0);
      });

      // Reset form
      form.reset();
    } catch (error: unknown) {
      console.error("Erro ao enviar pedido:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao salvar pedido: " + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsAppForManualFee = async (formValues: FormValues) => {
    try {
      if (!restaurant?.phone) {
        toast.error("Número de telefone do estabelecimento não está disponível");
        return;
      }

      if (!navigator.geolocation) {
        toast.error("Seu dispositivo não suporta localização");
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

      const paymentMethod = paymentMethods.find(
        (method) => method.id === formValues.paymentMethodId
      );
      const paymentMethodName = paymentMethod?.name || "Não informado";

      const addonsAndConfigsTotal = (item: CartItem) => {
        const addonsTotalPrice = (item.selectedAddons || []).reduce(
          (sum, addon) => sum + addon.price * (addon.quantity || 1),
          0
        );
        const configurationTotalPrice = item.configurationPrice || 0;
        return addonsTotalPrice + configurationTotalPrice;
      };

      const detailedItems = cartItems.map((item) => {
        const unitPrice = item.product.price + addonsAndConfigsTotal(item);
        const subtotal = unitPrice * item.quantity;

        const selectedAddons = (item.selectedAddons || []).map((addon) => {
          const qty = addon.quantity || 1;
          return {
            name: addon.name,
            quantity: qty,
            unitPrice: addon.price,
            totalPrice: addon.price * qty,
          };
        });

        const selectedConfigurations = item.selectedConfigurations;
        const configurationsText = selectedConfigurations
          ? Object.entries(selectedConfigurations)
              .map(([key, value]) => {
                if (typeof value === "object" && value && "label" in (value as any)) {
                  return `${key}: ${(value as any).label}`;
                }
                return `${key}: ${String(value)}`;
              })
              .join(", ")
          : "";

        return {
          name: item.product.name,
          code: getProductCodeForMessage(item.product),
          quantity: item.quantity,
          unitPrice,
          subtotal,
          addons: selectedAddons,
          configurationsText,
          configurationPrice: item.configurationPrice || 0,
        };
      });

      const addressLines: string[] = [];
      const line1 = [formValues.streetName, formValues.number]
        .filter(Boolean)
        .join(", ");
      const complement = (formValues.complement || "").trim();
      if (line1) addressLines.push(complement ? `${line1} - ${complement}` : line1);
      addressLines.push(
        neighborhoodStatus.neighborhoodText || formValues.neighborhood || "Não informado"
      );
      const cityState = [formValues.city, formValues.state].filter(Boolean).join(" - ");
      if (cityState) addressLines.push(cityState);
      if (formValues.zipCode) addressLines.push(`CEP: ${String(formValues.zipCode)}`);

      const subtotalProducts = detailedItems.reduce((sum, i) => sum + i.subtotal, 0);
      const couponDiscount = appliedCoupon 
        ? calculateCouponDiscount(appliedCoupon, calculateCouponBaseAmount(appliedCoupon))
        : 0;
      const message = buildWhatsAppMessage({
        customerName: formValues.name || "Não informado",
        orderType: "delivery",
        addressLines,
        items: detailedItems,
        subtotalProducts,
        deliveryFee: 0,
        totalFinal: subtotalProducts - couponDiscount,
        paymentMethod: paymentMethodName,
        notes: formValues.notes || "",
        createdAt: new Date(),
        extraLines: [
          `📍 Localização: ${mapsLink}`,
          "",
          "O bairro não foi encontrado no sistema. Verifique a taxa de entrega para esta localização e informe o valor ao cliente.",
        ],
        couponCode: appliedCoupon?.code,
        couponDiscount,
      });

      const storeWhatsApp = formatWhatsAppNumber(restaurant.phone);

      openWhatsAppMessage(storeWhatsApp, message);
    } catch (error) {
      console.error("Erro ao obter localização/abrir WhatsApp:", error);
      toast.error("Ative a localização para concluir seu pedido");
    }
  };

  // Função para formatar valores em moeda brasileira
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPaymentMethodDisplay = (name: string) => {
    const normalized = (name || "").toLowerCase();
    if (normalized.includes("pix")) return "\u{1F4F1} Pix";
    if (normalized.includes("dinheiro")) return "\u{1F4B5} Dinheiro";
    if (normalized.includes("cart")) return "\u{1F4B3} Cartão";
    if (normalized.includes("credito")) return "\u{1F4B3} Cartão de crédito";
    if (normalized.includes("debito")) return "\u{1F4B3} Cartão de débito";
    return name || "Não informado";
  };

  const getProductCodeForMessage = (product: Product) => {
    const anyProduct = product as any;
    const raw = anyProduct?.code || anyProduct?.sku || anyProduct?.codigo || anyProduct?.ref;
    if (raw === null || raw === undefined) return null;
    const text = String(raw).trim();
    return text.length > 0 ? text : null;
  };

  const buildWhatsAppMessage = (params: {
    customerName: string;
    orderType: OrderType;
    addressLines: string[];
    items: Array<{
      name: string;
      code: string | null;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      addons?: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }>;
      configurationsText?: string;
      configurationPrice?: number;
    }>;
    subtotalProducts: number;
    deliveryFee: number;
    totalFinal: number;
    paymentMethod: string;
    notes: string;
    createdAt: Date;
    extraLines?: string[];
    couponCode?: string;
    couponDiscount?: number;
  }) => {
    const separator = "━━━━━━━━━━━━━━";
    const deliveryLabel =
      params.orderType === "delivery"
        ? "\u{1F6F5} Delivery"
        : params.orderType === "takeaway"
          ? "\u{1F4E6} Retirada"
          : "\u{1F37D}\u{FE0F} No local";

    const createdAtText = params.createdAt.toLocaleString("pt-BR");
    const paymentDisplay = formatPaymentMethodDisplay(params.paymentMethod);

    let message = "*\u{1F514} NOVO PEDIDO \u{1F514}*\n";
    message += `${separator}\n\n`;
    message += `*\u{1F464} Cliente:* ${params.customerName || "Não informado"}\n`;
    message += `*\u{1F4CD} Entrega:* ${deliveryLabel}\n`;

    if (params.orderType === "delivery") {
      message += "*\u{1F3E0} Endereço:*\n";
      if (params.addressLines.length > 0) {
        params.addressLines.forEach((line) => {
          message += `   ${line}\n`;
        });
      } else {
        message += "   Não informado\n";
      }
      message += "\n";
    }

    message += `${separator}\n`;
    message += "*\u{1F6CD}\u{FE0F} ITENS DO PEDIDO:*\n\n";

    if (params.items.length === 0) {
      message += "(Nenhum item)\n\n";
    } else {
      params.items.forEach((item) => {
        const codePart = item.code ? ` (${item.code})` : "";
        message += `* ${item.name}${codePart}\n`;
        message += `  └ \u{1F4CA} Qtd: ${item.quantity}x\n`;
        message += `  └ \u{1F4B0} Unitário: ${formatCurrency(item.unitPrice)}\n`;
        message += `  └ \u{1F9EE} Subtotal: ${formatCurrency(item.subtotal)}\n`;

        if (item.addons && item.addons.length > 0) {
          item.addons.forEach((addon) => {
            message += `  └ \u{2795} ${addon.quantity}x ${addon.name}: ${formatCurrency(
              addon.totalPrice
            )}\n`;
          });
        }

        if (item.configurationsText && item.configurationsText.trim() !== "") {
          message += `  └ \u2699\uFE0F Opções: ${item.configurationsText}\n`;
          const configPrice = Number(item.configurationPrice || 0);
          if (configPrice > 0) {
            message += `  └ \u{1F4B2} Personalização: ${formatCurrency(configPrice)}\n`;
          }
        }

        message += `\n`;
      });
    }

    message += `${separator}\n`;
    message += "*\u{1F4B0} RESUMO FINANCEIRO:*\n\n";
    message += `*\u{1F4B5} Subtotal produtos:* ${formatCurrency(params.subtotalProducts)}\n`;
    if (params.couponCode && params.couponDiscount && params.couponDiscount > 0) {
      message += `*\u{1F941} Cupom (${params.couponCode}):* -${formatCurrency(params.couponDiscount)}\n`;
    }
    if (params.orderType === "delivery" && params.deliveryFee > 0) {
      message += `*\u{1F6F5} Taxa de entrega:* ${formatCurrency(params.deliveryFee)}\n`;
    }
    message += `\n*\u{1F4B0} TOTAL FINAL:* ${formatCurrency(params.totalFinal)}\n`;
    message += `${separator}\n\n`;
    message += `*\u{1F4B3} Pagamento:* ${paymentDisplay}\n`;
    message += `${separator}\n\n`;
    message += "*\u{1F4DD} Observações:*\n";
    message += `${params.notes && params.notes.trim() ? params.notes : "Sem observações"}\n`;

    if (params.extraLines && params.extraLines.length > 0) {
      message += `${separator}\n\n`;
      params.extraLines.forEach((l) => {
        message += `${l}\n`;
      });
    }

    message += `${separator}\n\n`;
    message += `*\u{23F0} Pedido realizado em:* ${createdAtText}\n\n`;
    message += "*\u{2705} Aguardando confirmação do estabelecimento*";
    return message;
  };

  const handleProceedToCheckout = () => {
    setCartStep("order-type");
  };

  const handleSelectOrderType = (type: OrderType) => {
    setOrderType(type);
    setCartStep("checkout");
  };

  const handleBackToCart = () => {
    setCartStep("cart");
  };

  const handleBackToOrderType = () => {
    setCartStep("order-type");
  };

  // Função para lidar com seleção de bairro
  const handleNeighborhoodSelect = (city: string, neighborhood: string, fee: number) => {
    setSelectedCity(city);
    setSelectedNeighborhood(neighborhood);
    setSelectedNeighborhoodFee(fee);
    // Atualizar os campos do formulário também
    form.setValue("city", city);
    form.setValue("neighborhood", neighborhood);
  };

  // Função para atualizar o estado isOpen e notificar o componente pai
  const updateIsOpen = (open: boolean) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  // Reset steps when closing cart
  const handleCloseCart = () => {
    updateIsOpen(false);
    setTimeout(() => {
      setCartStep("cart");
    }, 300); // Delay to allow animation to complete
  };

  // Função para lidar com erros do formulário
  const handleFormError = (errors: z.ZodFormattedError<FormValues>) => {
    console.error("Erros de validação:", errors);
    const firstError = Object.keys(errors)[0];
    if (firstError && firstError !== "_errors") {
      const fieldErrors = errors[firstError as keyof typeof errors];
      const errorMessage =
        fieldErrors &&
        typeof fieldErrors === "object" &&
        "_errors" in fieldErrors
          ? fieldErrors._errors[0]
          : "Erro de validação";
      toast.error(`Erro no campo: ${errorMessage}`);
    } else if (errors._errors?.length) {
      toast.error(`Erro: ${errors._errors[0]}`);
    } else {
      toast.error("Ocorreu um erro de validação");
    }
  };

  const PaymentMethodSelector = () => {
    const currentValue = form.watch("paymentMethodId");

    return (
      <div className="space-y-2">
        <FormLabel className="text-base font-semibold">
          Forma de Pagamento
        </FormLabel>

        {isLoadingPaymentMethods ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={cn(
                  "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-3 hover:bg-gray-50 hover:border-gray-300 cursor-pointer",
                  currentValue === method.id && "border-primary bg-primary/5"
                )}
                onClick={() => form.setValue("paymentMethodId", method.id)}
              >
                <div className="flex flex-col items-center gap-1">
                  <Icon
                    name={method.icon as IconName}
                    className="h-6 w-6 text-primary"
                  />
                  <span className="text-sm">{method.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {form.formState.errors.paymentMethodId && (
          <p className="text-sm font-medium text-red-500">
            {form.formState.errors.paymentMethodId.message}
          </p>
        )}
      </div>
    );
  };

  // Atualizar a seção do WhatsApp no componente de tela de confirmação para usar os dados corretos
  const handleWhatsAppClick = () => {
    try {
      // Usar dados do formulário salvos, ou os dados atuais do formulário como fallback
      const formData = orderData || form.getValues();

      // Buscar o nome do método de pagamento selecionado
      const paymentMethod = paymentMethods.find(
        (method) => method.id === formData.paymentMethodId
      );
      const paymentMethodName = paymentMethod?.name || "Não informado";

      // Usar os itens salvos em vez dos itens atuais do carrinho
      // (que já foram limpos após a confirmação)
      const itemsToUse = orderItems.length > 0 ? orderItems : cartItems;
      const subtotalToUse = orderSubtotal > 0 ? orderSubtotal : totalPrice;

      // Dados para a mensagem
      const orderInfo = {
        orderNumber,
        orderType: formData.orderType,
        name: formData.name || "Não informado",
        phone: formData.phone || "Não informado",
        address:
          formData.orderType === "delivery"
            ? `${formData.streetName || ""}, ${formData.number || ""}, ${
                formData.complement || ""
              }, ${formData.neighborhood || ""}, ${formData.zipCode || ""}`
            : "N/A",
        paymentMethod: paymentMethodName,
        deliveryFee: formData.orderType === "delivery" ? deliveryFee : 0,
        subtotal: subtotalToUse,
        totalPrice:
          formData.orderType === "delivery"
            ? subtotalToUse + deliveryFee
            : subtotalToUse,
        couponCode: appliedCoupon?.code,
        couponDiscount: appliedCoupon 
          ? calculateCouponDiscount(appliedCoupon, calculateCouponBaseAmount(appliedCoupon))
          : 0,
        items: itemsToUse.map((item) => {
          // Calcular valor do item com adicionais e configurações
          const addonsTotalPrice = (item.selectedAddons || []).reduce(
            (sum, addon) => sum + addon.price * (addon.quantity || 1),
            0
          );

          const configurationTotalPrice = item.configurationPrice || 0;

          const itemPrice =
            (item.product.price + addonsTotalPrice + configurationTotalPrice) * item.quantity;

          // Formatar informações dos adicionais, se houver
          const addonsText =
            (item.selectedAddons || []).length > 0
              ? `\n    - Adicionais: ${item.selectedAddons
                  ?.map(
                    (addon) =>
                      `${addon.name} ${
                        addon.quantity > 1 ? `(${addon.quantity}x)` : ""
                      } ${formatCurrency(addon.price * (addon.quantity || 1))}`
                  )
                  .join(", ")}`
              : "";

          // Formatar informações das configurações, se houver
          const configurationsText =
            item.selectedConfigurations && Object.keys(item.selectedConfigurations).length > 0
              ? `\n    - ${Object.entries(item.selectedConfigurations)
                  .map(
                    ([key, value]) => {
                      if (typeof value === "object" && value.label) {
                        return `${key}: ${value.label}`;
                      } else if (Array.isArray(value)) {
                        return `${key}: ${value.map((v: any) => v.label || String(v)).join(", ")}`;
                      }
                      return `${key}: ${String(value)}`;
                    }
                  )
                  .join(", ")}${
                  item.configurationPrice && item.configurationPrice > 0
                    ? ` (${formatCurrency(item.configurationPrice)})`
                            : ""
                }`
              : "";

          // Formatar observações do item, se houver
          const notesText = item.notes ? `\n    - Obs: ${item.notes}` : "";

          return `${item.quantity}x ${item.product.name} (${formatCurrency(
            itemPrice
          )})${addonsText}${configurationsText}${notesText}`;
        }),
        restaurantName: restaurant?.name || "Nosso Restaurante",
        tableNumber: formData.tableNumber || "N/A",
        notes: formData.notes || "Nenhuma",
      };

      const addressLines: string[] = [];
      if (formData.orderType === "delivery") {
        const line1 = [formData.streetName, formData.number]
          .filter(Boolean)
          .join(", ");
        const complement = (formData.complement || "").trim();
        if (line1) addressLines.push(complement ? `${line1} - ${complement}` : line1);
        if (formData.neighborhood) addressLines.push(String(formData.neighborhood));
        const cityState = [formData.city, formData.state]
          .filter(Boolean)
          .join(" - ");
        if (cityState) addressLines.push(cityState);
        if (formData.zipCode) addressLines.push(`CEP: ${String(formData.zipCode)}`);
      }

      const detailedItems = (itemsToUse || []).map((item) => {
        const addonsTotalPrice = (item.selectedAddons || []).reduce(
          (sum, addon) => sum + addon.price * (addon.quantity || 1),
          0
        );
        const configurationTotalPrice = item.configurationPrice || 0;
        const unitPrice = item.product.price + addonsTotalPrice + configurationTotalPrice;
        const subtotal = unitPrice * item.quantity;

        const selectedAddons = (item.selectedAddons || []).map((addon) => {
          const qty = addon.quantity || 1;
          return {
            name: addon.name,
            quantity: qty,
            unitPrice: addon.price,
            totalPrice: addon.price * qty,
          };
        });

        const selectedConfigurations = item.selectedConfigurations;
        const configurationsText = selectedConfigurations
          ? Object.entries(selectedConfigurations)
              .map(([key, value]) => {
                if (typeof value === "object" && value && "label" in (value as any)) {
                  return `${key}: ${(value as any).label}`;
                }
                return `${key}: ${String(value)}`;
              })
              .join(", ")
          : "";

        return {
          name: item.product.name,
          code: getProductCodeForMessage(item.product),
          quantity: item.quantity,
          unitPrice,
          subtotal,
          addons: selectedAddons,
          configurationsText,
          configurationPrice: item.configurationPrice || 0,
        };
      });

      const createdAt = new Date();

      const message = buildWhatsAppMessage({
        customerName: orderInfo.name,
        orderType: orderInfo.orderType,
        addressLines,
        items: detailedItems,
        subtotalProducts: orderInfo.subtotal,
        deliveryFee: orderInfo.deliveryFee,
        totalFinal: orderInfo.totalPrice,
        paymentMethod: orderInfo.paymentMethod,
        notes: orderInfo.notes,
        createdAt,
        couponCode: orderInfo.couponCode,
        couponDiscount: orderInfo.couponDiscount,
      });

      // Tentar obter o número do WhatsApp do restaurante
      if (!restaurant?.phone) {
        toast.error(
          "Número de telefone do estabelecimento não está disponível"
        );
        return;
      }

      const storeWhatsApp = formatWhatsAppNumber(restaurant.phone);

      // Abrir WhatsApp com a mensagem
      openWhatsAppMessage(storeWhatsApp, message);
    } catch (error) {
      console.error("Erro ao processar número de WhatsApp:", error);
      toast.error(
        "Não foi possível abrir o WhatsApp. Verifique se o estabelecimento possui um número válido."
      );
    }
  };

  const handleFinishOrder = () => {
    updateIsOpen(false);
    setTimeout(() => {
      setCartStep("cart");
    }, 300);
  };

  // Função auxiliar para formatar horário
  const formatTime = (timeString: string) => {
    if (!timeString) return "";

    try {
      const [hours, minutes] = timeString.split(":");
      return `${hours}h${minutes !== "00" ? minutes : ""}`;
    } catch (e) {
      return timeString;
    }
  };

  // Função para obter dias de funcionamento
  const getBusinessDays = () => {
    if (!businessHours || businessHours.length === 0) {
      return "Horário não disponível";
    }

    // Filtrar dias em que a loja está aberta
    const openDays = businessHours.filter((hour) => !hour.is_closed);

    if (openDays.length === 0) {
      return "Fechado todos os dias";
    }

    if (openDays.length === 7) {
      return "Todos os dias";
    }

    // Agrupar dias consecutivos
    const daysOfWeek = [
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
      "Domingo",
    ];
    const sortedOpenDays = openDays.sort(
      (a, b) =>
        daysOfWeek.indexOf(a.day_of_week) - daysOfWeek.indexOf(b.day_of_week)
    );

    // Simplificar para intervalo quando todos os dias úteis estão abertos
    const weekdaysOpen = [
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
    ].every((day) => sortedOpenDays.find((d) => d.day_of_week === day));

    const weekendOpen = ["Sábado", "Domingo"].every((day) =>
      sortedOpenDays.find((d) => d.day_of_week === day)
    );

    if (weekdaysOpen && weekendOpen) {
      return "Todos os dias";
    }

    if (weekdaysOpen) {
      return "Segunda a Sexta";
    }

    // Caso contrário, listar os dias abertos
    return sortedOpenDays
      .map((day) => day.day_of_week.split("-")[0])
      .join(", ");
  };

  // Função para formatar horário de funcionamento
  const getBusinessHours = () => {
    if (!businessHours || businessHours.length === 0) {
      return "Horário não disponível";
    }

    // Obter dia da semana atual em português
    const daysInPortuguese = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];

    const today = new Date();
    const dayOfWeek = daysInPortuguese[today.getDay()];

    // Encontrar o registro para hoje
    const todayBusinessHour = businessHours.find(
      (hour) => hour.day_of_week === dayOfWeek
    );

    if (!todayBusinessHour) {
      return "Horário de hoje não disponível";
    }

    if (todayBusinessHour.is_closed) {
      return `Hoje ${dayOfWeek} estamos fechados`;
    }

    return `Hoje ${dayOfWeek} estamos abertos das ${formatTime(
      todayBusinessHour.open_time
    )} às ${formatTime(todayBusinessHour.close_time)}`;
  };

  // Componente para exibir informações do restaurante
  const RestaurantInfo = () => {
    if (isLoadingRestaurant || isLoadingBusinessHours) {
      return (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!restaurant) {
      return (
        <p className="text-sm text-muted-foreground">
          Informações do restaurante indisponíveis no momento.
        </p>
      );
    }

    return (
      <>
        <p className="text-sm text-muted-foreground">
          Nosso endereço: {restaurant.address}
        </p>
        <p className="text-sm text-muted-foreground">{getBusinessHours()}</p>
        {restaurant.phone && (
          <p className="text-sm text-muted-foreground">
            Telefone: {formatPhoneNumber(restaurant.phone)}
          </p>
        )}
      </>
    );
  };

  // Função para buscar endereço pelo CEP
  const fetchAddressByCep = async (cep: string) => {
    // Remover caracteres não numéricos do CEP
    const cleanCep = cep.replace(/\D/g, "");

    // Verificar se o CEP tem 8 dígitos numéricos
    if (cleanCep.length !== 8) {
      return;
    }

    setIsLoadingCep(true);

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCep}/json/`
      );
      const data = await response.json();

      // Verificar se a API retornou erro
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      // Preencher os campos do formulário com os dados retornados
      form.setValue("streetName", data.logradouro || "");
      form.setValue("neighborhood", data.bairro || "");
      form.setValue("city", data.localidade || "");
      form.setValue("state", data.uf || "");

      // Focar no campo número após preencher o endereço
      setTimeout(() => {
        const numberInput = document.querySelector(
          'input[name="number"]'
        ) as HTMLInputElement;
        if (numberInput) {
          numberInput.focus();
        }
      }, 100);

      toast.success("Endereço preenchido com sucesso");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar endereço pelo CEP");
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Função para lidar com o evento de blur do campo CEP
  const handleCepBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value;
    if (cep && cep.length >= 8) {
      fetchAddressByCep(cep);
    }
  };

  // Função para navegar para a tela de rastreamento do pedido
  const handleTrackOrder = () => {
    console.log("ID do pedido para rastreamento:", orderCreatedId);

    // Tentar usar o ID do estado, ou recuperar do localStorage
    const trackingId = orderCreatedId || getStoredOrderId();

    if (trackingId) {
      // Navegar para a página de rastreamento com o ID do pedido
      navigate(`/track-order/${trackingId}`);
      // Fechar o carrinho após navegar
      handleFinishOrder();
    } else {
      console.error("ID do pedido não disponível para rastreamento");
      toast.error(
        "Não foi possível encontrar informações do pedido para rastrear"
      );
    }
  };

  return (
    <>
      <AlertDialog
        open={isNeighborhoodRequiredDialogOpen}
        onOpenChange={setIsNeighborhoodRequiredDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bairro não cadastrado</AlertDialogTitle>
            <AlertDialogDescription>
              O bairro informado não está cadastrado no sistema. Para concluir seu
              pedido, ative a localização para enviarmos o pedido pelo WhatsApp e
              a empresa confirmar a taxa de entrega.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const current = orderData || form.getValues();
                await openWhatsAppForManualFee(current);
                setIsNeighborhoodRequiredDialogOpen(false);
              }}
              className="bg-delivery-500 hover:bg-delivery-600"
            >
              Ativar localização
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Agendamento de pedido</AlertDialogTitle>
            <AlertDialogDescription>
              A empresa está fechada no momento. Faça um pedido agendado e escolha o horário
              para receber com a empresa aberta.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <Label>Escolha o horário</Label>
            <Select value={selectedScheduleIso} onValueChange={setSelectedScheduleIso}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um horário" />
              </SelectTrigger>
              <SelectContent>
                {availableScheduleSlots.map((slot) => {
                  const value = slot.toISOString();
                  return (
                    <SelectItem key={value} value={value}>
                      {formatScheduleSlotLabel(slot)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingScheduleData(null);
                setAvailableScheduleSlots([]);
                setSelectedScheduleIso("");
              }}
            >
              Fechar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  if (!pendingScheduleData) {
                    toast.error("Não foi possível agendar o pedido. Tente novamente.");
                    return;
                  }
                  if (!selectedScheduleIso) {
                    toast.error("Selecione um horário para agendar.");
                    return;
                  }

                  const slotDate = new Date(selectedScheduleIso);
                  const maxPerSlot =
                    typeof restaurant?.max_scheduled_per_slot === "number"
                      ? restaurant.max_scheduled_per_slot
                      : 10;
                  const currentCount = await getSlotCapacity(slotDate);

                  if (currentCount >= maxPerSlot) {
                    toast.error(
                      "Esse horário já está com muitos pedidos agendados. Escolha uma hora a mais ou a menos."
                    );
                    return;
                  }

                  setIsScheduleDialogOpen(false);
                  await createOrder(pendingScheduleData, selectedScheduleIso);

                  // Salvar os itens do pedido antes de limpar o carrinho
                  setOrderItems([...cartItems]);
                  setOrderSubtotal(totalPrice);
                  setOrderData({ ...pendingScheduleData });
                  queryClient.invalidateQueries({ queryKey: ["orders"] });

                  setPendingScheduleData(null);
                  setAvailableScheduleSlots([]);
                  setSelectedScheduleIso("");
                } catch (e) {
                  console.error("Erro ao agendar pedido:", e);
                  toast.error("Erro ao agendar pedido");
                }
              }}
              className="bg-delivery-500 hover:bg-delivery-600"
            >
              Agendar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Botão flutuante do carrinho */}
      <Button
        onClick={() => updateIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full bg-delivery-500 hover:bg-delivery-600 shadow-lg z-50 flex items-center justify-center transition-transform duration-300",
          isAnimating && "scale-110"
        )}
        size="icon"
      >
        <ShoppingCart className="h-6 w-6" />
        {totalItems > 0 && (
          <Badge
            className={cn(
              "absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center font-bold bg-delivery-600 transition-all",
              isAnimating && "animate-pulse"
            )}
          >
            {totalItems}
          </Badge>
        )}
      </Button>

      {/* Overlay do carrinho */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => {
          if (cartStep === "cart") {
            handleCloseCart();
          }
        }}
      />

      {/* Drawer lateral do carrinho */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-full sm:max-w-md bg-white z-50 shadow-xl transition-transform duration-300 ease-in-out overflow-hidden flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header do drawer - muda conforme o passo */}
        <div className="flex-shrink-0 p-4 border-b bg-white sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {cartStep !== "cart" && cartStep !== "confirmation" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={
                  cartStep === "order-type"
                    ? handleBackToCart
                    : handleBackToOrderType
                }
                className="rounded-full h-8 w-8 mr-1"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <ShoppingCart className="h-5 w-5 text-delivery-500" />
            <h2 className="font-bold text-xl">
              {cartStep === "cart" && "Seu pedido"}
              {cartStep === "order-type" && "Tipo de Pedido"}
              {cartStep === "checkout" && "Finalizar Pedido"}
              {cartStep === "confirmation" && "Pedido Confirmado"}
            </h2>
            {cartStep === "cart" && totalItems > 0 && (
              <p className="text-sm text-muted-foreground ml-1">
                {totalItems} {totalItems === 1 ? "item" : "itens"}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseCart}
            className="rounded-full h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Conteúdo do drawer - muda conforme o passo */}
        {cartStep === "cart" && (
          <>
            {cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-1">
                  Seu carrinho está vazio
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Adicione alguns produtos do menu para começar seu pedido
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsOpen(false)}
                >
                  Voltar para o menu
                </Button>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 overflow-y-auto">
                  <div className="p-4 space-y-4">
                    {cartItems.map((item, index) => (
                      <div
                        key={`${item.product.id}-${index}`}
                        className="flex gap-3"
                      >
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                          <img
                            src={item.product.imageUrl || "/placeholder.svg"}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{item.product.name}</h4>
                            <div className="text-right">
                              {!isZeroPriceProduct(item.product.price) && (
                                <p className="font-medium">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(item.product.price * item.quantity)}
                                </p>
                              )}
                              {item.quantity > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  {item.quantity}x
                                </p>
                              )}
                            </div>
                          </div>

                          {item.selectedAddons &&
                            item.selectedAddons.length > 0 && (
                              <div className="mt-1 mb-2">
                                {item.selectedAddons.map((addon) => (
                                  <div
                                    key={addon.id}
                                    className="flex justify-between text-sm text-muted-foreground"
                                  >
                                    <span>
                                      {addon.name}{" "}
                                      {addon.quantity > 1
                                        ? `(${addon.quantity}x)`
                                        : ""}
                                    </span>
                                    <span>
                                      {new Intl.NumberFormat("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      }).format(
                                        addon.price * (addon.quantity || 1)
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                          {item.selectedConfigurations &&
                            Object.keys(item.selectedConfigurations).length > 0 && (
                              <div className="mt-1 mb-2 space-y-1">
                                {Object.entries(item.selectedConfigurations).map(
                                  ([key, value], idx) => {
                                    try {
                                      // Se value é um objeto com label e additionalPrice (radio/select)
                                      if (
                                        typeof value === "object" &&
                                        !Array.isArray(value) &&
                                        value?.label
                                      ) {
                                        return (
                                          <div
                                            key={idx}
                                            className="flex justify-between text-xs text-muted-foreground"
                                          >
                                            <span>• {value.label}</span>
                                            {value.additionalPrice &&
                                              value.additionalPrice > 0 && (
                                                <span className="font-medium">
                                                  +
                                                  {new Intl.NumberFormat("pt-BR", {
                                                    style: "currency",
                                                    currency: "BRL",
                                                  }).format(value.additionalPrice)}
                                                </span>
                                              )}
                                          </div>
                                        );
                                      }

                                      // Se value é um array (checkbox)
                                      if (Array.isArray(value)) {
                                        return value.map((v: any, vIdx) => (
                                          <div
                                            key={`${idx}-${vIdx}`}
                                            className="flex justify-between text-xs text-muted-foreground"
                                          >
                                            <span>• {v.label}</span>
                                            {v.additionalPrice &&
                                              v.additionalPrice > 0 && (
                                                <span className="font-medium">
                                                  +
                                                  {new Intl.NumberFormat("pt-BR", {
                                                    style: "currency",
                                                    currency: "BRL",
                                                  }).format(v.additionalPrice)}
                                                </span>
                                              )}
                                          </div>
                                        ));
                                      }

                                      // Se é apenas um string simples (sem preço)
                                      return (
                                        <div
                                          key={idx}
                                          className="text-xs text-muted-foreground"
                                        >
                                          • {String(value)}
                                        </div>
                                      );
                                    } catch (error) {
                                      console.error('Erro ao renderizar configuração:', error);
                                      return (
                                        <div key={idx} className="text-xs text-red-500">
                                          Erro na configuração
                                        </div>
                                      );
                                    }
                                  }
                                )}
                              </div>
                            )}

                          {item.notes && (
                            <p className="text-xs text-muted-foreground italic mt-1">
                              Obs: {item.notes}
                            </p>
                          )}

                          {/* Subtotal total do item */}
                          <div className="flex justify-between mt-2 pt-2 border-t border-gray-100">
                            <span className="text-sm font-medium">Subtotal item:</span>
                            <span className="text-sm font-bold text-delivery-700">
                              {(() => {
                                const basePrice = (item.product.price || 0) * item.quantity;
                                const addonsPrice = (item.selectedAddons || []).reduce(
                                  (sum, addon) => sum + addon.price * (addon.quantity || 1), 0
                                );
                                const configPrice = item.configurationPrice || 0;
                                const totalItemPrice = basePrice + addonsPrice + configPrice;
                                
                                return new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(totalItemPrice);
                              })()}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border rounded-md">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none"
                                onClick={() =>
                                  onRemoveItem(item.product.id, index)
                                }
                              >
                                {item.quantity === 1 ? (
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Minus className="h-4 w-4" />
                                )}
                              </Button>
                              <span className="w-8 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none"
                                onClick={() => onAddItem(
                                  item.product,
                                  1,
                                  item.selectedAddons,
                                  item.notes,
                                  item.selectedConfigurations,
                                  item.configurationPrice
                                )}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex-shrink-0 p-4 border-t bg-white sticky bottom-0">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>
                    {/* Não mostrar taxa de entrega no carrinho inicial */}
                    {cartStep !== "cart" && orderType === "delivery" && deliveryFee !== null && deliveryFee !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Taxa de entrega
                        </span>
                        <span>{deliveryFee === 0 ? "Grátis" : formatCurrency(deliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-delivery-500 hover:bg-delivery-600"
                    onClick={handleProceedToCheckout}
                    disabled={cartItems.length === 0}
                  >
                    Finalizar pedido
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {/* Tela de seleção de tipo de pedido */}
        {cartStep === "order-type" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-lg sm:text-xl font-medium mb-2 sm:mb-4">
                    Como você deseja receber seu pedido?
                  </h3>

                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <Button
                      className="h-auto py-4 sm:py-6 flex flex-col items-center justify-center text-base sm:text-lg gap-2 bg-white text-black border hover:bg-gray-100 relative overflow-hidden min-h-[120px] sm:min-h-[140px]"
                      onClick={() => handleSelectOrderType("delivery")}
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-delivery-100 rounded-bl-full -mt-4 -mr-4 sm:-mt-5 sm:-mr-5 flex items-start justify-end pt-1.5 pr-1.5 sm:pt-2 sm:pr-2">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-delivery-500" />
                      </div>
                      <div className="bg-delivery-100 p-2.5 sm:p-3 rounded-full text-delivery-500">
                        <MapPin className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>
                      <span className="font-medium mt-1 sm:mt-2">Delivery</span>
                      <p className="text-xs sm:text-sm text-muted-foreground text-center px-2">
                        Entrega no seu endereço
                      </p>
                    </Button>

                    <Button
                      className="h-auto py-4 sm:py-6 flex flex-col items-center justify-center text-base sm:text-lg gap-2 bg-white text-black border hover:bg-gray-100 relative overflow-hidden min-h-[120px] sm:min-h-[140px]"
                      onClick={() => handleSelectOrderType("takeaway")}
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-delivery-100 rounded-bl-full -mt-4 -mr-4 sm:-mt-5 sm:-mr-5 flex items-start justify-end pt-1.5 pr-1.5 sm:pt-2 sm:pr-2">
                        <Package2 className="h-4 w-4 sm:h-5 sm:w-5 text-delivery-500" />
                      </div>
                      <div className="bg-delivery-100 p-2.5 sm:p-3 rounded-full text-delivery-500">
                        <Package2 className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>
                      <span className="font-medium mt-1 sm:mt-2">Retirada</span>
                      <p className="text-xs sm:text-sm text-muted-foreground text-center px-2">
                        Retire seu pedido na loja
                      </p>
                    </Button>

                    <Button
                      className="h-auto py-4 sm:py-6 flex flex-col items-center justify-center text-base sm:text-lg gap-2 bg-white text-black border hover:bg-gray-100 relative overflow-hidden min-h-[120px] sm:min-h-[140px]"
                      onClick={() => handleSelectOrderType("instore")}
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-delivery-100 rounded-bl-full -mt-4 -mr-4 sm:-mt-5 sm:-mr-5 flex items-start justify-end pt-1.5 pr-1.5 sm:pt-2 sm:pr-2">
                        <AlignJustify className="h-4 w-4 sm:h-5 sm:w-5 text-delivery-500" />
                      </div>
                      <div className="bg-delivery-100 p-2.5 sm:p-3 rounded-full text-delivery-500">
                        <AlignJustify className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>
                      <span className="font-medium mt-1 sm:mt-2">No local</span>
                      <p className="text-xs sm:text-sm text-muted-foreground text-center px-2">
                        Consuma na loja, direto na mesa
                      </p>
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Tela de checkout */}
        {cartStep === "checkout" && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium">Finalizando seu pedido</h3>
                <p className="text-sm text-muted-foreground">
                  {orderType === "delivery" && "Entrega no seu endereço"}
                  {orderType === "takeaway" && "Retire seu pedido na loja"}
                  {orderType === "instore" && "Consuma na loja"}
                </p>
              </div>

              <Form {...form}>
                <form className="space-y-6">
                  {/* Dados do cliente - para todos os tipos de pedido */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium">Seus dados</h3>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Seu nome completo"
                                className="pl-10"
                                {...field}
                                disabled={isSubmitting}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="(00) 00000-0000"
                                className="pl-10"
                                {...field}
                                value={formatPhoneInput(field.value)}
                                onChange={(e) => {
                                  // Atualiza apenas os números no valor do campo
                                  const numbers = e.target.value.replace(
                                    /\D/g,
                                    ""
                                  );
                                  field.onChange(numbers);
                                }}
                                disabled={isSubmitting}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Campos específicos para entrega */}
                  {orderType === "delivery" && (
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="text-md font-medium">
                        Endereço de entrega
                      </h3>

                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP (opcional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="00000-000"
                                  {...field}
                                  onBlur={handleCepBlur}
                                  disabled={isSubmitting || isLoadingCep}
                                />
                                {isLoadingCep && (
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground mt-1">
                              Digite o CEP para preenchimento automático do
                              endereço
                            </p>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="streetName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rua</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nome da rua"
                                {...field}
                                disabled={isSubmitting || isLoadingCep}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="123"
                                  {...field}
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="complement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Complemento</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Apto, bloco..."
                                  {...field}
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Selector com autocomplete para bairros */}
                      <div>
                        <NeighborhoodSelector
                          onSelect={handleNeighborhoodSelect}
                          onStatusChange={(status) => {
                            setNeighborhoodStatus({
                              neighborhoodText: status.neighborhoodText,
                              isValid: status.isValid,
                            });

                            if (status.isValid && typeof status.fee === "number") {
                              setSelectedCity(status.city);
                              setSelectedNeighborhood(status.neighborhoodText);
                              setSelectedNeighborhoodFee(status.fee);
                              form.setValue("city", status.city);
                              form.setValue("neighborhood", status.neighborhoodText);
                            }

                            if (!status.isValid) {
                              setSelectedNeighborhoodFee(0);
                            }
                          }}
                          defaultCity={form.getValues("city")}
                          defaultNeighborhood={form.getValues("neighborhood")}
                          disabled={isSubmitting || isLoadingCep}
                        />
                      </div>

                      {/* Esconder os campos de cidade e estado com display:none */}
                      <div
                        className="grid grid-cols-2 gap-3"
                        style={{ display: "none" }}
                      >
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Cidade"
                                  {...field}
                                  disabled={isSubmitting || isLoadingCep}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="UF"
                                  {...field}
                                  disabled={isSubmitting || isLoadingCep}
                                  maxLength={2}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Campos específicos para retirada na loja */}
                  {orderType === "takeaway" && (
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="text-md font-medium">Retirada na loja</h3>
                      <RestaurantInfo />
                    </div>
                  )}

                  {/* Campos específicos para consumo no local */}
                  {orderType === "instore" && (
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="text-md font-medium">Consumo no local</h3>

                      <RestaurantInfo />

                      <FormField
                        control={form.control}
                        name="tableNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número da Mesa</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: 10"
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Método de pagamento - para todos os tipos de pedido */}
                  <CouponInput
                    heading="Cupom"
                    containerClassName="space-y-4 border-t pt-4"
                    orderValue={totalPrice}
                    appliedCoupon={appliedCoupon}
                    cartProductIds={cartItems.map((i) => String(i.product.id))}
                    mode="checkout"
                    onCouponApply={(coupon) => setAppliedCoupon(coupon)}
                  />

                  {/* Método de pagamento - para todos os tipos de pedido */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-md font-medium">Método de Pagamento</h3>

                    <PaymentMethodSelector />
                  </div>

                  {/* Observações - para todos os tipos de pedido */}
                  <div className="space-y-4 border-t pt-4">
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Alguma instrução adicional?"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>

              <div className="space-y-3 mt-6 mb-4 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                {orderType === "delivery" && deliveryFee !== null && deliveryFee !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Taxa de entrega
                    </span>
                    <span>{deliveryFee === 0 ? "Grátis" : formatCurrency(deliveryFee)}</span>
                  </div>
                )}
                {couponDiscountForDisplay > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="text-green-600 font-medium">
                      -{formatCurrency(couponDiscountForDisplay)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>
                    {formatCurrency(
                      couponDiscountForDisplay > 0
                        ? totalAfterDiscountForDisplay
                        : orderType === "delivery"
                          ? finalTotal
                          : totalPrice
                    )}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleBackToOrderType}
                  disabled={isSubmitting}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1 bg-delivery-500 hover:bg-delivery-600"
                  onClick={handleCheckoutComplete}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processando...
                    </span>
                  ) : (
                    "Confirmar Pedido"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tela de confirmação */}
        {cartStep === "confirmation" && (
          <ScrollArea className="flex-1">
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center min-h-full">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-green-100 mb-3 sm:mb-4">
                <Check className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>

              <h3 className="text-lg sm:text-xl font-bold mb-2">Pedido Confirmado!</h3>
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg w-full mb-4 sm:mb-6">
                <p className="text-green-800 font-medium text-base sm:text-lg">
                  #{orderNumber}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Código do pedido</p>
              </div>

              {/* <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-delivery-500" />
                <p className="text-xs sm:text-sm text-center">
                  {orderType === "delivery"
                    ? "Horário estimado de chegada"
                    : orderType === "takeaway"
                    ? "Retirada disponível para"
                    : "Pedido disponível em"}{" "}
                  <span className="font-medium ml-1">{orderTime}</span>
                </p>
              </div> */}

              <div className="space-y-2 sm:space-y-3 w-full mt-3 sm:mt-4">
                <Button
                  className="w-full gap-2 bg-green-500 hover:bg-green-600 h-10 sm:h-11 text-sm sm:text-base"
                  onClick={handleWhatsAppClick}
                >
                  <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  Enviar pedido por WhatsApp
                </Button>

                <Button
                  className="w-full gap-2 bg-delivery-500 hover:bg-delivery-600 h-10 sm:h-11 text-sm sm:text-base"
                  onClick={handleTrackOrder}
                >
                  <Package2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  Acompanhar Pedido
                </Button>

                <Button
                  variant="outline"
                  className="w-full gap-2 h-10 sm:h-11 text-sm sm:text-base"
                  onClick={handleFinishOrder}
                >
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  Concluir
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </>
  );
}
