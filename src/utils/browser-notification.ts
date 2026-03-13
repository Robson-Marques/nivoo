/**
 * Gerencia notificações do navegador (Notification API)
 * Pede permissão ao usuário e mostra notificações do sistema
 */

/**
 * Verifica se o navegador suporta Notification API
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Retorna o status atual de permissão de notificações
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Pede permissão para enviar notificações
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('⚠️ Navegador não suporta Notification API');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('📢 Permissão de notificação:', permission);
  return permission;
}

/**
 * Mostra uma notificação do sistema
 */
export function showBrowserNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!isNotificationSupported()) {
    console.warn('⚠️ Notificações não suportadas');
    return null;
  }

  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    console.warn('⚠️ Permissão de notificação negada. Status:', permission);
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: '/logo.png', // Adicion se tiver logo
      badge: '/logo.png',
      ...options,
    });

    console.log('✅ Notificação enviada:', title);

    // Auto-fechar após 5 segundos se não for clicada
    notification.addEventListener('show', () => {
      setTimeout(() => {
        notification.close();
      }, 5000);
    });

    return notification;
  } catch (error) {
    console.error('❌ Erro ao mostrar notificação:', error);
    return null;
  }
}

/**
 * Mostra notificação de novo pedido
 */
export function notifyNewOrder(orderNumber: string, customerName: string): Notification | null {
  return showBrowserNotification(`🎉 Novo Pedido Recebido`, {
    body: `Pedido #${orderNumber} - Cliente: ${customerName}`,
    tag: `order-${orderNumber}`,
    requireInteraction: false, // Fechar automaticamente
  });
}

/**
 * Inicializa notificações - pede permissão automaticamente se não foi pedida
 */
export function initializeNotifications(): void {
  if (!isNotificationSupported()) {
    console.warn('⚠️ Notificações do navegador não suportadas');
    return;
  }

  const permission = getNotificationPermission();
  
  if (permission === 'default') {
    console.log('📢 Solicitando permissão de notificações...');
    requestNotificationPermission();
  } else if (permission === 'granted') {
    console.log('✅ Notificações já autorizadas');
  } else {
    console.log('⚠️ Notificações bloqueadas pelo usuário');
  }
}
