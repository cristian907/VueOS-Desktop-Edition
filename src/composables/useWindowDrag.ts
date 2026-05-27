import { useOSStore } from '@/stores/osStore';
import type { WindowProcess } from '@/types/os';

/**
 * Composable que gestiona el comportamiento de arrastre (Drag & Drop)
 * de ventanas del sistema operativo emulado, actualizando sus coordenadas de forma fluida.
 */
export function useWindowDrag(windowProcess: WindowProcess) {
  const osStore = useOSStore();

  /**
   * Inicializa la captura del mouse en la barra de título.
   * Calcula el desfase inicial para evitar saltos.
   */
  function startDrag(event: MouseEvent) {
    // Si está maximizada, no se procesa el arrastre
    if (windowProcess.isMaximized) return;

    // Solo se permite arrastre con el botón izquierdo
    if (event.button !== 0) return;

    event.preventDefault();

    // Traer la ventana al frente
    osStore.focusWindow(windowProcess.id);

    // Coordenadas iniciales del cursor y origen de la ventana
    const startX = event.clientX;
    const startY = event.clientY;
    const startPosX = windowProcess.position.x;
    const startPosY = windowProcess.position.y;

    /**
     * Manejador para el movimiento del ratón que calcula la nueva posición
     * de la ventana en base al delta de desplazamiento.
     */
    function onMouseMove(moveEvent: MouseEvent) {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newX = startPosX + deltaX;
      const newY = startPosY + deltaY;

      // Actualizar coordenadas en el store
      osStore.updateWindowPosition(windowProcess.id, newX, newY);
    }

    /**
     * Limpia los listeners de la ventana global al soltar el mouse.
     */
    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    // Registrar escuchas globales en window para capturar movimiento libre
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  return {
    startDrag,
  };
}
