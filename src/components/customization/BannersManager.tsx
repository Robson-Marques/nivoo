import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit2, Trash2, GripVertical, Image as ImageIcon, Upload, ExternalLink } from "lucide-react";
import { fileToBase64, validateImageFile } from "@/utils/image-utils";

interface Banner {
  id: string;
  image_url: string;
  link?: string;
  order: number;
  active: boolean;
}

export function BannersManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    image_url: "",
    link: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

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

  // Buscar banners
  const { data: banners = [], refetch } = useQuery({
    queryKey: ["banners", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      if (!restaurantId) return [];

      const { data, error } = await supabase.rpc("get_all_banners", {
        p_restaurant_id: restaurantId,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar banners",
          description: error.message,
        });
        return [];
      }

      return data || [];
    },
  });

  const resetForm = () => {
    setFormData({ image_url: "", link: "" });
    setEditingBanner(null);
  };

  const handleOpenDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        image_url: banner.image_url,
        link: banner.link || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSaveBanner = async () => {
    if (!formData.image_url.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Insira uma URL de imagem válida",
      });
      return;
    }

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
      if (editingBanner) {
        // Atualizar banner
        const { error } = await supabase
          .from("banners")
          .update({
            image_url: formData.image_url.trim(),
            link: formData.link.trim() || null,
          })
          .eq("id", editingBanner.id);

        if (error) throw error;

        toast({
          title: "Banner atualizado",
          description: "O banner foi atualizado com sucesso",
        });
      } else {
        // Criar novo banner
        const nextOrder = banners.length > 0 ? Math.max(...banners.map(b => b.order)) + 1 : 0;

        const { error } = await supabase.from("banners").insert({
          restaurant_id: restaurantId,
          image_url: formData.image_url.trim(),
          link: formData.link.trim() || null,
          order: nextOrder,
          active: true,
        });

        if (error) throw error;

        toast({
          title: "Banner adicionado",
          description: "O novo banner foi adicionado com sucesso",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao salvar banner",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm("Tem certeza que deseja deletar este banner?")) return;

    try {
      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", bannerId);

      if (error) throw error;

      toast({
        title: "Banner deletado",
        description: "O banner foi removido com sucesso",
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  const handleToggleBanner = async (bannerId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("banners")
        .update({ active: !currentActive })
        .eq("id", bannerId);

      if (error) throw error;

      toast({
        title: currentActive ? "Banner desativado" : "Banner ativado",
        description: `O banner foi ${currentActive ? "desativado" : "ativado"} com sucesso`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  // Handler para upload de arquivos
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);

    try {
      // Validar arquivo
      const maxSize = 5; // 5MB para banners
      const error = validateImageFile(file, maxSize);
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no upload",
          description: error,
        });
        return;
      }

      // Converter para base64
      const base64 = await fileToBase64(file);

      // Atualizar estado
      setFormData({ ...formData, image_url: base64 });

      toast({
        title: "Upload concluído",
        description:
          "Imagem carregada com sucesso. Clique em Salvar para confirmar as alterações.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Não foi possível processar o arquivo",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Componente de upload de arquivo
  const FileUploadButton = () => (
    <div>
      <Input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        id="banner-upload"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = ""; // Reset input
        }}
        disabled={isUploading}
      />
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10"
        onClick={() => document.getElementById("banner-upload")?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <Upload className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  // Componente de preview de imagem
  const ImagePreview = ({ url }: { url: string }) => {
    if (!url) return null;

    return (
      <Card className="overflow-hidden mt-2">
        <CardContent className="p-0 relative aspect-[3/1] bg-muted">
          <img
            src={url}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlLW9mZiI+PHBhdGggZD0iTTIuMiAyLjJMOCAxNWwyLTIgNC0xIDggMTAiLz48cGF0aCBkPSJNMTQuOTUgOC02LjExIDYuMTEiLz48Y2lyY2xlIGN4PSI4IiBjeT0iOCIgcj0iMiIvPjxwYXRoIGQ9Ik0yMS45NSAyMS45IDEzIDE1bC0zLjA3IDIuOTkiLz48cGF0aCBkPSJNMiAyLjJMMjEuOCAyMiIvPjwvc3ZnPg==";
              (e.target as HTMLImageElement).classList.add("p-8", "opacity-30");
            }}
          />
          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            onClick={() => {
              if (url.startsWith("data:")) {
                const newWindow = window.open();
                if (newWindow) {
                  newWindow.document.write(`
                    <html>
                      <head>
                        <title>Visualização da Imagem</title>
                        <style>
                          body {
                            margin: 0;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            background: #f1f1f1;
                          }
                          img {
                            max-width: 100%;
                            max-height: 100vh;
                            object-fit: contain;
                          }
                        </style>
                      </head>
                      <body>
                        <img src="${url}" alt="Preview" />
                      </body>
                    </html>
                  `);
                }
              } else {
                window.open(url, "_blank");
              }
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  const isBannerLimitReached = banners.length >= 5;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            {banners.length}/5 banners adicionados
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Os banners serão rotacionados automaticamente na página inicial
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              disabled={isBannerLimitReached}
              className="gap-2 w-full sm:w-auto text-xs sm:text-sm"
              size="sm"
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {isBannerLimitReached ? "Limite atingido" : "Adicionar Banner"}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md sm:max-w-lg md:max-w-2xl w-full">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                {editingBanner ? "Editar Banner" : "Novo Banner"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingBanner
                  ? "Atualize os dados do banner"
                  : "Adicione um novo banner para rotacionar na página inicial"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="image-url" className="text-xs sm:text-sm">URL da Imagem *</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      id="image-url"
                      type="url"
                      placeholder="https://exemplo.com/banner.jpg"
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData({ ...formData, image_url: e.target.value })
                      }
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <FileUploadButton />
                </div>
                <p className="text-xs text-muted-foreground">
                  Recomendado: 1200x400 pixels (JPG, PNG ou WebP)
                </p>
                {formData.image_url && <ImagePreview url={formData.image_url} />}
              </div>

              <div className="space-y-2">
                <Label htmlFor="link" className="text-xs sm:text-sm">URL de Link (opcional)</Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://exemplo.com"
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  className="text-xs sm:text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Se preenchido, o usuário será redirecionado ao clicar no banner
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="text-xs sm:text-sm"
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveBanner}
                  disabled={isSubmitting}
                  className="text-xs sm:text-sm"
                  size="sm"
                >
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {banners.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Banners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <div className="inline-block min-w-full sm:w-full px-6 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8 sm:w-12 text-xs sm:text-sm"></TableHead>
                      <TableHead className="text-xs sm:text-sm">Imagem</TableHead>
                      <TableHead className="text-xs sm:text-sm">Link</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {banners.map((banner) => (
                      <TableRow key={banner.id}>
                        <TableCell className="py-2 sm:py-3 px-1 sm:px-4">
                          <GripVertical className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        </TableCell>
                        <TableCell className="py-2 sm:py-3 px-1 sm:px-4">
                          <div className="w-10 h-6 sm:w-12 sm:h-8 rounded border overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={banner.image_url}
                              alt="Banner"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 50'%3E%3Crect fill='%23f0f0f0' width='100' height='50'/%3E%3C/svg%3E";
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-2 sm:py-3 px-1 sm:px-4 max-w-xs">
                          {banner.link ? (
                            <a
                              href={banner.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline truncate inline-block"
                              title={banner.link}
                            >
                              {banner.link}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 sm:py-3 px-1 sm:px-4">
                          <div
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                              banner.active
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                            onClick={() =>
                              handleToggleBanner(banner.id, banner.active)
                            }
                          >
                            {banner.active ? "Ativo" : "Inativo"}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 sm:py-3 px-1 sm:px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(banner)}
                              className="h-8 w-8 sm:h-9 sm:w-9"
                            >
                              <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteBanner(banner.id)}
                              className="h-8 w-8 sm:h-9 sm:w-9 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6 sm:py-8">
              <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Nenhum banner adicionado ainda
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique no botão acima para adicionar seu primeiro banner
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
