import React, { useState, useEffect } from "react";
import { Bell, Search, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/use-notifications";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useUserNotificationPreferences } from "@/hooks/useUserNotificationPreferences";
import { enableSoundNotifications, disableSoundNotifications } from "@/utils/audio-system";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const navigate = useNavigate();
  const { preferences, toggleSoundEnabled, loading: prefsLoading } = useUserNotificationPreferences();
  const { notifications, unreadCount, markAsRead, acceptOrder } = useNotifications({
    soundEnabled: preferences?.sound_enabled,
    soundVolume: preferences?.sound_volume,
  });
  const [isTogglingSound, setIsTogglingSound] = useState(false);

  const handleNotificationClick = async (notificationId: string) => {
    // Aceitar o pedido automaticamente
    const accepted = await acceptOrder(notificationId);
    
    if (accepted) {
      // Marcar como lido (remove da lista de notificações)
      markAsRead(notificationId);
      
      // Redirecionar para a página de pedidos
      navigate('/orders');
    }
  };

  const handleToggleSound = async () => {
    if (isTogglingSound) return; // Evitar múltiplos cliques
    
    setIsTogglingSound(true);
    try {
      console.log('🔊 [HEADER] Alternando notificação sonora...');
      
      // Aguardar resultado do toggle no banco de dados
      const newSoundState = await toggleSoundEnabled();
      
      if (newSoundState === true) {
        // Som foi ATIVADO
        console.log('✅ [HEADER] Notificação sonora ATIVADA no banco');
        const enabled = await enableSoundNotifications();
        if (enabled) {
          console.log('✅ [HEADER] Áudio DESBLOQUEADO com sucesso');
        } else {
          console.warn('⚠️  [HEADER] Áudio não foi habilitado, mas preferência foi salva');
        }
      } else if (newSoundState === false) {
        // Som foi DESATIVADO
        console.log('✅ [HEADER] Notificação sonora DESATIVADA no banco');
        disableSoundNotifications();
        console.log('✅ [HEADER] Áudio DESABILITADO');
      } else {
        console.error('❌ [HEADER] Erro ao alternar - resultado inesperado:', newSoundState);
      }
    } catch (error) {
      console.error('❌ [HEADER] Erro ao alternar som:', error);
    } finally {
      setIsTogglingSound(false);
    }
  };

  if (prefsLoading) {
    return (
      <div className="border-b">
        <div className="flex h-16 items-center px-4 md:px-6">
          <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4 md:px-6">
        <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle />
          
          {/* Toggle de Notificação Sonora */}
          <Button
            variant={preferences?.sound_enabled ? "default" : "outline"}
            size="icon"
            onClick={handleToggleSound}
            disabled={isTogglingSound}
            title={
              preferences?.sound_enabled
                ? "Desativar notificação sonora"
                : "Ativar notificação sonora"
            }
            className={preferences?.sound_enabled ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {preferences?.sound_enabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <DropdownMenuItem disabled>
                  Nenhuma notificação
                </DropdownMenuItem>
              ) : (
                <>
                  {notifications.map((notification) => (
                    <div key={notification.id}>
                      <DropdownMenuItem
                        className="flex items-start gap-2 cursor-pointer"
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {notification.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {notification.description}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {notification.time}
                          </div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </div>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
