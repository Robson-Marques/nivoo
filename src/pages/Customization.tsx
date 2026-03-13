import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagesManager } from "@/components/customization/ImagesManager";
import { BannersManager } from "@/components/customization/BannersManager";
import { SocialMediaManager } from "@/components/customization/SocialMediaManager";
import { TemplatesManager } from "@/components/admin";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fileToBase64, validateImageFile } from "@/utils/image-utils";
import { Upload, Save } from "lucide-react";

const Customization = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string>("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isLoaded) {
    setIsLoaded(true);

    try {
      if (user?.id) {
        supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .maybeSingle()
          .then(({ data }) => {
            const url = (data as any)?.avatar_url;
            if (typeof url === "string") setAvatarUrl(url);
          });
      }
    } catch (_) {
      // ignore
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não encontrado",
      });
      return;
    }

    setIsUploading(true);
    try {
      const error = validateImageFile(file, 2);
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no upload",
          description: error,
        });
        return;
      }

      const base64 = await fileToBase64(file);
      setAvatarUrl(base64);
      toast({
        title: "Upload concluído",
        description: "Imagem carregada. Clique em Salvar para confirmar.",
      });
    } catch (_) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Não foi possível processar o arquivo",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não encontrado",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          avatar_url: avatarUrl.trim() || null,
        },
        { onConflict: "id" }
      );
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada.",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: e?.message || "Não foi possível salvar a foto de perfil",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Customização" />

      <div className="flex-1 p-4 md:p-6 space-y-6">
        <Tabs defaultValue="images" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="images">Imagens</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
            <TabsTrigger value="social">Redes Sociais</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Imagens</CardTitle>
                <CardDescription>
                  Configure URLs para as imagens do seu restaurante
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImagesManager />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Foto de perfil do Admin</CardTitle>
                <CardDescription>
                  Essa imagem aparece no menu do painel, no lugar da letra do avatar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="admin-avatar-upload">Upload da imagem</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="admin-avatar-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                          e.target.value = "";
                        }}
                        disabled={isUploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={isUploading}
                        onClick={() =>
                          document
                            .getElementById("admin-avatar-upload")
                            ?.click()
                        }
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {avatarUrl ? (
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-full overflow-hidden border bg-muted">
                        <img
                          src={avatarUrl}
                          alt="Preview do avatar"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">
                          Preview da foto de perfil
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleSaveAvatar}
                      disabled={isSubmitting || isUploading}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isSubmitting ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banners" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Banners</CardTitle>
                <CardDescription>
                  Adicione até 5 banners que rotacionarão automaticamente na página inicial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BannersManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Redes Sociais</CardTitle>
                <CardDescription>
                  Configure os links das suas redes sociais para exibição na página inicial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SocialMediaManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <TemplatesManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Customization;
