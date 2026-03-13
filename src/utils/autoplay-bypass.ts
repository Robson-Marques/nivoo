/**
 * Helper para contornar Autoplay Restrictions (Chrome 88+)
 * 
 * Navegadores modernos bloqueiam audio.play() sem interação do usuário.
 * Esta função "primes" o navegador quando o usuário interage qualquer coisa.
 */

export function setupAutopplayBypassOnFirstInteraction() {
  let primed = false;

  function primeAudio() {
    if (primed) return;
    primed = true;

    console.log('🔓 [AUTOPLAY] Usuário interagiu - Preparando áudio para autoplay...');

    // Criar um element áudio "dummy" e tocar/pausar para "prime" o navegador
    const primeAudio = new Audio();
    primeAudio.src = '/audionot/notification.mp3';
    primeAudio.volume = 0; // Silencioso

    primeAudio
      .play()
      .then(() => {
        console.log('✅ [AUTOPLAY] Navegador preparado - áudio pode tocar sem interação agora');
        primeAudio.pause();
        primeAudio.currentTime = 0;
      })
      .catch((err) => {
        console.warn('⚠️ [AUTOPLAY] Não conseguiu preparar (pode estar ok):', err.message);
      });
  }

  // Listeners para primar on first interaction
  const events = ['click', 'touch', 'keydown'];

  events.forEach((event) => {
    document.addEventListener(event, primeAudio, { once: true });
  });

  console.log('🔓 [AUTOPLAY] Escutando primeira interação do usuário...');

  return () => {
    // Cleanup se necessário
    events.forEach((event) => {
      document.removeEventListener(event, primeAudio);
    });
  };
}

/**
 * Alternativa simples: Primar áudio imediatamente após qualquer ação do usuário
 * Use isso se setupAutopplayBypassOnFirstInteraction não funcionar
 */
export function primerAudioOnDemand() {
  console.log('🔓 [AUTOPLAY] Função de primer disponível');

  return async function primeNow() {
    try {
      console.log('🔓 [AUTOPLAY] Primando agora...');
      const audio = new Audio('/audionot/notification.mp3');
      audio.volume = 0;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      console.log('✅ [AUTOPLAY] Sucesso! Áudio pronto para tocar com autoplay');
      return true;
    } catch (err) {
      console.error('❌ [AUTOPLAY] Falhou:', err);
      return false;
    }
  };
}
