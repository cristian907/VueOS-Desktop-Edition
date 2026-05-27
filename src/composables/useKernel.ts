import { ref, onUnmounted } from 'vue';
import type { HardwareStats } from '@/types/os';

const KERNEL_WS_URL = 'ws://127.0.0.1:8080/ws';
const RECONNECT_DELAY_MS = 3000;

/**
 * Composable que gestiona la conexión WebSocket con el Daemon de Go.
 * Mantiene las estadísticas de hardware en una ref reactiva propia.
 * Se reconecta automáticamente si el Kernel se reinicia.
 */
export function useKernel() {
  const stats = ref<HardwareStats>({ cpu_usage: 0, ram_usage: 0 });
  const isConnected = ref(false);

  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function connect(): void {
    // Limpiar cualquier intento de reconexión pendiente
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    socket = new WebSocket(KERNEL_WS_URL);

    socket.onopen = () => {
      isConnected.value = true;
      console.log('[Kernel] Conexión WebSocket establecida con el Daemon.');
    };

    socket.onmessage = (event: MessageEvent) => {
      try {
        const data: HardwareStats = JSON.parse(event.data);
        stats.value = data;
      } catch (err) {
        console.error('[Kernel] Error al parsear mensaje del Daemon:', err);
      }
    };

    socket.onclose = () => {
      isConnected.value = false;
      console.warn('[Kernel] Conexión perdida. Reintentando en', RECONNECT_DELAY_MS, 'ms...');
      scheduleReconnect();
    };

    socket.onerror = (err) => {
      console.error('[Kernel] Error en WebSocket:', err);
      // onclose se dispara después de onerror, la reconexión se delega allí
    };
  }

  function scheduleReconnect(): void {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, RECONNECT_DELAY_MS);
  }

  function disconnect(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (socket) {
      socket.onclose = null; // Evitar reconexión automática al cierre intencional
      socket.close();
      socket = null;
    }
    isConnected.value = false;
  }

  // Limpieza automática al desmontar el componente consumidor
  onUnmounted(() => {
    disconnect();
  });

  return {
    stats,
    isConnected,
    connect,
    disconnect,
  };
}
