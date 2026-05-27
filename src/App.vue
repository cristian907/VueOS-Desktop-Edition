<template>
  <!-- Barra/borde superior interactivo para arrastrar la ventana de Electron -->
  <div class="electron-window-drag-handle" title="Arrastra para mover la ventana"></div>

  <!-- Pantalla de bloqueo mientras no esté autenticado -->
  <LockScreen v-if="!osStore.isAuthenticated" />

  <!-- Entorno de escritorio completo (solo tras autenticación) -->
  <Desktop v-else />
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useKernel } from '@/composables/useKernel';
import { useOSStore } from '@/stores/osStore';
import LockScreen from '@/components/core/LockScreen.vue';
import Desktop from '@/components/core/Desktop.vue';

const kernel = useKernel();
const osStore = useOSStore();

// Conectar al Kernel de Go inmediatamente (telemetría en la LockScreen también)
kernel.connect();

// Sincronizar stats del WebSocket hacia el store de Pinia
watch(
  () => kernel.stats.value,
  (newStats) => {
    if (newStats) osStore.updateStats(newStats);
  },
  { deep: true },
);
</script>

<style scoped>
.electron-window-drag-handle {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 12px;
  background: transparent;
  border-top: 2px solid var(--accent); /* Delicado borde superior color Breeze Blue */
  -webkit-app-region: drag;
  z-index: 999999999;
  pointer-events: auto;
  transition: height 0.2s ease, background-color 0.2s ease;
}

.electron-window-drag-handle:hover {
  height: 18px;
  background-color: rgba(61, 174, 233, 0.25); /* Resalta suavemente al hacer hover */
}
</style>
