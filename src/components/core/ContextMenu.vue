<template>
  <div
    v-if="osStore.contextMenu.isOpen && osStore.contextMenu.app"
    ref="menuRef"
    class="breeze-context-menu"
    :style="menuStyle"
    @click.stop
  >
    <!-- MODO 1: ACCESOS DIRECTOS DEL ESCRITORIO -->
    <template v-if="osStore.contextMenu.type === 'shortcut'">
      <button type="button" class="menu-item" @click="handleLaunch">
        <PlayIcon class="item-icon" />
        <span>Abrir aplicación</span>
      </button>

      <div class="menu-divider"></div>

      <button type="button" class="menu-item menu-item-danger" @click="handleRemoveShortcut">
        <TrashIcon class="item-icon" />
        <span>Eliminar del Escritorio</span>
      </button>
    </template>

    <!-- MODO 2: LANZADOR KICKOFF / DOCK PANEL -->
    <template v-else>
      <!-- Opción 1: Abrir / Lanzar Ventana -->
      <button type="button" class="menu-item" @click="handleLaunch">
        <PlayIcon class="item-icon" />
        <span>Abrir aplicación</span>
      </button>

      <div class="menu-divider"></div>

      <!-- Opción 2: Anclar / Añadir al Dock -->
      <button
        v-if="!configStore.isAppPinned(osStore.contextMenu.app.id)"
        type="button"
        class="menu-item"
        @click="handlePin"
      >
        <PinIcon class="item-icon" />
        <span>Añadir al Panel</span>
      </button>

      <!-- Opción 3: Desanclar / Quitar del Dock -->
      <button
        v-else
        type="button"
        class="menu-item menu-item-danger"
        @click="handleUnpin"
      >
        <PinOffIcon class="item-icon" />
        <span>Quitar del Panel</span>
      </button>

      <div class="menu-divider"></div>

      <!-- Opción 4: Crear acceso directo en el escritorio -->
      <button
        v-if="!hasDesktopShortcut(osStore.contextMenu.app.id)"
        type="button"
        class="menu-item"
        @click="handleCreateShortcut"
      >
        <MonitorIcon class="item-icon" />
        <span>Añadir al Escritorio</span>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useOSStore } from '@/stores/osStore';
import { useConfigStore } from '@/stores/configStore';
import {
  Play as PlayIcon,
  Pin as PinIcon,
  PinOff as PinOffIcon,
  Monitor as MonitorIcon,
  Trash as TrashIcon
} from 'lucide-vue-next';

const osStore = useOSStore();
const configStore = useConfigStore();
const menuRef = ref<HTMLElement | null>(null);

// Coordenadas calculadas y corregidas para evitar desbordamiento del viewport (Edge Collision Detection)
const adjustedX = ref(0);
const adjustedY = ref(0);

// Watcher para recalcular la posición óptima del menú cuando se abre en los límites de la pantalla
watch(
  () => osStore.contextMenu.isOpen,
  async (isOpen) => {
    if (isOpen) {
      await nextTick();
      if (!menuRef.value) return;

      const rect = menuRef.value.getBoundingClientRect();
      const menuWidth = rect.width || 180;
      const menuHeight = rect.height || 120;
      
      const clickX = osStore.contextMenu.x;
      const clickY = osStore.contextMenu.y;

      // Colisión derecha: si se desborda, lo empujamos a la izquierda del cursor
      if (clickX + menuWidth > window.innerWidth) {
        adjustedX.value = clickX - menuWidth;
      } else {
        adjustedX.value = clickX;
      }

      // Colisión inferior (Panel): si se desborda, lo empujamos hacia arriba del cursor
      if (clickY + menuHeight > window.innerHeight) {
        adjustedY.value = clickY - menuHeight;
      } else {
        adjustedY.value = clickY;
      }
    }
  }
);

const menuStyle = computed(() => {
  return {
    left: `${adjustedX.value}px`,
    top: `${adjustedY.value}px`
  };
});

function hasDesktopShortcut(appId: string): boolean {
  return configStore.desktopShortcuts.some(s => s.appId === appId);
}

// Acciones del Menú Contextual
function handleLaunch() {
  const app = osStore.contextMenu.app;
  if (app) {
    const runningApp = osStore.windows.find((w) => w.appName === app.name);
    if (runningApp) {
      osStore.focusWindow(runningApp.id);
    } else {
      osStore.openWindow(app);
    }
    osStore.isLauncherOpen = false;
  }
  osStore.closeContextMenu();
}

function handlePin() {
  const app = osStore.contextMenu.app;
  if (app) {
    configStore.pinApp(app.id);
  }
  osStore.closeContextMenu();
}

function handleUnpin() {
  const app = osStore.contextMenu.app;
  if (app) {
    configStore.unpinApp(app.id);
  }
  osStore.closeContextMenu();
}

function handleCreateShortcut() {
  const app = osStore.contextMenu.app;
  if (app) {
    configStore.createDesktopShortcut(app.id, app.title);
  }
  osStore.closeContextMenu();
}

function handleRemoveShortcut() {
  const app = osStore.contextMenu.app;
  if (app) {
    configStore.removeDesktopShortcut(app.id);
  }
  osStore.closeContextMenu();
}

// Escucha de clicks fuera del menú y teclado para cerrar
function handleGlobalClick() {
  if (osStore.contextMenu.isOpen) {
    osStore.closeContextMenu();
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    osStore.closeContextMenu();
  }
}

onMounted(() => {
  window.addEventListener('click', handleGlobalClick);
  window.addEventListener('contextmenu', handleGlobalClick);
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('click', handleGlobalClick);
  window.removeEventListener('contextmenu', handleGlobalClick);
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.breeze-context-menu {
  position: fixed;
  z-index: 1000000;
  min-width: 180px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 4px;
  box-shadow: var(--shadow-popup);
  display: flex;
  flex-direction: column;
  gap: 1px;
  animation: contextFade 120ms ease-out;
  user-select: none;
}

@keyframes contextFade {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 7px 12px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-family-base);
  font-size: 0.8rem;
  font-weight: 400;
  cursor: pointer;
  text-align: left;
  outline: none;
  transition: all var(--transition-fast);
}

/* Highlight azul KDE completo al hover */
.menu-item:hover {
  background: var(--accent);
  color: #ffffff;
}

.menu-item-danger:hover {
  background: var(--danger);
  color: #ffffff;
}

.item-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 3px 8px;
}
</style>
