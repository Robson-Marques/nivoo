/**
 * Sistema Simples de Som para Notificações
 * Usa MediaSession API que funciona com autoplay policy
 */

let audioContext: AudioContext | null = null;
let audioInitialized = false;

function createAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

// Tocar um beep simples (sempre funciona se chamado dentro de event listener)
export function playBeep(frequency: number = 1000, duration: number = 100, volume: number = 0.3) {
  try {
    const ctx = createAudioContext();
    
    // Resumir se necessário
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);
    
    osc.start(now);
    osc.stop(now + duration / 1000);
    
    console.log(`🔊 Beep tocado: ${frequency}Hz por ${duration}ms`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao tocar beep:', error);
    return false;
  }
}

function playFallbackBeep() {
  try {
    console.log('🔊 Usando fallback beep...');
    playBeep(1000, 100, 0.3);
  } catch (error) {
    console.error('❌ Erro no fallback:', error);
  }
}

function getAudioElement(): HTMLAudioElement {
  let audioElement = document.getElementById('notification-audio') as HTMLAudioElement;
  
  if (!audioElement) {
    console.warn('⚠️ Audio element não encontrado, criando...');
    audioElement = document.createElement('audio');
    audioElement.id = 'notification-audio';
    audioElement.src = '/audionot/notification.mp3';
    audioElement.volume = 1.0;
    audioElement.preload = 'auto';
    document.body.appendChild(audioElement);
  }
  
  return audioElement;
}

// Inicializer simples: apenas prepara o AudioContext
export function initializeAudioPrimer() {
  if (audioInitialized) return;
  audioInitialized = true;
  
  console.log('🔊 Sistema de áudio inicializado (aguardando primeira interação)');
  
  // Preparar elemento de áudio
  getAudioElement();
}

// Habilitar som: chamado quando usuário clica em um botão "Habilitar Som"
export function enableSound() {
  console.log('✅ Habilitando som...');
  
  try {
    const ctx = createAudioContext();
    
    // Garantir que o contexto é retomado
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        console.log('✅ AudioContext retomado');
      }).catch(e => {
        console.error('⚠️ Erro ao retomar:', e);
      });
    }
    
    // Tentar uma vez com áudio muted para preparar
    const audio = getAudioElement();
    audio.muted = true;
    audio.volume = 1.0;
    audio.currentTime = 0;
    
    const promise = audio.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          console.log('✅ Áudio desbloqueado! Som pronto para notificações');
          audio.pause();
          audio.muted = false;
          audio.currentTime = 0;
          playBeep(1000, 150, 0.2);  // Confirmação
        })
        .catch((err) => {
          console.log('⚠️ Áudio falhou, usando apenas beep:', err.message);
          playBeep(1000, 150, 0.3);
        });
    }
  } catch (error) {
    console.error('❌ Erro ao habilitar som:', error);
    playBeep(1000, 150, 0.3);
  }
}

// Tocar som de notificação
export function playNotificationAudio() {
  try {
    console.log('🔊 === TOCANDO NOTIFICAÇÃO ===');
    
    // 1. Garantir que AudioContext está ativo
    if (audioContext && audioContext.state === 'suspended') {
      console.log('🔄 AudioContext suspenso, retomando...');
      audioContext.resume().then(() => {
        console.log('✅ AudioContext retomado');
      }).catch(e => {
        console.error('⚠️ Erro ao retomar:', e);
      });
    }
    
    const audio = getAudioElement();
    
    // 2. Garantir que está pronto
    audio.muted = false;
    audio.volume = 1.0;
    audio.currentTime = 0;
    
    console.log('🔊 Volume:', audio.volume, 'Muted:', audio.muted, 'Src:', audio.src);
    
    // 3. Tocar
    const promise = audio.play();
    
    if (promise !== undefined) {
      promise
        .then(() => {
          console.log('✅ ÁUDIO DE NOTIFICAÇÃO TOCANDO!');
          // Reforçar com beep em frequência diferente
          setTimeout(() => {
            console.log('🔊 Reforço sonoro (beep)');
            playBeep(800, 100, 0.2);
          }, 100);
        })
        .catch((error: any) => {
          console.warn('⚠️ Áudio HTML5 não funcionou:', error.message);
          console.log('🔊 Usando beep de fallback...');
          // Sempre toca beep como fallback
          playBeep(1000, 200, 0.4);
        });
    } else {
      console.log('✅ Audio.play() chamado (browser legado)');
      playBeep(1000, 200, 0.4);
    }
  } catch (error) {
    console.error('❌ ERRO crítico ao tocar notificação:', error);
    playBeep(1000, 200, 0.4);
  }
}

