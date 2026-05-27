<template>
  <div class="plasma-panel" role="toolbar" aria-label="Panel del sistema">
    <!-- Zona Izquierda: Kickoff Launcher Button -->
    <div class="panel-left">
      <button
        class="kickoff-btn"
        :class="{ 'kickoff-active': osStore.isLauncherOpen }"
        @click="osStore.toggleLauncher"
        aria-haspopup="true"
        :aria-expanded="osStore.isLauncherOpen"
        title="Lanzador de aplicaciones"
      >
        <LayoutGridIcon class="kickoff-icon" />
      </button>
    </div>

    <!-- Zona Central: Task Manager (Ventanas abiertas) + Pinned Apps -->
    <div class="panel-center">
      <!-- Pinned Apps (Quick Launch) -->
      <div v-if="configStore.pinnedAppIds.length > 0" class="pinned-apps-container">
        <button
          v-for="appId in configStore.pinnedAppIds"
          :key="'pinned-' + appId"
          class="pinned-app-btn"
          :class="{ 'pinned-app-active': isAppRunning(appId) }"
          @click="handlePinnedAppClick(appId)"
          @contextmenu.prevent.stop="handlePinnedAppContextMenu($event, appId)"
          :title="getAppTitle(appId)"
        >
          <component :is="getAppIconById(appId)" class="pinned-app-icon" />
        </button>
      </div>

      <!-- Separador vertical si hay apps ancladas -->
      <div v-if="configStore.pinnedAppIds.length > 0" class="pinned-divider"></div>

      <!-- Ventanas abiertas -->
      <div
        v-for="win in osStore.windows"
        :key="win.id"
        class="task-item-container"
        @mouseenter="handleMouseEnter(win.id)"
        @mouseleave="handleMouseLeave"
      >
        <button
          class="task-btn"
          :class="{
            'task-focused': isFocused(win),
            'task-minimized': win.isMinimized
          }"
          @click="handleTaskClick(win)"
        >
          <span class="task-label">{{ win.title }}</span>
        </button>

        <!-- Popup de Miniatura al hacer Hover (KDE Plasma Style) -->
        <div v-if="hoveredWindowId === win.id" class="task-preview-popup" @click.stop>
          <div class="preview-header">
            <component :is="getAppIcon(win.appName)" class="preview-app-icon" />
            <span class="preview-title">{{ win.title }}</span>
            <button class="preview-close-btn" @click.stop="osStore.closeWindow(win.id)" title="Cerrar aplicación">
              <CloseIcon class="close-icon-svg" />
            </button>
          </div>
          <div class="preview-body-frame">
            <!-- Representación en miniatura / gradiente con el nombre de la app -->
            <div class="preview-thumbnail-mock">
              <span class="preview-app-name-badge">{{ win.appName }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Zona Derecha: System Tray + Reloj -->
    <div class="panel-right">
      <!-- Iconos de estado del sistema -->
      <div
        class="system-tray"
        :class="{ 'tray-active': showPowerMenu }"
        @click.stop="showPowerMenu = !showPowerMenu"
        title="Área de notificaciones"
      >
        <!-- Indicador de CPU -->
        <div v-if="configStore.showTopbarCpu" class="tray-stat" title="Carga de CPU">
          <CpuIcon class="tray-icon" />
          <span class="tray-value">{{ Math.round(osStore.stats.cpu_usage) }}%</span>
        </div>

        <!-- Indicador de RAM -->
        <div v-if="configStore.showTopbarRam" class="tray-stat" title="Uso de RAM">
          <LayersIcon class="tray-icon" />
          <span class="tray-value">{{ Math.round(osStore.stats.ram_usage) }}%</span>
        </div>

        <!-- Indicador de Temperatura -->
        <div v-if="configStore.showTopbarTemp" class="tray-stat" title="Temperatura de CPU">
          <ThermometerIcon class="tray-icon" />
          <span class="tray-value">{{ Math.round(osStore.stats.cpu_temp ?? 42) }}°C</span>
        </div>

        <!-- Divider condicional -->
        <div v-if="hasHardwareStats" class="tray-divider"></div>

        <!-- Red -->
        <WifiIcon v-if="osStore.stats.networkOnline !== false" class="tray-icon tray-online" />
        <WifiOffIcon v-else class="tray-icon tray-offline" />

        <!-- Volumen -->
        <VolumeIcon class="tray-icon" />

        <!-- Batería -->
        <BatteryChargingIcon v-if="osStore.stats.batteryCharging" class="tray-icon tray-charging" />
        <template v-else>
          <BatteryFullIcon v-if="batteryLevel >= 80" class="tray-icon" />
          <BatteryMediumIcon v-else-if="batteryLevel >= 20" class="tray-icon tray-warning" />
          <BatteryLowIcon v-else class="tray-icon tray-danger" />
        </template>
      </div>

      <!-- Separador vertical -->
      <div class="panel-separator"></div>

      <!-- Reloj del Sistema -->
      <div class="panel-clock" @click.stop="showPowerMenu = !showPowerMenu">
        <time class="clock-time" :datetime="isoDateTime">{{ formattedTime }}</time>
        <time class="clock-date" :datetime="isoDateTime">{{ formattedDate }}</time>
      </div>

      <!-- Power Menu Dropdown -->
      <PowerMenu v-if="showPowerMenu" @close="showPowerMenu = false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useOSStore } from '@/stores/osStore';
import { useConfigStore } from '@/stores/configStore';
import type { WindowProcess } from '@/types/os';
import PowerMenu from '@/components/core/PowerMenu.vue';
import { SYSTEM_APPS } from '@/registry/apps';
import {
  LayoutGrid as LayoutGridIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Volume2 as VolumeIcon,
  BatteryCharging as BatteryChargingIcon,
  BatteryFull as BatteryFullIcon,
  BatteryMedium as BatteryMediumIcon,
  BatteryLow as BatteryLowIcon,
  Cpu as CpuIcon,
  Layers as LayersIcon,
  Thermometer as ThermometerIcon,
  X as CloseIcon
} from 'lucide-vue-next';

const osStore = useOSStore();
const configStore = useConfigStore();

const showPowerMenu = ref(false);

const hoveredWindowId = ref<string | null>(null);
let hoverTimeout: ReturnType<typeof setTimeout> | null = null;

function handleMouseEnter(winId: string) {
  if (hoverTimeout) clearTimeout(hoverTimeout);
  hoveredWindowId.value = winId;
}

function handleMouseLeave() {
  hoverTimeout = setTimeout(() => {
    hoveredWindowId.value = null;
  }, 150);
}

function getAppIcon(appName: string) {
  const app = SYSTEM_APPS.find(a => a.name === appName);
  return app ? app.icon : null;
}

const batteryLevel = computed(() => osStore.stats.batteryLevel ?? 100);

// Verificar si hay estadísticas de hardware visibles
const hasHardwareStats = computed(() => {
  return configStore.showTopbarCpu || configStore.showTopbarRam || configStore.showTopbarTemp;
});

// ---- Reloj en Tiempo Real (Estilo KDE Plasma) ----
const formattedTime = ref('');
const formattedDate = ref('');
const isoDateTime = ref('');
let clockInterval: ReturnType<typeof setInterval>;

function updateClock() {
  const now = new Date();
  isoDateTime.value = now.toISOString();

  formattedTime.value = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  formattedDate.value = now.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).replace(',', '');
}

onMounted(() => {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
});

onUnmounted(() => {
  clearInterval(clockInterval);
});

// ---- Task Manager ----

/**
 * Determina si una ventana es la que tiene el foco actual
 */
function isFocused(win: WindowProcess): boolean {
  const maxZ = Math.max(...osStore.windows.map(w => w.zIndex));
  return win.zIndex === maxZ && !win.isMinimized;
}

/**
 * Click en un botón de tarea: si está minimizada, restaurar y enfocar.
 * Si ya tiene foco, minimizar. Si no tiene foco, enfocar.
 */
function handleTaskClick(win: WindowProcess) {
  if (win.isMinimized) {
    osStore.focusWindow(win.id);
  } else if (isFocused(win)) {
    osStore.minimizeWindow(win.id);
  } else {
    osStore.focusWindow(win.id);
  }
}

// ---- Pinned Apps Handlers ----

function getAppIconById(appId: string) {
  const app = SYSTEM_APPS.find(a => a.id === appId);
  return app ? app.icon : null;
}

function getAppTitle(appId: string): string {
  const app = SYSTEM_APPS.find(a => a.id === appId);
  return app ? app.title : '';
}

function isAppRunning(appId: string): boolean {
  const app = SYSTEM_APPS.find(a => a.id === appId);
  if (!app) return false;
  return osStore.windows.some(w => w.appName === app.name);
}

function handlePinnedAppClick(appId: string) {
  const app = SYSTEM_APPS.find(a => a.id === appId);
  if (!app) return;
  const runningWindow = osStore.windows.find(w => w.appName === app.name);
  if (runningWindow) {
    handleTaskClick(runningWindow);
  } else {
    osStore.openWindow(app);
  }
}

function handlePinnedAppContextMenu(event: MouseEvent, appId: string) {
  const app = SYSTEM_APPS.find(a => a.id === appId);
  if (app) {
    osStore.openContextMenu(event.clientX, event.clientY, app, 'dock');
  }
}
</script>

<style scoped>
/* ── PANEL KDE PLASMA (Barra inferior, ancho completo) ── */
.plasma-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 4px;
  background: var(--bg-panel);
  border-top: 1px solid var(--border-color);
  box-shadow: var(--shadow-panel);
  z-index: 99999;
  user-select: none;
}

/* ── Zona Izquierda: Kickoff ── */
.panel-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.kickoff-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 36px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
}

.kickoff-btn:hover {
  background: var(--bg-hover);
  color: var(--accent);
}

.kickoff-active {
  background: var(--bg-active);
  color: var(--accent);
  border-color: var(--accent);
}

.kickoff-icon {
  width: 20px;
  height: 20px;
}

/* ── Zona Central: Task Manager ── */
.panel-center {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 8px;
  min-width: 0;
  overflow: visible;
}

.task-btn {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 14px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: var(--font-family-base);
  font-size: 0.8rem;
  font-weight: 400;
  cursor: pointer;
  white-space: nowrap;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all var(--transition-fast);
  outline: none;
  flex-shrink: 1;
  min-width: 80px;
}

.task-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.task-focused {
  background: var(--bg-active);
  color: var(--text-primary);
  border-bottom: 2px solid var(--accent);
  font-weight: 500;
}

.task-minimized {
  opacity: 0.6;
}

.task-minimized:hover {
  opacity: 1;
}

.task-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Zona Derecha: System Tray + Reloj ── */
.panel-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  position: relative;
}

.system-tray {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  height: 32px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.system-tray:hover {
  background: var(--bg-hover);
}

.tray-active {
  background: var(--bg-active);
}

.tray-icon {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

.tray-online {
  color: var(--text-primary);
}

.tray-offline {
  color: var(--danger);
}

.tray-charging {
  color: var(--success);
}

.tray-warning {
  color: var(--warning);
}

.tray-danger {
  color: var(--danger);
}

.tray-stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tray-value {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 28px;
  text-align: right;
}

.tray-divider {
  width: 1px;
  height: 18px;
  background: var(--border-color);
  margin: 0 2px;
}

/* Separador vertical del panel */
.panel-separator {
  width: 1px;
  height: 24px;
  background: var(--border-color);
  margin: 0 4px;
}

/* Reloj del Panel */
.panel-clock {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  height: 36px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
  line-height: 1.2;
}

.panel-clock:hover {
  background: var(--bg-hover);
}

.clock-time {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.3px;
}

.clock-date {
  font-size: 0.65rem;
  font-weight: 400;
  color: var(--text-secondary);
  text-transform: capitalize;
}

/* ── Hover Task Preview Miniatures (KDE Breeze) ── */
.task-item-container {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.task-preview-popup {
  position: absolute;
  bottom: 44px;
  left: 50%;
  transform: translateX(-50%);
  width: 180px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-popup);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 999999;
}

/* Puente invisible para mantener el hover entre el panel y el popup */
.task-preview-popup::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 0;
  right: 0;
  height: 16px;
  background: transparent;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 24px;
}

.preview-app-icon {
  width: 14px;
  height: 14px;
  color: var(--accent);
  flex-shrink: 0;
}

.preview-title {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.preview-close-btn {
  background: transparent;
  border: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
}

.preview-close-btn:hover {
  background: var(--danger);
  color: white;
}

.close-icon-svg {
  width: 10px;
  height: 10px;
}

.preview-body-frame {
  width: 100%;
  height: 90px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.preview-thumbnail-mock {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--bg-hover) 0%, var(--bg-active) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-app-name-badge {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--accent);
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
}

/* Pinned Apps Styles */
.pinned-apps-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pinned-app-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
}

.pinned-app-btn:hover {
  background: var(--bg-hover);
  color: var(--accent);
  transform: translateY(-1px);
}

.pinned-app-btn:active {
  transform: translateY(0);
}

.pinned-app-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

.pinned-app-btn:hover .pinned-app-icon {
  transform: scale(1.1);
}

.pinned-app-active {
  position: relative;
}

.pinned-app-active::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: var(--accent);
  border-radius: 50%;
}

.pinned-divider {
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 6px;
}
</style>
