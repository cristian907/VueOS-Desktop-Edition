<template>
  <Transition name="kickoff-anim">
    <div
      v-if="osStore.isLauncherOpen"
      class="kickoff-backdrop"
      @click.self="closeLauncher"
    >
      <div class="kickoff-menu">
        <!-- Header: Barra de Búsqueda -->
        <div class="kickoff-header">
          <div class="search-box">
            <SearchIcon class="search-icon" />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Buscar aplicación..."
              spellcheck="false"
              autocomplete="off"
              @keydown.escape="closeLauncher"
            />
          </div>
        </div>

        <!-- Lista de Aplicaciones (estilo lista vertical Kickoff) -->
        <div class="kickoff-apps-list" role="navigation" aria-label="Aplicaciones de VueOS">
          <button
            v-for="app in filteredApps"
            :key="app.id"
            class="kickoff-app-item"
            @click="launchApp(app)"
            @contextmenu.prevent.stop="handleRightClick($event, app)"
          >
            <div class="app-icon-wrap">
              <component :is="app.icon" class="app-icon" />
            </div>
            <div class="app-info">
              <span class="app-name">{{ app.title }}</span>
              <span class="app-desc">{{ app.description }}</span>
            </div>
          </button>

          <!-- Estado vacío -->
          <div v-if="filteredApps.length === 0" class="empty-state">
            No se encontraron aplicaciones.
          </div>
        </div>

        <!-- Footer: Acciones de sesión -->
        <div class="kickoff-footer">
          <button class="footer-btn" @click="handleLock" title="Bloquear sesión">
            <LockIcon class="footer-icon" />
          </button>
          <button class="footer-btn" @click="handleRestart" title="Reiniciar">
            <RotateCwIcon class="footer-icon" />
          </button>
          <button class="footer-btn footer-danger" @click="handleShutdown" title="Apagar">
            <PowerIcon class="footer-icon" />
          </button>
          <div class="footer-spacer"></div>
          <span class="footer-user">{{ userStore.username }}</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useOSStore } from '@/stores/osStore';
import { useStoreStore } from '@/stores/storeStore';
import { useUserStore } from '@/stores/userStore';
import { SYSTEM_APPS, type AppRegistryEntry } from '@/registry/apps';
import {
  Search as SearchIcon,
  Lock as LockIcon,
  RotateCw as RotateCwIcon,
  Power as PowerIcon
} from 'lucide-vue-next';

const osStore = useOSStore();
const storeStore = useStoreStore();
const userStore = useUserStore();
const searchQuery = ref('');
const searchInputRef = ref<HTMLInputElement | null>(null);

// Filtrar las aplicaciones según el texto ingresado y que estén instaladas
const filteredApps = computed(() => {
  const installed = SYSTEM_APPS.filter((app) => storeStore.installedAppIds.includes(app.id));
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return installed;
  return installed.filter(
    (app) =>
      app.title.toLowerCase().includes(query) ||
      app.name.toLowerCase().includes(query)
  );
});

function closeLauncher() {
  osStore.isLauncherOpen = false;
  searchQuery.value = '';
}

function launchApp(app: AppRegistryEntry) {
  const runningApp = osStore.windows.find((w) => w.appName === app.name);
  if (runningApp) {
    osStore.focusWindow(runningApp.id);
  } else {
    osStore.openWindow(app);
  }
  closeLauncher();
}

function handleRightClick(event: MouseEvent, app: AppRegistryEntry) {
  event.stopPropagation();
  osStore.openContextMenu(event.clientX, event.clientY, app, 'launcher');
}

// Acciones de sesión
function handleLock() {
  closeLauncher();
  osStore.isAuthenticated = false;
}

function handleRestart() {
  closeLauncher();
  osStore.isBooting = true;
  osStore.windows = [];
  setTimeout(() => {
    osStore.isBooting = false;
    osStore.isAuthenticated = false;
  }, 5000);
}

function handleShutdown() {
  closeLauncher();
  if (window.osAPI && typeof window.osAPI.shutdown === 'function') {
    window.osAPI.shutdown();
  } else {
    alert('Apagado simulado. Sesión finalizada.');
  }
}

// Foco automático del buscador al abrir el menú
watch(
  () => osStore.isLauncherOpen,
  async (isOpen) => {
    if (isOpen) {
      await nextTick();
      searchInputRef.value?.focus();
    } else {
      searchQuery.value = '';
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* Backdrop transparente para detectar clicks fuera */
.kickoff-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99998;
  pointer-events: auto;
}

/* ── Menú Kickoff (popup inferior izquierda) ── */
.kickoff-menu {
  position: fixed;
  bottom: 48px;
  left: 4px;
  width: 380px;
  height: 520px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-popup);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
  pointer-events: auto;
}

/* ── Header: Búsqueda ── */
.kickoff-header {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}

.search-box:focus-within {
  border-color: var(--accent);
}

.search-icon {
  width: 16px;
  height: 16px;
  color: var(--text-disabled);
  flex-shrink: 0;
  transition: color var(--transition-fast);
}

.search-box:focus-within .search-icon {
  color: var(--accent);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: var(--font-family-base);
  font-size: 0.85rem;
}

.search-input::placeholder {
  color: var(--text-disabled);
}

/* ── Lista de Aplicaciones ── */
.kickoff-apps-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}

.kickoff-app-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  outline: none;
  transition: background var(--transition-fast);
  color: var(--text-primary);
  font-family: var(--font-family-base);
}

.kickoff-app-item:hover {
  background: var(--accent);
  color: #ffffff;
}

.kickoff-app-item:hover .app-desc {
  color: rgba(255, 255, 255, 0.75);
}

.kickoff-app-item:hover .app-icon {
  color: #ffffff;
}

.app-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.app-icon {
  width: 22px;
  height: 22px;
  color: var(--text-secondary);
  transition: color var(--transition-fast);
}

.app-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-name {
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-desc {
  font-size: 0.72rem;
  color: var(--text-secondary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--transition-fast);
}

.empty-state {
  text-align: center;
  color: var(--text-disabled);
  font-size: 0.85rem;
  padding: 32px 0;
}

/* ── Footer: Sesión ── */
.kickoff-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.footer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
}

.footer-btn:hover {
  background: var(--bg-hover);
  color: var(--accent);
}

.footer-danger:hover {
  background: rgba(237, 21, 21, 0.12);
  color: var(--danger);
}

.footer-icon {
  width: 16px;
  height: 16px;
}

.footer-spacer {
  flex: 1;
}

.footer-user {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-secondary);
}

/* ── ANIMACIÓN DE ENTRADA/SALIDA ── */
.kickoff-anim-enter-active {
  transition: opacity 150ms ease;
}

.kickoff-anim-leave-active {
  transition: opacity 100ms ease;
}

.kickoff-anim-enter-active .kickoff-menu {
  animation: kickoff-slide-up 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.kickoff-anim-leave-active .kickoff-menu {
  animation: kickoff-slide-down 150ms ease-in;
}

.kickoff-anim-enter-from,
.kickoff-anim-leave-to {
  opacity: 0;
}

@keyframes kickoff-slide-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes kickoff-slide-down {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>
