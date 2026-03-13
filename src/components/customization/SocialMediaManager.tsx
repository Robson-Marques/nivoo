import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Save, Instagram, Facebook, Youtube } from "lucide-react";

interface SocialLink {
  id: string;
  platform: "instagram" | "facebook" | "youtube";
  url?: string;
  active: boolean;
}

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-600" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-600" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "text-red-600" },
];

export function SocialMediaManager() {
  const { toast } = useToast();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    instagram: "",
    facebook: "",
    youtube: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar ID do restaurante
  useEffect(() => {
    const getRestaurantId = async () => {
      const { data } = await supabase
        .from("restaurants")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (data) {
        setRestaurantId(data.id);
      }
    };

    getRestaurantId();
  }, []);

  // Buscar redes sociais
  const { data: socialLinks = [], refetch } = useQuery({
    queryKey: ["social_media", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      if (!restaurantId) return [];

      const { data, error } = await supabase.rpc("get_all_social_media", {
        p_restaurant_id: restaurantId,
      });

      if (error) {
        console.error("Erro ao carregar redes sociais:", error);
        return [];
      }

      // Preencher o formulário com os dados
      const socialData = {
        instagram: "",
        facebook: "",
        youtube: "",
      };

      (data || []).forEach((social: any) => {
        if (social.platform === "instagram") socialData.instagram = social.url || "";
        if (social.platform === "facebook") socialData.facebook = social.url || "";
        if (social.platform === "youtube") socialData.youtube = social.url || "";
      });

      setFormData(socialData);
      return data || [];
    },
  });

  const handleSaveSocialMedia = async () => {
    if (!restaurantId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Restaurante não encontrado",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Para cada rede social, verificar e atualizar ou inserir
      for (const platform of ["instagram", "facebook", "youtube"]) {
        const url = formData[platform as keyof typeof formData];

        // Buscar registro existente
        const { data: existing } = await supabase
          .from("social_media")
          .select("id")
          .eq("restaurant_id", restaurantId)
          .eq("platform", platform)
          .maybeSingle();

        if (existing) {
          // Atualizar
          const { error } = await supabase
            .from("social_media")
            .update({
              url: url ? url.trim() : null,
              active: !!url,
            })
            .eq("id", existing.id);

          if (error) throw error;
        } else {
          // Inserir novo
          const { error } = await supabase.from("social_media").insert({
            restaurant_id: restaurantId,
            platform,
            url: url ? url.trim() : null,
            active: !!url,
          });

          if (error && !error.message.includes("duplicate")) {
            throw error;
          }
        }
      }

      toast({
        title: "Redes sociais atualizadas",
        description: "As redes sociais foram salvas com sucesso",
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao salvar redes sociais",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Redes Sociais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              return (
                <div key={platform.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${platform.color} flex-shrink-0`} />
                    <Label htmlFor={platform.id} className="text-xs sm:text-sm font-medium">
                      {platform.label}
                    </Label>
                  </div>
                  <Input
                    id={platform.id}
                    type="url"
                    placeholder={`https://${platform.id}.com/seu_usuario`}
                    value={
                      formData[platform.id as keyof typeof formData]
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [platform.id]: e.target.value,
                      })
                    }
                    className="text-xs sm:text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData[platform.id as keyof typeof formData]
                      ? "✓ Será exibido na página inicial"
                      : "Deixe em branco para não mostrar"}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 sm:mt-6 flex justify-end">
            <Button
              onClick={handleSaveSocialMedia}
              disabled={isSubmitting}
              className="gap-2 text-xs sm:text-sm w-full sm:w-auto"
              size="sm"
            >
              <Save className="h-4 w-4 flex-shrink-0" />
              {isSubmitting ? "Salvando..." : "Salvar Redes Sociais"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
          <strong>💡 Dica:</strong> Adicione os links das suas redes sociais para
          que apareçam na página inicial. Os usuários poderão clicar nos ícones para
          visitá-las.
        </p>
      </div>
    </div>
  );
}
