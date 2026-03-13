import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import "./BannerCarousel.css";

interface Banner {
  id: string;
  image_url: string;
  link?: string;
}

interface Restaurant {
  id: string;
  banner_url?: string;
}

export function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [fallbackBannerUrl, setFallbackBannerUrl] = useState<string | null>(null);

  const CACHE_KEY = "bannerCarouselCache";

  // Buscar ID do restaurante e banners
  useEffect(() => {
    // Carregar cache imediatamente para não atrasar render
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as {
          banners?: Banner[];
          fallbackBannerUrl?: string | null;
          restaurantId?: string | null;
          ts?: number;
        };

        if (cached?.restaurantId) setRestaurantId(cached.restaurantId);
        if (cached?.fallbackBannerUrl) setFallbackBannerUrl(cached.fallbackBannerUrl);
        if (cached?.banners && cached.banners.length > 0) {
          setBanners(cached.banners);
          setLoading(false);
        }
      }
    } catch (e) {
      // Ignorar cache corrompido
    }

    const fetchBanners = async () => {
      try {
        setLoading(true);

        // Buscar restaurante com banner_url
        const { data: restaurant } = await supabase
          .from("restaurants")
          .select("id, banner_url")
          .limit(1)
          .maybeSingle();

        if (!restaurant) {
          setLoading(false);
          return;
        }

        setRestaurantId(restaurant.id);
        
        // Guardar o banner_url como fallback
        if (restaurant.banner_url) {
          setFallbackBannerUrl(restaurant.banner_url);
        }

        // Buscar banners ativos
        const { data: bannersData, error } = await (supabase as any).rpc(
          "get_active_banners",
          {
            p_restaurant_id: restaurant.id,
          }
        );

        if (error) {
          console.error("Erro ao carregar banners:", error);
          setLoading(false);
          return;
        }

        const normalizedBanners = Array.isArray(bannersData)
          ? (bannersData as Banner[])
          : [];

        if (normalizedBanners.length > 0) {
          setBanners(normalizedBanners);
        }

        // Persistir cache para carregamento rápido na próxima visita
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              banners: normalizedBanners,
              fallbackBannerUrl: restaurant.banner_url ?? null,
              restaurantId: restaurant.id,
              ts: Date.now(),
            })
          );
        } catch (e) {
          // Ignorar falhas de storage
        }

        setLoading(false);
      } catch (err) {
        console.error("Erro ao buscar banners:", err);
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Rotação automática
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Mudar a cada 5 segundos

    return () => clearInterval(interval);
  }, [banners.length]);

  if (loading) {
    return (
      <div className="banner-carousel-container banner-single">
        <div className="w-full h-40 sm:h-48 md:h-56 lg:h-64 xl:h-80 bg-gray-200 animate-pulse" />
      </div>
    );
  }

  // Se não há banners, mostrar o banner_url do restaurante (fallback)
  if (banners.length === 0) {
    if (!fallbackBannerUrl) {
      return null;
    }

    return (
      <div className="banner-carousel-container banner-single">
        <img
          src={fallbackBannerUrl}
          alt="Banner do restaurante"
          className="banner-image"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "/lovable-uploads/8a37f084-d95b-43c3-95c1-387e15d14916.png";
          }}
        />
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handleBannerClick = () => {
    if (currentBanner.link) {
      window.open(currentBanner.link, "_blank");
    }
  };

  // Se houver apenas um banner, mostrar sem controles
  if (banners.length === 1) {
    return (
      <div className="banner-carousel-container banner-single">
        <img
          src={banners[0].image_url}
          alt="Banner"
          className={`banner-image ${
            banners[0].link ? "banner-clickable" : ""
          }`}
          onClick={handleBannerClick}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "/lovable-uploads/8a37f084-d95b-43c3-95c1-387e15d14916.png";
          }}
        />
      </div>
    );
  }

  // Com múltiplos banners, mostrar com controles
  return (
    <div className="banner-carousel-container banner-multi">
      <div className="banner-slide-container">
        <img
          src={currentBanner.image_url}
          alt={`Banner ${currentIndex + 1}`}
          className={`banner-image banner-fade-transition ${
            currentBanner.link ? "banner-clickable" : ""
          }`}
          onClick={handleBannerClick}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "/lovable-uploads/8a37f084-d95b-43c3-95c1-387e15d14916.png";
          }}
        />

        {/* Controles de navegação - OCULTOS (mantém funcionalidade via indicadores) */}
        <div 
          className="banner-controls-container sr-only"
          role="navigation"
          aria-label="Controles do carrossel de banners"
        >
          <button
            onClick={handlePrev}
            aria-label="Banner anterior"
            style={{ display: 'none' }}
          />
          <button
            onClick={handleNext}
            aria-label="Próximo banner"
            style={{ display: 'none' }}
          />
        </div>

        {/* Indicadores de página */}
        <div className="banner-indicators-container">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`banner-indicator ${
                index === currentIndex ? "banner-indicator-active" : ""
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
