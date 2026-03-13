import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialLink {
  platform: string;
  url: string;
}

const SOCIAL_ICONS = {
  instagram: {
    icon: Instagram,
    color: "text-pink-600 hover:text-pink-700 dark:text-pink-500 dark:hover:text-pink-400",
    label: "Instagram",
    bgColor: "hover:bg-pink-50 dark:hover:bg-pink-950"
  },
  facebook: {
    icon: Facebook,
    color: "text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400",
    label: "Facebook",
    bgColor: "hover:bg-blue-50 dark:hover:bg-blue-950"
  },
  youtube: {
    icon: Youtube,
    color: "text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400",
    label: "YouTube",
    bgColor: "hover:bg-red-50 dark:hover:bg-red-950"
  },
};

export function SocialMediaLinks() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        setLoading(true);

        // Buscar restaurante
        const { data: restaurant } = await supabase
          .from("restaurants")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (!restaurant) {
          setLoading(false);
          return;
        }

        // Buscar redes sociais ativas
        const { data, error } = await supabase.rpc("get_active_social_media", {
          p_restaurant_id: restaurant.id,
        });

        if (error) {
          console.error("Erro ao carregar redes sociais:", error);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          setSocialLinks(data);
        }

        setLoading(false);
      } catch (err) {
        console.error("Erro ao buscar redes sociais:", err);
        setLoading(false);
      }
    };

    fetchSocialLinks();
  }, []);

  if (loading || socialLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 sm:gap-3 justify-start md:justify-start mt-3 sm:mt-4 flex-wrap">
      {socialLinks.map((link) => {
        const social = SOCIAL_ICONS[link.platform as keyof typeof SOCIAL_ICONS];
        if (!social) return null;

        const Icon = social.icon;

        return (
          <Button
            key={link.platform}
            variant="outline"
            size="icon"
            className={`h-9 w-9 sm:h-10 sm:w-10 ${social.bgColor} border border-gray-300 dark:border-gray-600 transition-all duration-200`}
            onClick={() => window.open(link.url, "_blank")}
            title={social.label}
            aria-label={`Visitar ${social.label}`}
          >
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${social.color} transition-colors duration-200`} />
          </Button>
        );
      })}
    </div>
  );
}
