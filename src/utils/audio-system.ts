/**
 * SISTEMA SIMPLIFICADO E FUNCIONAL DE ÁUDIO PARA NOTIFICAÇÕES
 * Foco: Tocar som quando há notificação + respeitar preferências
 */

// ============================================================
// CONSTANTS
// ============================================================

const AUDIO_ELEMENT_ID = 'system-notification-audio';
const NOTIFICATION_SOUND_URL = '/audionot/notification.mp3';

// ============================================================
// STATE MANAGEMENT
// ============================================================

let audioElement: HTMLAudioElement | null = null;
let isAudioUnlocked = false;
let notificationIntervalId: NodeJS.Timeout | null = null; // 🔁 Para controlar repetição
let pendingPlayRequest: {
  soundEnabled?: boolean;
  volume: number;
} | null = null;

/**
 * Garante que o elemento de áudio existe no DOM
 */
function ensureAudioElement(): HTMLAudioElement {
  if (audioElement) {
    return audioElement;
  }

  console.log('🎵 [AUDIO] Criando elemento de áudio...');

  audioElement = document.createElement('audio');
  audioElement.id = AUDIO_ELEMENT_ID;
  audioElement.src = NOTIFICATION_SOUND_URL;
  audioElement.preload = 'auto';
  audioElement.volume = 1.0;
  audioElement.loop = false; // ❌ SEM LOOP - Toca UMA VEZ

  document.body.appendChild(audioElement);
  console.log('✅ [AUDIO] Elemento de áudio criado');

  // Event listeners
  audioElement.addEventListener('play', () => {
    console.log('▶️  [AUDIO] play event disparado');
  });

  audioElement.addEventListener('playing', () => {
    console.log('▶️  [AUDIO] ÁUDIO TOCANDO!');
  });

  audioElement.addEventListener('pause', () => {
    console.log('⏸️  [AUDIO] pause event disparado');
  });

  audioElement.addEventListener('ended', () => {
    console.log('🛑 [AUDIO] Áudio terminou');
  });

  audioElement.addEventListener('error', (event: Event) => {
    const audio = event.target as HTMLAudioElement;
    console.error('❌ [AUDIO] Erro ao tocar:', audio.error?.message);
  });

  return audioElement;
}

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Inicializa o sistema de áudio
 * Registra listeners para desbloquear autoplay
 */
export function initializeAudioSystem(): void {
  console.log('🎵 [AUDIO] ========================================');
  console.log('🎵 [AUDIO] Inicializando Sistema de Áudio');
  console.log('🎵 [AUDIO] ========================================');

  ensureAudioElement();

  // Registrar listener para desbloquear autoplay com primeira interação
  const unlockAudio = () => {
    if (isAudioUnlocked) return;

    console.log('🔓 [AUDIO] Primeira interação detectada! Desbloqueando autoplay...');

    // ✅ Simplesmente marcar como desbloqueado
    // A primeira interação do usuário é suficiente para o navegador permitir playback
    isAudioUnlocked = true;
    console.log('✅ [AUDIO] Autoplay DESBLOQUEADO!');
    
    // 🔊 SE HÁ PEDIDO PENDENTE, TOCAR AGORA
    if (pendingPlayRequest) {
      console.log('🎵 [AUDIO] Tocando som pendente agora que autoplay foi desbloqueado...');
      const pending = pendingPlayRequest;
      pendingPlayRequest = null;
      
      // Pequeno delay para garantir que o DOM está pronto
      setTimeout(() => {
        playNotificationSound(pending.soundEnabled, pending.volume).catch(err => {
          console.error('❌ [AUDIO] Erro ao tocar som pendente:', err);
        });
      }, 50);
    }
  };

  // Listeners em diferentes eventos para máxima compatibilidade
  ['click', 'touchstart', 'keydown', 'mousemove'].forEach((event) => {
    document.addEventListener(event, unlockAudio, { once: true });
  });

  console.log('✅ [AUDIO] Sistema pronto!');
}

// ============================================================
// MAIN PLAYBACK FUNCTION
// ============================================================

/**
 * Toca o som de notificação
 * 
 * Se soundEnabled for undefined, tenta buscar do banco
 * Se autoplay estiver bloqueado, armazena o pedido e toca assim que desbloqueado
 * 
 * @param soundEnabled - Se false, não toca. Se undefined, busca do banco
 * @param volume - Volume de 0 a 1 (padrão 1.0)
 * @returns true se começou a tocar, false caso contrário
 */
export async function playNotificationSound(
  soundEnabled?: boolean,
  volume: number = 1.0,
): Promise<boolean> {
  // LOG IMEDIATO - GARANTIR QUE VEMOS ISTO
  console.log('🎵 [AUDIO] ========================================');
  console.log('🎵 [AUDIO] TOCANDO NOTIFICAÇÃO SONORA');
  console.log('🎵 [AUDIO] ========================================');
  
  try {
    console.log(`🎵 [AUDIO] Parâmetros: soundEnabled=${soundEnabled}, volume=${volume}`);
    console.log(`🎵 [AUDIO] Autoplay Desbloqueado: ${isAudioUnlocked}`);

    // ⏹️ PAUSAR QUALQUER SOM ANTERIOR ANTES DE TOCAR NOVO
    const audio = ensureAudioElement();
    if (!audio.paused) {
      console.log('⏹️  [AUDIO] Parando som anterior...');
      audio.pause();
      audio.currentTime = 0;
    }

    // VERIFICAÇÃO 1: Som habilitado?
    // Regra: só toca se o caller passar explicitamente true
    const finalSoundEnabled = soundEnabled === true;
    if (!finalSoundEnabled) {
      console.log('🔇 [AUDIO] Som DESABILITADO, não tocando');
      return false;
    }

    // VERIFICAÇÃO 2: Autoplay desbloqueado?
    if (!isAudioUnlocked) {
      console.warn('⚠️  [AUDIO] Autoplay bloqueado - som será tocado assim que usuário interagir com a página');
      // Armazenar pedido para tocar depois
      pendingPlayRequest = { soundEnabled: finalSoundEnabled, volume };
      return false;
    }

    // CONFIGURAÇÃO: Volume
    const clampedVolume = Math.max(0, Math.min(1, volume));
    audio.volume = clampedVolume;

    audio.currentTime = 0;
    console.log('🔄 [AUDIO] currentTime resetado para 0');

    // TOCAR
    console.log('▶️  [AUDIO] Chamando audio.play()...');
    const playPromise = audio.play();

    if (playPromise === undefined) {
      console.warn('⚠️  [AUDIO] Browser legado (sem Promise)');
      return true;
    }

    return await playPromise
      .then(() => {
        console.log('✅ [AUDIO] SOM TOCANDO COM SUCESSO!');
        
        // 🔁 CONFIGURAR REPETIÇÃO A CADA 3 SEGUNDOS
        console.log('🔁 [AUDIO] Configurando repetição automática...');
        
        // Limpar intervalo anterior, se houver
        if (notificationIntervalId) {
          clearInterval(notificationIntervalId);
          console.log('🧹 [AUDIO] Intervalo anterior cancelado');
        }
        
        // Definir novo intervalo para tocar novamente a cada 3 segundos
        notificationIntervalId = setInterval(() => {
          if (audio && audio.paused) {
            console.log('🔄 [AUDIO] Repetindo som de notificação...');
            audio.currentTime = 0;
            audio.play().catch((err) => {
              console.error('❌ [AUDIO] Erro ao repetir som:', err.message);
            });
          }
        }, 3000); // 3 segundos
        
        console.log('✅ [AUDIO] Som repetirá a cada 3 segundos até confirmação');
        return true;
      })
      .catch((error) => {
        console.error('❌ [AUDIO] Erro ao tocar:', {
          name: error.name,
          message: error.message,
        });

        if (error.name === 'NotAllowedError') {
          console.error('ℹ️  [AUDIO] Autoplay bloqueado pelo navegador');
          console.error('ℹ️  [AUDIO] Solução: Clique em algum lugar da página ou ative o som');
        }

        return false;
      });
  } catch (error) {
    console.error('❌ [AUDIO] EXCEÇÃO ao tocar som:', error);
    return false;
  }
}

/**
 * Para o som de notificação (chamado quando admin confirma/aceita o pedido)
 */
export function stopNotificationSound(): void {
  try {
    // 🧹 LIMPAR INTERVALO DE REPETIÇÃO
    if (notificationIntervalId) {
      console.log('🧹 [AUDIO] Limpando intervalo de repetição...');
      clearInterval(notificationIntervalId);
      notificationIntervalId = null;
      console.log('✅ [AUDIO] Intervalo cancelado');
    }
    
    // ⏹️ PAUSAR O ÁUDIO
    if (audioElement && !audioElement.paused) {
      console.log('⏹️  [AUDIO] ========================================');
      console.log('⏹️  [AUDIO] PARANDO SOM DE NOTIFICAÇÃO');
      console.log('⏹️  [AUDIO] ========================================');
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.loop = false;
      console.log('✅ [AUDIO] Som PARADO COM SUCESSO');
    } else if (audioElement) {
      console.log('ℹ️  [AUDIO] Áudio já estava pausado');
    }
  } catch (error) {
    console.error('❌ [AUDIO] Erro ao parar som:', error);
  }
}

/**
 * Define o volume (0 a 1)
 */
export function setVolume(volume: number): void {
  const clampedVolume = Math.max(0, Math.min(1, volume));

  if (audioElement) {
    audioElement.volume = clampedVolume;
  }

  console.log(`🔊 [AUDIO] Volume definido para ${Math.round(clampedVolume * 100)}%`);
}

/**
 * Retorna o volume atual
 */
export function getVolume(): number {
  return audioElement?.volume ?? 1.0;
}

// ============================================================
// ENABLE/DISABLE FUNCTIONS
// ============================================================

/**
 * Habilita som de notificações (chamado quando usuário clica no botão)
 */
export async function enableSoundNotifications(): Promise<boolean> {
  try {
    console.log('🎵 [AUDIO] Habilitando sons (interação do usuário)...');

    const audio = ensureAudioElement();
    audio.volume = 1.0;
    audio.muted = true;
    audio.currentTime = 0;

    const playPromise = audio.play();

    if (playPromise === undefined) {
      audio.muted = false;
      isAudioUnlocked = true;
      console.log('✅ [AUDIO] Som HABILITADO (browser legado)');
      return true;
    }

    return await playPromise
      .then(() => {
        console.log('✅ [AUDIO] Som HABILITADO!');
        audio.pause();
        audio.muted = false;
        audio.currentTime = 0;
        isAudioUnlocked = true;
        return true;
      })
      .catch((error) => {
        console.error('❌ [AUDIO] Erro ao habilitar:', error.message);
        return false;
      });
  } catch (error) {
    console.error('❌ [AUDIO] Exceção ao habilitar:', error);
    return false;
  }
}

/**
 * Desabilita som de notificações
 */
export function disableSoundNotifications(): void {
  console.log('🔇 [AUDIO] ========================================');
  console.log('🔇 [AUDIO] DESABILITANDO SOM DE NOTIFICAÇÕES');
  console.log('🔇 [AUDIO] ========================================');

  // Evitar tocar som atrasado quando autoplay destravar
  pendingPlayRequest = null;
  
  // Limpar intervalo de repetição
  if (notificationIntervalId) {
    console.log('🧹 [AUDIO] Limpando intervalo de repetição...');
    clearInterval(notificationIntervalId);
    notificationIntervalId = null;
  }
  
  // Parar o áudio
  if (audioElement && !audioElement.paused) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }
  
  console.log('✅ [AUDIO] Som DESABILITADO');
}

// ============================================================
// INFO & DEBUG
// ============================================================

/**
 * Retorna informações de debug do sistema
 */
export function getAudioSystemInfo() {
  return {
    elementExists: audioElement !== null,
    isAudioUnlocked: isAudioUnlocked,
    sourceUrl: NOTIFICATION_SOUND_URL,
    elementSrc: audioElement?.src,
    elementVolume: audioElement?.volume,
    elementMuted: audioElement?.muted,
    elementPaused: audioElement?.paused,
  };
}

/**
 * Log detalhado do sistema
 */
export function logAudioSystemStatus(): void {
  const info = getAudioSystemInfo();
  console.log('🎵 [AUDIO] ========================================');
  console.log('🎵 [AUDIO] STATUS DO SISTEMA');
  console.log('🎵 [AUDIO] ========================================');
  console.log(info);
  console.log('🎵 [AUDIO] ========================================');
}
