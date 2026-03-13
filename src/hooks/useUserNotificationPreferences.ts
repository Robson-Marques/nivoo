import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationPreferences {
  id: string;
  user_id: string;
  sound_enabled: boolean;
  sound_volume: number;
  notification_type: 'mp3' | 'beep' | 'both';
}

export function useUserNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar preferências do banco
  const loadPreferences = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.log('ℹ️ [PREFS] Usuário não autenticado, pulando carregamento de preferências');
        setLoading(false);
        setPreferences(null);
        return;
      }

      console.log('🔄 [PREFS] Carregando preferências de notificação do usuário:', user.id);

      // Chamar função do Supabase que cria ou obtém as preferências
      const { data, error: fetchError } = await supabase.rpc(
        'get_or_create_notification_preferences',
        { p_user_id: user.id }
      );

      if (fetchError) {
        console.error('❌ [PREFS] Erro ao carregar preferências:', fetchError);
        console.error('❌ [PREFS] Detalhes:', {
          code: fetchError.code,
          message: fetchError.message,
          details: fetchError.details,
        });
        setError(fetchError.message || 'Erro ao carregar preferências');
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const prefs = data[0];
        console.log('✅ [PREFS] Preferências carregadas com sucesso:', {
          sound_enabled: prefs.sound_enabled,
          sound_volume: prefs.sound_volume,
          notification_type: prefs.notification_type,
        });
        setPreferences(prefs);
        setError(null);
      } else {
        console.warn('⚠️  [PREFS] RPC retornou dados vazios');
        setError('Sem dados de preferência');
      }
    } catch (err) {
      console.error('❌ [PREFS] Exceção ao carregar preferências:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Alternar som habilitado/desabilitado
  const toggleSoundEnabled = async (): Promise<boolean> => {
    try {
      if (!user) {
        console.error('❌ [PREFS] Usuário não autenticado');
        setError('Usuário não autenticado');
        return false;
      }

      console.log('🔄 [PREFS] Alternando som para usuário:', user.id);
      setError(null);

      const { data, error: toggleError } = await supabase.rpc(
        'toggle_sound_notifications',
        { p_user_id: user.id }
      );

      // Verificar erro ANTES de processar dados
      if (toggleError) {
        const errorMsg = toggleError.message || 'Erro ao alternar som';
        console.error('❌ [PREFS] Erro ao alternar som:', toggleError);
        console.error('❌ [PREFS] Detalhes:', {
          code: toggleError.code,
          message: toggleError.message,
          details: toggleError.details,
        });
        setError(errorMsg);
        return false;
      }

      // Processar dados SOMENTE se não houver erro
      if (data && data.length > 0) {
        const updatedPrefs = data[0];
        console.log('✅ [PREFS] Som alternado com sucesso:', updatedPrefs.sound_enabled ? '🔊 ATIVADO' : '🔇 DESATIVADO');
        console.log('✅ [PREFS] Dados atualizados:', {
          sound_enabled: updatedPrefs.sound_enabled,
          sound_volume: updatedPrefs.sound_volume,
          notification_type: updatedPrefs.notification_type,
        });
        
        // Atualizar estado SOMENTE após confirmar sucesso
        setPreferences(updatedPrefs);
        setError(null);
        
        return updatedPrefs.sound_enabled;
      } else {
        console.warn('⚠️  [PREFS] RPC retornou dados vazios');
        setError('Nenhum dado retornado do servidor');
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [PREFS] Exceção ao alternar som:', err);
      setError(errorMsg);
      return false;
    }
  };

  // Atualizar volume
  const updateVolume = async (newVolume: number) => {
    try {
      if (!user || !preferences) return false;

      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      
      console.log('🔄 Atualizando volume para:', clampedVolume);

      const { data, error: updateError } = await supabase
        .from('user_notification_preferences')
        .update({ sound_volume: clampedVolume })
        .eq('user_id', user.id)
        .select();

      if (updateError) {
        console.error('❌ Erro ao atualizar volume:', updateError);
        setError(updateError.message);
        return false;
      }

      if (data && data.length > 0) {
        const updatedPrefs = data[0];
        console.log('✅ Volume atualizado para:', updatedPrefs.sound_volume);
        setPreferences(updatedPrefs);
        return true;
      }

      return false;
    } catch (err) {
      console.error('❌ Exceção ao atualizar volume:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    }
  };

  // Carregar preferências quando usuário mudar
  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setLoading(false);
      setPreferences(null);
    }
  }, [user?.id]);

  return {
    preferences,
    loading,
    error,
    toggleSoundEnabled,
    updateVolume,
    isSoundEnabled: preferences?.sound_enabled ?? false,
  };
}
