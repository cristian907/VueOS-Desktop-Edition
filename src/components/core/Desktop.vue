<template>
  <div
    class="desktop-environment"
    :class="{ 'light-theme': configStore.theme === 'light' }"
    :style="{ backgroundImage: `url(${configStore.wallpaper})` }"
  >
    <!-- Capa de difuminado reactiva con transiciones ultra suaves -->
    <div
      class="desktop-blur-layer"
      :class="{ 'blur-active': configStore.blurEnabled }"
    ></div>

    <!-- Shell Superior de Control (Reloj + Actividades + Telemetría) -->
    <Shell />

    <!-- Área exclusiva para contener y restringir el movimiento de ventanas -->
    <div class="workspace-area">
      <!-- Accesos Directos del Escritorio -->
      <div
        v-for="shortcut in configStore.desktopShortcuts"
        :key="shortcut.id"
        class="desktop-shortcut"
        :style="{ left: `${shortcut.position.x}px`, top: `${shortcut.position.y}px` }"
        @mousedown="startDragShortcut($event, shortcut)"
        @dblclick="openApp(shortcut.appId)"
        @contextmenu.prevent.stop="handleShortcutContextMenu($event, shortcut)"
      >
        <div class="shortcut-icon-wrapper">
          <component :is="getAppIcon(shortcut.appId)" class="shortcut-icon" />
        </div>
        <span class="shortcut-label">{{ shortcut.title }}</span>
      </div>

      <!-- Renderizado dinámico de todas las ventanas activas en el OS -->
      <template v-for="win in osStore.windows" :key="win.id">
        <WindowFrame :window="win">
          <!-- Inyección asíncrona de la aplicación según su nombre registrado -->
          <component :is="getAppComponent(win.appName)" />
        </WindowFrame>
      </template>
    </div>

    <!-- Panel KDE Plasma Breeze -->
    <Taskbar />

    <!-- Menú Contextual Global de Aplicaciones (KDE Breeze Adaptable) -->
    <ContextMenu />

    <!-- Overlay de Actualización del Sistema Estilo KDE Breeze -->
    <Transition name="fade">
      <div v-if="osStore.isUpdating" class="system-update-overlay">
        <div class="update-card-elegant">
          <div class="update-logo-wrapper">
            <h1 class="update-logo">VueOS</h1>
            <span class="update-sub-logo">Breeze Edition</span>
          </div>

          <!-- Spinner animado estilo KDE Breeze -->
          <div class="breeze-spinner-container">
            <svg class="breeze-spinner" viewBox="0 0 50 50">
              <circle class="path-bg" cx="25" cy="25" r="20" fill="none" stroke-width="2.5"></circle>
              <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="2.5"></circle>
            </svg>
            <div class="progress-percent-lbl">{{ osStore.updateProgress }}%</div>
          </div>

          <div class="update-info-block">
            <h2 class="update-title">Instalando actualizaciones de VueOS (v1.1.0)...</h2>
            <p class="update-subtitle">Por favor, mantén tu equipo encendido y conectado a la corriente.</p>
            <p class="update-disclaimer">El sistema se reiniciará automáticamente al finalizar la instalación.</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Pantalla completa de Animación de Arranque / Reinicio Gamer-Neón -->
    <Transition name="fade">
      <BootAnimation v-if="osStore.isBooting" />
    </Transition>

    <!-- Toast Flotante de Notificaciones del Sistema (OOM, descargas, etc.) -->
    <Transition name="toast-slide">
      <div v-if="osStore.systemNotification" class="system-oom-toast" :class="osStore.systemNotification.type">
        <component 
          :is="osStore.systemNotification.type === 'info' ? CheckCircleIcon : AlertTriangleIcon" 
          class="oom-toast-icon" 
        />
        <div class="oom-toast-content">
          <h4 class="oom-toast-title">{{ osStore.systemNotification.title }}</h4>
          <p class="oom-toast-msg">{{ osStore.systemNotification.message }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, type Component } from 'vue';
import { useOSStore } from '@/stores/osStore';
import { useConfigStore } from '@/stores/configStore';
import Shell from '@/components/core/Shell.vue';
import WindowFrame from '@/components/core/WindowFrame.vue';
import Taskbar from '@/components/core/Taskbar.vue';
import ContextMenu from '@/components/core/ContextMenu.vue';
import BootAnimation from '@/components/core/BootAnimation.vue';
import { SYSTEM_APPS } from '@/registry/apps';
import { AlertTriangle as AlertTriangleIcon, CheckCircle as CheckCircleIcon } from 'lucide-vue-next';

const osStore = useOSStore();
const configStore = useConfigStore();

// Registro local asíncrono para Lazy Loading de las apps del SO
const appRegistry: Record<string, Component> = {
  BrowserApp: defineAsyncComponent(() => import('@/components/apps/BrowserApp.vue')),
  TerminalApp: defineAsyncComponent(() => import('@/components/apps/TerminalApp.vue')),
  SettingsApp: defineAsyncComponent(() => import('@/components/apps/SettingsApp.vue')),
  MonitorApp: defineAsyncComponent(() => import('@/components/apps/SystemMonitor.vue')),
  FilesApp: defineAsyncComponent(() => import('@/components/apps/FileManager.vue')),
  NotesApp: defineAsyncComponent(() => import('@/components/apps/NotesApp.vue')),
  CameraApp: defineAsyncComponent(() => import('@/components/apps/CameraApp.vue')),
  NetworkApp: defineAsyncComponent(() => import('@/components/apps/NetworkApp.vue')),
  OfficeApp: defineAsyncComponent(() => import('@/components/apps/OfficeApp.vue')),
  CalculatorApp: defineAsyncComponent(() => import('@/components/apps/CalculatorApp.vue')),
  CalendarApp: defineAsyncComponent(() => import('@/components/apps/CalendarApp.vue')),
  ClockApp: defineAsyncComponent(() => import('@/components/apps/ClockApp.vue')),
  RecorderApp: defineAsyncComponent(() => import('@/components/apps/RecorderApp.vue')),
  StoreApp: defineAsyncComponent(() => import('@/components/apps/StoreApp.vue')),
  ElisaPlayerApp: defineAsyncComponent(() => import('@/components/apps/ElisaPlayerApp.vue')),
  KateApp: defineAsyncComponent(() => import('@/components/apps/KateApp.vue')),
  SysBenchApp: defineAsyncComponent(() => import('@/components/apps/SysBenchApp.vue')),
};

/**
 * Resuelve el componente de Vue correspondiente al nombre de la aplicación.
 * Si no existe, retorna un div nativo como fallback.
 */
function getAppComponent(appName: string): Component | string {
  return appRegistry[appName] || 'div';
}

function getAppIcon(appId: string) {
  const app = SYSTEM_APPS.find(a => a.id === appId);
  return app ? app.icon : null;
}

function openApp(appId: string) {
  const app = SYSTEM_APPS.find(a => a.id === appId);
  if (app) {
    osStore.openWindow(app);
  }
}

function handleShortcutContextMenu(event: MouseEvent, shortcut: any) {
  const app = SYSTEM_APPS.find(a => a.id === shortcut.appId);
  if (app) {
    osStore.openContextMenu(event.clientX, event.clientY, app, 'shortcut');
  }
}

function startDragShortcut(e: MouseEvent, shortcut: any) {
  if (e.button !== 0) return; // solo click izquierdo
  e.preventDefault();
  
  // Guardar posición inicial en caso de que necesitemos revertir por colisión
  const originalX = shortcut.position.x;
  const originalY = shortcut.position.y;
  
  const startX = e.clientX - shortcut.position.x;
  const startY = e.clientY - shortcut.position.y;

  function onMouseMove(moveEvent: MouseEvent) {
    let newX = moveEvent.clientX - startX;
    let newY = moveEvent.clientY - startY;

    const workspace = document.querySelector('.workspace-area');
    if (workspace) {
      const rect = workspace.getBoundingClientRect();
      newX = Math.max(10, Math.min(rect.width - 90, newX));
      newY = Math.max(10, Math.min(rect.height - 90, newY));
    }

    shortcut.position.x = newX;
    shortcut.position.y = newY;
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    // Dimensiones de cuadrícula (100px por celda) y desfase de inicio (20px)
    const GRID_W = 100;
    const GRID_H = 100;
    const OFFSET_X = 20;
    const OFFSET_Y = 20;

    // Calcular el slot del grid más cercano
    let targetCol = Math.round((shortcut.position.x - OFFSET_X) / GRID_W);
    let targetRow = Math.round((shortcut.position.y - OFFSET_Y) / GRID_H);

    // Evitar coordenadas negativas
    targetCol = Math.max(0, targetCol);
    targetRow = Math.max(0, targetRow);

    // Limitar al espacio físico actual del viewport útil del escritorio
    const workspace = document.querySelector('.workspace-area');
    if (workspace) {
      const rect = workspace.getBoundingClientRect();
      const maxCol = Math.floor((rect.width - OFFSET_X) / GRID_W) - 1;
      const maxRow = Math.floor((rect.height - OFFSET_Y) / GRID_H) - 1;
      targetCol = Math.min(maxCol, targetCol);
      targetRow = Math.min(maxRow, targetRow);
    }

    // Verificar colisión: ver si otra app ya ocupa esta celda (excluyendo a sí misma)
    const isOccupied = configStore.desktopShortcuts.some(s => {
      if (s.id === shortcut.id) return false;
      const sCol = Math.round((s.position.x - OFFSET_X) / GRID_W);
      const sRow = Math.round((s.position.y - OFFSET_Y) / GRID_H);
      return sCol === targetCol && sRow === targetRow;
    });

    if (isOccupied) {
      // Si la celda está ocupada, se revierte a la posición anterior (previene superposición)
      shortcut.position.x = originalX;
      shortcut.position.y = originalY;
    } else {
      // Si está libre, se alinea de forma limpia al slot del grid
      shortcut.position.x = OFFSET_X + targetCol * GRID_W;
      shortcut.position.y = OFFSET_Y + targetRow * GRID_H;
    }
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}
</script>

<style scoped>
.desktop-environment {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: background-image 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: var(--bg-primary);
}

.desktop-blur-layer {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(0px) brightness(1);
  pointer-events: none;
  z-index: 1;
  transition: backdrop-filter 0.5s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.desktop-blur-layer.blur-active {
  backdrop-filter: blur(12px) brightness(0.7);
  background-color: rgba(27, 30, 32, 0.4);
}

/* Área de trabajo por encima del Panel inferior (44px) */
.workspace-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 44px;
  overflow: hidden;
  z-index: 2;
}

/* ── Accesos Directos del Escritorio ── */
.desktop-shortcut {
  position: absolute;
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: grab;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  padding: 4px;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
  z-index: 5;
  user-select: none;
}

.desktop-shortcut:active {
  cursor: grabbing;
}

.desktop-shortcut:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.light-theme .desktop-shortcut:hover {
  background: rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.1);
}

.shortcut-icon-wrapper {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--accent);
  transition: transform 0.2s ease;
  box-shadow: var(--shadow-subtle);
}

.desktop-shortcut:hover .shortcut-icon-wrapper {
  transform: scale(1.08);
  border-color: var(--accent);
}

.shortcut-icon {
  width: 22px;
  height: 22px;
}

.shortcut-label {
  font-size: 0.72rem;
  font-weight: 500;
  color: #ffffff;
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.light-theme .shortcut-label {
  color: #232629;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

/* ── Toast de Notificación del Sistema (OOM Killer) ── */
.system-oom-toast {
  position: fixed;
  top: 60px;
  right: 20px;
  width: 380px;
  max-width: calc(100vw - 40px);
  background: rgba(231, 76, 60, 0.15); /* Transparencia roja */
  border: 1px solid rgba(231, 76, 60, 0.45);
  border-left: 5px solid #e74c3c;
  border-radius: var(--radius-md);
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  z-index: 9999999;
  animation: borderGlow 2s infinite alternate;
}

.system-oom-toast.warning {
  background: rgba(243, 156, 18, 0.15); /* Transparencia naranja */
  border: 1px solid rgba(243, 156, 18, 0.45);
  border-left: 5px solid #f39c12;
}

.system-oom-toast.info {
  background: rgba(46, 204, 113, 0.15); /* Transparencia verde Breeze */
  border: 1px solid rgba(46, 204, 113, 0.45);
  border-left: 5px solid #2ecc71;
  animation: borderGlowInfo 2s infinite alternate;
}

.system-oom-toast.info .oom-toast-icon {
  color: #2ecc71;
  animation: none;
}

@keyframes borderGlowInfo {
  from { box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 0 5px rgba(46, 204, 113, 0.1); }
  to { box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(46, 204, 113, 0.3); }
}

@keyframes borderGlow {
  from { box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 0 5px rgba(243, 156, 18, 0.1); }
  to { box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(243, 156, 18, 0.3); }
}

.oom-toast-icon {
  width: 24px;
  height: 24px;
  color: #f39c12;
  flex-shrink: 0;
  animation: pulseAlert 1.2s infinite;
}

@keyframes pulseAlert {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.oom-toast-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
}

.oom-toast-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.light-theme .oom-toast-title {
  color: #232629;
}

.oom-toast-msg {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  line-height: 1.35;
}

.light-theme .oom-toast-msg {
  color: #555555;
}

/* Transición del Toast */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(50px) scale(0.95);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* ── Overlay de Actualización del Sistema Estilo KDE Breeze ── */
.system-update-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at center, #1b202a 0%, #0d0f14 100%);
  z-index: 10000000;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  font-family: var(--font-family-base), sans-serif;
  color: #eff0f1;
}

.update-card-elegant {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  text-align: center;
  padding: 40px;
  max-width: 600px;
}

.update-logo-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.update-logo {
  font-size: 2.5rem;
  font-weight: 300;
  letter-spacing: 6px;
  color: #ffffff;
  margin: 0;
  text-shadow: 0 0 20px rgba(58, 142, 230, 0.2);
}

.update-sub-logo {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--accent);
  text-transform: uppercase;
}

/* Spinner circular estilo KDE Breeze */
.breeze-spinner-container {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.breeze-spinner {
  animation: rotate-spinner 2s linear infinite;
  width: 100%;
  height: 100%;
}

.breeze-spinner .path-bg {
  stroke: rgba(255, 255, 255, 0.05);
}

.breeze-spinner .path {
  stroke: var(--accent);
  stroke-linecap: round;
  animation: dash-spinner 1.5s ease-in-out infinite;
}

.progress-percent-lbl {
  position: absolute;
  font-size: 1.6rem;
  font-weight: 300;
  font-family: monospace;
  color: #ffffff;
}

.update-info-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.update-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.update-subtitle {
  font-size: 0.85rem;
  color: #bdc3c7;
  margin: 0;
}

.update-disclaimer {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.6;
  margin: 0;
}

/* Animaciones del Spinner */
@keyframes rotate-spinner {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash-spinner {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* Transición fade general */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

