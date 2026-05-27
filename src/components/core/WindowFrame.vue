<template>
  <div
    v-show="!window.isMinimized"
    class="window-frame"
    :style="windowStyles"
    @mousedown="handleFocus"
  >
    <!-- Barra de Título (Breeze Window Decoration) -->
    <div class="title-bar" @mousedown="startDrag">
      <div class="title-text">{{ window.title }}</div>
      
      <!-- Controles de Ventana (estilo Breeze: derecha) -->
      <div class="window-controls" @mousedown.stop>
        <button class="ctrl-btn btn-minimize" @click.stop="handleMinimize" title="Minimizar">
          <svg viewBox="0 0 18 18" class="ctrl-svg"><line x1="4" y1="13" x2="14" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
        <button class="ctrl-btn btn-maximize" @click.stop="handleMaximize" title="Maximizar">
          <svg viewBox="0 0 18 18" class="ctrl-svg"><rect x="4" y="4" width="10" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>
        </button>
        <button class="ctrl-btn btn-close" @click.stop="handleClose" title="Cerrar">
          <svg viewBox="0 0 18 18" class="ctrl-svg"><line x1="5" y1="5" x2="13" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="13" y1="5" x2="5" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>

    <!-- Contenido de la Aplicación (Slot) -->
    <div class="window-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useOSStore } from '@/stores/osStore';
import type { WindowProcess } from '@/types/os';
import { useWindowDrag } from '@/composables/useWindowDrag';

const props = defineProps<{
  window: WindowProcess;
}>();

const osStore = useOSStore();
const { startDrag } = useWindowDrag(props.window);

// Estilos dinámicos para posición y dimensiones absolutas
const windowStyles = computed(() => {
  // Si está maximizada, ocupa el 100% de la pantalla
  if (props.window.isMaximized) {
    return {
      top: '0px',
      left: '0px',
      width: '100%',
      height: '100%',
      zIndex: props.window.zIndex,
      borderRadius: '0',
    };
  }

  return {
    top: `${props.window.position.y}px`,
    left: `${props.window.position.x}px`,
    width: `${props.window.dimensions.width}px`,
    height: `${props.window.dimensions.height}px`,
    zIndex: props.window.zIndex,
  };
});

// Traer la ventana al frente
function handleFocus() {
  osStore.focusWindow(props.window.id);
}

// Controladores de botones
function handleMinimize() {
  osStore.minimizeWindow(props.window.id);
}

function handleMaximize() {
  osStore.toggleMaximize(props.window.id);
}

function handleClose() {
  osStore.closeWindow(props.window.id);
}
</script>

<style scoped>
.window-frame {
  position: absolute;
  display: flex;
  flex-direction: column;
  
  /* Estilo Breeze: fondo sólido, sin glassmorphism */
  background: var(--bg-secondary);
  
  /* Bordes y Sombras Breeze */
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  box-shadow: var(--shadow-window);
  
  /* Transiciones suaves para maximizar/restaurar */
  transition: width var(--transition-normal), height var(--transition-normal), 
              top var(--transition-normal), left var(--transition-normal),
              border-radius var(--transition-normal);
  overflow: hidden;
}

/* Indicador visual sutil de la ventana con foco */
.window-frame:focus-within {
  border-color: var(--accent);
}

.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 36px;
  background: var(--bg-titlebar);
  border-bottom: 1px solid var(--border-color);
  padding: 0 8px 0 14px;
  
  -webkit-app-region: no-drag;
  user-select: none;
  flex-shrink: 0;
}

.title-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 12px;
}

.window-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  -webkit-app-region: no-drag;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  transition: all var(--transition-fast);
  outline: none;
}

.ctrl-svg {
  width: 16px;
  height: 16px;
}

.ctrl-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Botón de cerrar — acento rojo Breeze al hover */
.btn-close:hover {
  background: var(--danger);
  color: #ffffff;
}

.window-content {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: var(--bg-primary);
}
</style>
