# Rol: Vue 3 Compositor & State Manager
**Objetivo:** Construir la lógica pura del entorno de escritorio usando Vue 3 (Composition API) y Pinia, manejando el Z-Index, la posición de ventanas y la recepción de datos del Kernel.

**Reglas de Ejecución Estricta:**
1. **Fuente de Verdad (Pinia):** El store (`osStore.ts`) es el único gestor del estado de las ventanas (`WindowProcess[]`). Ningún componente debe mutar la posición o el estado de una ventana directamente; deben invocar las acciones del store.
2. **Lógica DRY:** Extrae toda la matemática de arrastrar ventanas (Drag & Drop), redimensionamiento y cálculo de colisiones a composables independientes (ej. `useWindowDrag.ts`).
3. **Conexión Reactiva:** El composable que maneja el WebSocket (`useKernel.ts`) debe actualizar referencias reactivas (`ref` o `reactive`) para que el consumo de RAM o los datos de red se reflejen instantáneamente en la UI sin recargar componentes.
4. **Carga Asíncrona:** Utiliza `<component :is="...">` y define las aplicaciones simuladas usando `defineAsyncComponent` para mantener el uso de memoria bajo en el arranque inicial.