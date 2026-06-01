<template>
  <div class="store-app-container">
    <!-- SIDEBAR DE NAVEGACIÓN (IZQUIERDA) -->
    <aside class="store-sidebar">
      <div class="store-brand">
        <ShoppingBagIcon class="brand-icon" />
        <span class="brand-title">Discover</span>
      </div>

      <nav class="store-nav">
        <button
          type="button"
          class="store-nav-item"
          :class="{ 'store-nav-item-active': activeTab === 'explore' }"
          @click="activeTab = 'explore'"
        >
          <CompassIcon class="nav-icon" />
          <span>Explorar</span>
        </button>

        <button
          type="button"
          class="store-nav-item"
          :class="{ 'store-nav-item-active': activeTab === 'manage' }"
          @click="activeTab = 'manage'"
        >
          <PackageIcon class="nav-icon" />
          <span>Instaladas</span>
        </button>
      </nav>
    </aside>

    <!-- CONTENIDO PRINCIPAL (DERECHA) -->
    <main class="store-main-content">
      <!-- PESTAÑA: EXPLORAR -->
      <div v-if="activeTab === 'explore'" class="tab-content explore-tab">
        <div class="header-section">
          <div class="store-header-row" style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 20px; flex-wrap: wrap;">
            <div>
              <h2 class="section-title">Descubrir Aplicaciones</h2>
              <p class="section-sub">Potencia tu entorno VueOS con las mejores herramientas del sistema.</p>
            </div>
            
            <!-- BUSCADOR DE APPS (KDE DISCOVER STYLE) -->
            <div class="store-search-box">
              <SearchIcon class="store-search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                class="store-search-input"
                placeholder="Buscar aplicaciones..."
                spellcheck="false"
              />
            </div>
          </div>
        </div>

        <div class="apps-grid">
          <!-- Tarjeta de App Disponible -->
          <div
            v-for="app in filteredAvailableApps"
            :key="app.id"
            class="app-store-card"
          >
            <div class="app-header-row">
              <div class="app-icon-wrapper">
                <component :is="app.icon" class="store-app-icon" />
                <div class="icon-glow"></div>
              </div>
              <div class="app-meta">
                <span class="app-name">{{ app.title }}</span>
                <span class="app-dev">Por {{ app.developer }}</span>
                <span class="app-size">{{ app.size }}</span>
              </div>
            </div>

            <p class="app-desc">{{ app.description }}</p>

            <!-- Acciones de Instalación con barra de progreso -->
            <div class="app-action-container">
              <!-- Botón Instalar Inicial -->
              <button
                v-if="!downloadProgress[app.id]"
                type="button"
                class="install-btn"
                @click="simulateInstallation(app.id)"
              >
                <DownloadIcon class="action-icon" />
                <span>Instalar</span>
              </button>

              <!-- Barra de Descarga Animada -->
              <div v-else class="download-progress-container">
                <div class="progress-bar-bg">
                  <div
                    class="progress-bar-fill"
                    :style="{ width: `${downloadProgress[app.id]}%` }"
                  ></div>
                </div>
                <div class="download-status">
                  <span class="status-lbl">Descargando...</span>
                  <span class="status-pct">{{ downloadProgress[app.id] }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Estado vacío -->
          <div v-if="filteredAvailableApps.length === 0" class="store-empty-state">
            <CompassIcon class="empty-icon" />
            <h4 class="empty-title">Sin resultados</h4>
            <p class="empty-desc">No se encontraron aplicaciones disponibles con ese filtro de búsqueda.</p>
          </div>
        </div>
      </div>

      <!-- PESTAÑA: ADMINISTRAR / INSTALADAS -->
      <div v-else-if="activeTab === 'manage'" class="tab-content manage-tab">
        <div class="header-section">
          <div class="store-header-row" style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 20px; flex-wrap: wrap;">
            <div>
              <h2 class="section-title">Aplicaciones Instaladas</h2>
              <p class="section-sub">Administra y desinstala tus paquetes virtuales en VueOS.</p>
            </div>
            
            <!-- BUSCADOR DE INSTALADAS -->
            <div class="store-search-box">
              <SearchIcon class="store-search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                class="store-search-input"
                placeholder="Buscar instaladas..."
                spellcheck="false"
              />
            </div>
          </div>
        </div>

        <div class="installed-list">
          <div
            v-for="app in filteredInstalledApps"
            :key="app.id"
            class="installed-list-item"
          >
            <div class="installed-item-info">
              <div class="installed-icon-wrapper">
                <component :is="app.icon" class="installed-app-icon" />
              </div>
              <div class="installed-item-meta">
                <span class="installed-name">{{ app.title }}</span>
                <span class="installed-details">Por {{ app.developer }} • {{ app.size }}</span>
              </div>
            </div>

            <!-- Botón Desinstalar Breeze Rojo -->
            <button
              type="button"
              class="uninstall-btn"
              @click="storeStore.uninstallApp(app.id)"
            >
              <TrashIcon class="action-icon" />
              <span>Desinstalar</span>
            </button>
          </div>

          <!-- Estado vacío de instaladas -->
          <div v-if="filteredInstalledApps.length === 0" class="store-empty-state">
            <PackageIcon class="empty-icon" />
            <h4 class="empty-title">Sin aplicaciones</h4>
            <p class="empty-desc">No se encontraron aplicaciones instaladas con el filtro seleccionado.</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useStoreStore } from '@/stores/storeStore';
import {
  ShoppingBag as ShoppingBagIcon,
  Compass as CompassIcon,
  Package as PackageIcon,
  Download as DownloadIcon,
  Trash2 as TrashIcon,
  Search as SearchIcon
} from 'lucide-vue-next';

const storeStore = useStoreStore();
const activeTab = ref<'explore' | 'manage'>('explore');
const searchQuery = ref('');

// Filtrar las apps en base a la búsqueda en tiempo real
const filteredAvailableApps = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return storeStore.availableApps;
  return storeStore.availableApps.filter(app => 
    app.title.toLowerCase().includes(query) || 
    app.description.toLowerCase().includes(query)
  );
});

const filteredInstalledApps = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return storeStore.installedStoreApps;
  return storeStore.installedStoreApps.filter(app => 
    app.title.toLowerCase().includes(query) || 
    app.description.toLowerCase().includes(query)
  );
});

// Rastreo de progreso de descarga por App ID
const downloadProgress = reactive<Record<string, number>>({});

function simulateInstallation(appId: string) {
  if (downloadProgress[appId]) return;

  downloadProgress[appId] = 1;
  const duration = 2500; // 2.5 segundos de simulación de descarga
  const stepTime = 50;
  const increments = duration / stepTime;
  const stepValue = 100 / increments;

  const timer = setInterval(() => {
    if (downloadProgress[appId] >= 100) {
      clearInterval(timer);
      setTimeout(() => {
        // Ejecutar instalación real en Pinia
        storeStore.installApp(appId);
        // Limpiar progreso de descarga de la UI
        delete downloadProgress[appId];
      }, 200);
    } else {
      downloadProgress[appId] = Math.min(100, Math.floor(downloadProgress[appId] + stepValue));
    }
  }, stepTime);
}
</script>

<style scoped>
.store-app-container {
  display: flex;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-family-base);
  overflow: hidden;
  user-select: none;
}

/* SIDEBAR DE LA TIENDA */
.store-sidebar {
  width: 240px;
  background: var(--bg-secondary);
  border-right: var(--glass-border);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.store-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 8px;
}

.brand-icon {
  width: 24px;
  height: 24px;
  color: var(--accent);
  filter: drop-shadow(0 0 8px rgba(61, 174, 233, 0.3));
}

.brand-title {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 1px;
  color: #ffffff;
}

.store-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.store-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.25s ease;
}

.store-nav-item:hover {
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-primary);
}

.store-nav-item-active {
  background: rgba(61, 174, 233, 0.1) !important;
  color: var(--accent) !important;
  font-weight: 600;
  box-shadow: inset 3px 0 0 var(--accent);
}

.nav-icon {
  width: 16px;
  height: 16px;
}

/* CONTENIDO PRINCIPAL */
.store-main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.tab-content {
  animation: fadeIn 0.35s ease-out;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.header-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #ffffff;
}

.section-sub {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

/* GRID DE APLICACIONES */
.apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.app-store-card {
  background: rgba(255, 255, 255, 0.02);
  border: var(--glass-border);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.25s ease;
  position: relative;
}

.app-store-card:hover {
  border-color: rgba(61, 174, 233, 0.35);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(61, 174, 233, 0.05);
  transform: translateY(-4px);
}

.app-header-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.app-icon-wrapper {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.store-app-icon {
  width: 24px;
  height: 24px;
  z-index: 2;
}

.icon-glow {
  position: absolute;
  inset: -1px;
  border-radius: 12px;
  background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
  opacity: 0.15;
  z-index: 1;
}

.app-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #ffffff;
}

.app-dev {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.app-size {
  font-size: 0.7rem;
  font-weight: bold;
  color: var(--neon-cyan);
  font-family: monospace;
  margin-top: 2px;
}

.app-desc {
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.4;
  height: 44px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2; /* Standard property for cross-browser compatibility */
  -webkit-box-orient: vertical;
}

.app-action-container {
  margin-top: auto;
  width: 100%;
}

.install-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  background: rgba(61, 174, 233, 0.08);
  border: 1px solid rgba(61, 174, 233, 0.3);
  border-radius: 8px;
  color: var(--accent);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.25s ease;
}

.install-btn:hover {
  background: var(--accent);
  color: #ffffff;
  box-shadow: 0 0 10px rgba(61, 174, 233, 0.4);
}

.action-icon {
  width: 14px;
  height: 14px;
}

/* BARRA DE PROGRESO DE DESCARGA */
.download-progress-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 4px 0;
}

.progress-bar-bg {
  width: 100%;
  height: 5px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(to right, var(--accent), var(--neon-cyan));
  box-shadow: 0 0 8px rgba(61, 174, 233, 0.4);
  transition: width 0.1s linear;
}

.download-status {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  font-weight: bold;
}

.status-lbl {
  color: var(--text-secondary);
}

.status-pct {
  color: var(--accent);
  font-family: monospace;
}

/* LISTA DE INSTALADAS */
.installed-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.installed-list-item {
  background: rgba(255, 255, 255, 0.015);
  border: var(--glass-border);
  border-radius: 12px;
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.installed-list-item:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.15);
}

.installed-item-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.installed-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.installed-app-icon {
  width: 20px;
  height: 20px;
}

.installed-item-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.installed-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #ffffff;
}

.installed-details {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.uninstall-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(244, 63, 94, 0.08);
  border: 1px solid rgba(244, 63, 94, 0.25);
  border-radius: 8px;
  color: #f43f5e;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.25s ease;
}

.uninstall-btn:hover {
  background: #f43f5e;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(244, 63, 94, 0.5);
  border-color: #f43f5e;
}

/* ESTADO VACÍO TIENDA */
.store-empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.01);
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.empty-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6px;
}

.empty-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  max-width: 320px;
  line-height: 1.4;
}
/* BUSCADOR DE DISCOVER */
.store-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  width: 260px;
  transition: all var(--transition-fast);
}

.store-search-box:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 8px rgba(61, 174, 233, 0.25);
}

.store-search-icon {
  width: 15px;
  height: 15px;
  color: var(--text-disabled);
}

.store-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.8rem;
}
</style>
