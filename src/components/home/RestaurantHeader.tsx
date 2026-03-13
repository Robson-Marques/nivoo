import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Star, Bike, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { BannerCarousel } from "./BannerCarousel";
import { SocialMediaLinks } from "./SocialMediaLinks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Interface para horários de funcionamento
interface BusinessHour {
  id: string;
  day_of_week: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

// Interface para tempos de entrega
interface DeliveryTime {
  id: string;
  restaurant_id: string;
  min_time: number;
  max_time: number;
  day_of_week: string | null;
}

// Interface para restaurant
interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  banner_url: string | null;
  logo_url: string | null;
  open_time: string | null;
  close_time: string | null;
  delivery_fee: number | null;
  description?: string | null;
  phone?: string | null;
  min_order_value?: number | null;
}

export function RestaurantHeader() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [deliveryTimes, setDeliveryTimes] = useState<DeliveryTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isLoadingBusinessHours, setIsLoadingBusinessHours] = useState(false);
  const [isLoadingDeliveryTimes, setIsLoadingDeliveryTimes] = useState(false);

  useEffect(() => {
    async function fetchRestaurantInfo() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .limit(1)
          .single();

        if (error) throw error;
        setRestaurant(data);
        setError(false);
      } catch (err) {
        console.error("Error fetching restaurant info:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurantInfo();
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
      } finally {
        setIsLoadingBusinessHours(false);
      }
    };

    fetchBusinessHours();
  }, []);

  // Efeito para carregar tempos de entrega
  useEffect(() => {
    const fetchDeliveryTimes = async () => {
      setIsLoadingDeliveryTimes(true);

      try {
        const { data, error } = await supabase
          .from("delivery_times")
          .select("*")
          .order("id");

        if (error) {
          throw error;
        }

        if (data) {
          setDeliveryTimes(data);
        }
      } catch (error) {
        console.error("Erro ao carregar tempos de entrega:", error);
      } finally {
        setIsLoadingDeliveryTimes(false);
      }
    };

    fetchDeliveryTimes();
  }, []);

  // Format time from HH:MM:SS to HH:MM
  const formatTime = (timeString: string | null) => {
    if (!timeString) return "";
    return timeString.substring(0, 5);
  };

  // Obter o dia da semana atual em português
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

  // Função para obter tempo de entrega atual baseado no dia da semana
  const getCurrentDeliveryTime = () => {
    if (!deliveryTimes || deliveryTimes.length === 0) {
      // Valor padrão caso não tenha dados
      return { min: 30, max: 50 };
    }

    const currentDayOfWeek = getCurrentDayOfWeek();

    // Primeiro verifica se há um tempo específico para o dia atual
    const todayDeliveryTime = deliveryTimes.find(
      (time) => time.day_of_week === currentDayOfWeek
    );

    if (todayDeliveryTime) {
      return {
        min: todayDeliveryTime.min_time,
        max: todayDeliveryTime.max_time,
      };
    }

    // Se não encontrar específico para o dia, usa o tempo padrão (sem day_of_week)
    const defaultDeliveryTime = deliveryTimes.find(
      (time) => time.day_of_week === null || time.day_of_week === ""
    );

    if (defaultDeliveryTime) {
      return {
        min: defaultDeliveryTime.min_time,
        max: defaultDeliveryTime.max_time,
      };
    }

    // Se não encontrar nenhum, usa o primeiro da lista
    return {
      min: deliveryTimes[0].min_time,
      max: deliveryTimes[0].max_time,
    };
  };

  // Check if restaurant is currently open based on business_hours
  const isOpenNow = () => {
    if (!businessHours || businessHours.length === 0) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const currentDayOfWeek = getCurrentDayOfWeek();

    const todayIntervals = businessHours
      .filter((hour) => hour.day_of_week === currentDayOfWeek)
      .filter((hour) => !hour.is_closed)
      .sort((a, b) => (a.open_time || "").localeCompare(b.open_time || ""));

    if (todayIntervals.length === 0) return false;

    return todayIntervals.some(
      (interval) =>
        currentTime >= formatTime(interval.open_time) &&
        currentTime <= formatTime(interval.close_time)
    );
  };

  // Get today's open and close times
  const getTodayHours = () => {
    if (!businessHours || businessHours.length === 0) return null;

    const currentDayOfWeek = getCurrentDayOfWeek();

    return businessHours
      .filter((hour) => hour.day_of_week === currentDayOfWeek)
      .sort((a, b) => (a.open_time || "").localeCompare(b.open_time || ""));
  };

  const todayHours = getTodayHours();
  const todayNextClosing =
    Array.isArray(todayHours) && todayHours.length > 0
      ? todayHours
          .filter((h) => !h.is_closed)
          .sort((a, b) => (a.open_time || "").localeCompare(b.open_time || ""))
          .map((h) => ({
            open: formatTime(h.open_time),
            close: formatTime(h.close_time),
          }))
          .find((h) => {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;
            return currentTime >= h.open && currentTime <= h.close;
          })
      : null;

  const todayNextOpening =
    Array.isArray(todayHours) && todayHours.length > 0
      ? (() => {
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;

          const intervals = todayHours
            .filter((h) => !h.is_closed)
            .map((h) => ({
              open: formatTime(h.open_time),
              close: formatTime(h.close_time),
            }))
            .sort((a, b) => (a.open || "").localeCompare(b.open || ""));

          const next = intervals.find((h) => currentTime < h.open);
          return next || intervals[0] || null;
        })()
      : null;

  return (
    <div className="relative w-full">
      {/* Banner Carrossel - Responsivo e HD */}
      <div className="md:h-auto">
        {loading ? (
          <Skeleton className="w-full h-40 sm:h-48 md:h-56 lg:h-64 xl:h-80" />
        ) : (
          <BannerCarousel />
        )}
      </div>

      {/* Informações do restaurante - Responsivo */}
      <div className="container max-w-5xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 -mt-12 sm:-mt-14 md:-mt-16 mb-4 md:mb-6">
          {/* Logo */}
          <div className="flex-shrink-0 z-10">
            {loading ? (
              <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg" />
            ) : (
              <div className="bg-yellow-400 w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex items-center justify-center border-3 sm:border-4 border-white shadow-md overflow-hidden flex-shrink-0">
                {restaurant?.logo_url ? (
                  <img
                    src={restaurant.logo_url}
                    alt={restaurant?.name || "Logo do restaurante"}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      const target = e.currentTarget;
                      // Default to icon if logo fails to load
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        const svg = document.createElementNS(
                          "http://www.w3.org/2000/svg",
                          "svg"
                        );
                        svg.setAttribute("viewBox", "0 0 24 24");
                        svg.setAttribute("class", "h-12 w-12");
                        svg.setAttribute("fill", "none");
                        svg.setAttribute("stroke", "currentColor");
                        svg.setAttribute("stroke-width", "2");
                        svg.setAttribute("stroke-linecap", "round");
                        svg.setAttribute("stroke-linejoin", "round");

                        const path1 = document.createElementNS(
                          "http://www.w3.org/2000/svg",
                          "path"
                        );
                        path1.setAttribute("d", "M7 11V7a5 5 0 0 1 10 0v4");

                        const path2 = document.createElementNS(
                          "http://www.w3.org/2000/svg",
                          "path"
                        );
                        path2.setAttribute(
                          "d",
                          "M4 11h16a1 1 0 0 1 1 1v.5c0 1.5-1.1 2.77-2.5 3l-.5.1"
                        );

                        const path3 = document.createElementNS(
                          "http://www.w3.org/2000/svg",
                          "path"
                        );
                        path3.setAttribute("d", "M6 18h12");

                        const path4 = document.createElementNS(
                          "http://www.w3.org/2000/svg",
                          "path"
                        );
                        path4.setAttribute("d", "M6 15h12");

                        svg.appendChild(path1);
                        svg.appendChild(path2);
                        svg.appendChild(path3);
                        svg.appendChild(path4);

                        parent.appendChild(svg);
                      }
                    }}
                  />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-12 w-12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    <path d="M4 11h16a1 1 0 0 1 1 1v.5c0 1.5-1.1 2.77-2.5 3l-.5.1" />
                    <path d="M6 18h12" />
                    <path d="M6 15h12" />
                  </svg>
                )}
              </div>
            )}
          </div>

          {/* Detalhes */}
          <div className="flex-1 bg-white p-3 sm:p-4 md:p-5 rounded-lg shadow-sm z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
              <div className="min-w-0 flex-1">
                {loading ? (
                  <>
                    <Skeleton className="h-6 sm:h-8 w-32 sm:w-40 mb-2" />
                    <Skeleton className="h-3 sm:h-4 w-40 sm:w-56" />
                  </>
                ) : (
                  <>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
                      {restaurant?.name || "Carregando..."}
                    </h1>
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                      <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                      <span className="truncate">
                        {restaurant?.address || "Endereço não disponível"}
                      </span>
                    </div>

                    {restaurant?.description && restaurant.description.trim() !== "" && (
                      <div className="mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {restaurant.description}
                      </div>
                    )}

                    {restaurant?.phone && restaurant.phone.trim() !== "" && (
                      <div className="mt-2 flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                        <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                        <span className="truncate">{restaurant.phone}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-end gap-2 justify-start md:justify-end">
                {loading ? (
                  <div className="flex gap-2 flex-wrap">
                    <Skeleton className="h-5 sm:h-6 w-20 sm:w-24" />
                    <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                    <Skeleton className="h-5 sm:h-6 w-14 sm:w-16" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className="text-[10px] sm:text-xs text-muted-foreground leading-none mb-1">
                        Tempo de entrega
                      </span>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap"
                      >
                        <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="hidden sm:inline">{`${getCurrentDeliveryTime().min}-${
                          getCurrentDeliveryTime().max
                        } min`}</span>
                        <span className="sm:hidden">{`${getCurrentDeliveryTime().min}-${
                          getCurrentDeliveryTime().max
                        }m`}</span>
                      </Badge>
                    </div>
                    {restaurant?.delivery_fee !== null && restaurant?.delivery_fee !== undefined ? (
                      <div className="flex flex-col">
                        <span className="text-[10px] sm:text-xs text-muted-foreground leading-none mb-1">
                          Taxa de entrega
                        </span>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap self-end"
                        >
                          <Bike className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-delivery-500 flex-shrink-0" />
                          {restaurant.delivery_fee === 0
                            ? "Grátis"
                            : `R$ ${restaurant.delivery_fee
                                .toFixed(2)
                                .replace(".", ",")}`}
                        </Badge>
                      </div>
                    ) : null}

                    {typeof restaurant?.min_order_value === "number" &&
                    restaurant.min_order_value > 0 ? (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] sm:text-xs text-muted-foreground leading-none mb-1">
                          Pedido mínimo
                        </span>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap"
                        >
                          <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-delivery-500 flex-shrink-0" />
                          R$ {restaurant.min_order_value
                            .toFixed(2)
                            .replace(".", ",")}
                        </Badge>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            <div className="mt-2 sm:mt-3 text-xs sm:text-sm">
              {loading || isLoadingBusinessHours ? (
                <Skeleton className="h-3 sm:h-4 w-28 sm:w-32" />
              ) : (
                <>
                  {isOpenNow() ? (
                    <>
                      <span className="text-emerald-600 font-medium text-xs sm:text-sm">
                        Aberto agora
                      </span>
                      {todayNextClosing && (
                        <span className="text-muted-foreground text-xs sm:text-sm">
                          {" "}
                          · Fecha às {todayNextClosing.close}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-red-600 font-medium text-xs sm:text-sm">
                        Fechado agora
                      </span>
                      {todayNextOpening && (
                        <span className="text-muted-foreground text-xs sm:text-sm">
                          {" "}
                          · Abre às {todayNextOpening.open}
                        </span>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {!loading && !isLoadingBusinessHours && !isOpenNow() && (
              <div className="mt-1 text-[11px] sm:text-xs text-muted-foreground">
                Faça um pedido agendado e escolha o horário de recebe com a empresa aberta
              </div>
            )}

            {/* Redes Sociais - Responsivo */}
            {!loading && <SocialMediaLinks />}
          </div>
        </div>
      </div>
    </div>
  );
}
