<template>
  <div class="settings-section">
    <!-- PANEL DE INFORMACIÓN GENERAL -->
    <SettingCard title="Acerca del Sistema" :icon="InfoIcon">
      <div class="about-container">
        <!-- LOGO ESTILO PLYMOUTH KDE -->
        <div class="logo-boot-preview">
          <h1 class="boot-logo">VueOS</h1>
        </div>

        <div class="distro-details">
          <h3 class="distro-name">VueOS Desktop Edition</h3>
          <p class="distro-author">Basado en <strong>AntorOS</strong></p>
          <span class="distro-version">Versión {{ osStore.systemVersion }} (KDE edition)</span>
        </div>
      </div>
    </SettingCard>

    <!-- PANEL DE ESPECIFICACIONES TÉCNICAS -->
    <SettingCard title="Especificaciones del Hardware & Kernel" :icon="CpuIcon">
      <div class="setting-rows-list">
        <div class="tech-spec-row">
          <span class="spec-label">Núcleo / Kernel</span>
          <span class="spec-value code-font">Go Daemon v1.21.5 (Gorilla WebSockets)</span>
        </div>
        <div class="row-divider"></div>

        <div class="tech-spec-row">
          <span class="spec-label">Entorno Gráfico</span>
          <span class="spec-value code-font">Vue 3 (Composition API & Pinia)</span>
        </div>
        <div class="row-divider"></div>

        <div class="tech-spec-row">
          <span class="spec-label">Base de Datos local</span>
          <span class="spec-value code-font">IndexedDB (Dexie.js) & SQLite3</span>
        </div>
        <div class="row-divider"></div>

        <div class="tech-spec-row">
          <span class="spec-label">Contenedor de Escritorio</span>
          <span class="spec-value code-font">Electron v28.1.0</span>
        </div>
        <div class="row-divider"></div>

        <div class="tech-spec-row">
          <span class="spec-label">Estado de Carga CPU</span>
          <span class="spec-value">{{ osStore.stats.cpu_usage.toFixed(1) }}% ({{ osStore.stats.cpu_temp }}°C)</span>
        </div>
      </div>
    </SettingCard>

    <!-- PANEL DE ACTUALIZACIÓN DEL SISTEMA -->
    <SettingCard title="Actualización del Sistema" :icon="RefreshIcon">
      <div class="update-section-container">
        <!-- Buscando actualizaciones... -->
        <div v-if="loadingUpdate" class="update-loading">
          <RefreshIcon class="spinner-icon spinning" />
          <span>Buscando actualizaciones disponibles en el sistema...</span>
        </div>

        <!-- Nueva actualización disponible -->
        <div v-else-if="updateInfo && osStore.systemVersion !== updateInfo.version" class="update-available">
          <div class="update-header-info">
            <span class="update-badge">Nueva versión disponible: v{{ updateInfo.version }}</span>
            <span class="current-version-lbl">Versión instalada: v{{ osStore.systemVersion }}</span>
          </div>

          <div class="changelog-box">
            <h4 class="changelog-title">Novedades de la actualización:</h4>
            <ul class="changelog-list">
              <li v-for="(change, idx) in updateInfo.changelog" :key="idx" class="changelog-item">
                <span class="bullet">•</span>
                <span class="change-text">{{ change }}</span>
              </li>
            </ul>
          </div>

          <!-- Acciones de descarga e instalación -->
          <div class="update-actions">
            <!-- Botón descargar -->
            <button 
              v-if="updateState === 'idle'" 
              type="button" 
              class="breeze-btn-primary" 
              @click="startDownload"
            >
              <DownloadIcon class="btn-icon" />
              <span>Descargar e Instalar</span>
            </button>

            <!-- Barra de progreso -->
            <div v-else-if="updateState === 'downloading'" class="download-progress-box">
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" :style="{ width: `${downloadProgress}%` }"></div>
              </div>
              <div class="progress-labels">
                <span>Descargando paquetes de actualización...</span>
                <span class="progress-pct">{{ downloadProgress }}%</span>
              </div>
            </div>

            <!-- Botón instalar -->
            <button 
              v-else-if="updateState === 'ready'" 
              type="button" 
              class="breeze-btn-install" 
              @click="installUpdate"
            >
              <RotateCwIcon class="btn-icon spinning-once" />
              <span>Instalar y Reiniciar</span>
            </button>
          </div>
        </div>

        <!-- Sistema al día -->
        <div v-else class="update-up-to-date">
          <CheckCircleIcon class="check-icon" />
          <div class="up-to-date-info">
            <span class="up-to-date-title">El sistema está actualizado</span>
            <span class="up-to-date-sub">Versión de VueOS: v{{ osStore.systemVersion }} (Breeze Edition)</span>
          </div>
          <button type="button" class="breeze-btn-secondary" @click="checkUpdates(true)">
            <span>Buscar actualizaciones</span>
          </button>
        </div>
      </div>
    </SettingCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useOSStore } from '@/stores/osStore';
import SettingCard from '@/components/ui/SettingCard.vue';
import { 
  Info as InfoIcon, 
  Cpu as CpuIcon, 
  RefreshCw as RefreshIcon, 
  Download as DownloadIcon, 
  RotateCw as RotateCwIcon, 
  CheckCircle as CheckCircleIcon 
} from 'lucide-vue-next';

const osStore = useOSStore();

const loadingUpdate = ref(false);
const updateInfo = ref<{ version: string; changelog: string[] } | null>(null);
const updateState = ref<'idle' | 'downloading' | 'ready'>('idle');
const downloadProgress = ref(0);

async function checkUpdates(force = false) {
  if (force) {
    loadingUpdate.value = true;
  }
  
  try {
    if (window.osAPI && window.osAPI.getUpdateInfo) {
      updateInfo.value = await window.osAPI.getUpdateInfo();
    } else {
      // Fallback local simulado en caso de navegador
      updateInfo.value = {
        version: '1.1.0',
        changelog: [
          'Nueva versión 2.0 de Elisa Player (reproductor de música completamente rediseñado con playlist de doble columna)',
          'Aumento de la estabilidad del Kernel en la gestión de hilos de fondo',
          'Optimización avanzada del OOM Killer de memoria en carga crítica (>90%)',
          'Corrección de errores menores de visualización en el Monitor de Sistema y en la Pseudo-Terminal (PTY)'
        ]
      };
    }
  } catch (err) {
    console.error('Error al comprobar actualizaciones:', err);
  } finally {
    if (force) {
      setTimeout(() => {
        loadingUpdate.value = false;
      }, 1000);
    }
  }
}

function startDownload() {
  updateState.value = 'downloading';
  downloadProgress.value = 0;
  
  const interval = setInterval(() => {
    if (downloadProgress.value >= 100) {
      clearInterval(interval);
      updateState.value = 'ready';
    } else {
      downloadProgress.value += 5;
    }
  }, 100);
}

function installUpdate() {
  osStore.triggerSystemUpdate();
}

onMounted(() => {
  checkUpdates();
});
</script>

<style scoped>
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.35s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.about-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 20px 0;
  text-align: center;
}

/* LOGO ESTILO PLYMOUTH KDE */
.logo-boot-preview {
  background: var(--bg-primary);
  border-radius: 6px;
  width: 100%;
  max-width: 420px;
  padding: 30px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-subtle);
  overflow: hidden;
}

.boot-logo {
  font-family: var(--font-family-base);
  font-size: 2.2rem;
  font-weight: 300;
  color: var(--text-primary);
  letter-spacing: 4px;
  position: relative;
}

.distro-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.distro-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent);
}

.distro-author {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.distro-author strong {
  color: var(--text-primary);
}

.distro-version {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.7;
}

/* ESPECIFICACIONES TÉCNICAS */
.setting-rows-list {
  display: flex;
  flex-direction: column;
}

.tech-spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 0.85rem;
}

.spec-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.spec-value {
  color: var(--text-primary);
}

.code-font {
  font-family: monospace;
  background: rgba(255, 255, 255, 0.04);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

:global(.light-theme) .code-font {
  background: rgba(0, 0, 0, 0.04);
}

.row-divider {
  height: 1px;
  background: var(--border-color);
}

/* ── Actualizaciones del Sistema ── */
.update-section-container {
  padding: 12px 4px;
}

.update-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.spinner-icon {
  width: 16px;
  height: 16px;
}

.spinning {
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.update-available {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.update-header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.update-badge {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--accent);
}

.current-version-lbl {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.changelog-box {
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.changelog-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.changelog-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.changelog-item {
  display: flex;
  gap: 8px;
  font-size: 0.76rem;
  line-height: 1.35;
  color: var(--text-secondary);
}

.bullet {
  color: var(--accent);
  font-weight: bold;
}

.update-actions {
  display: flex;
  width: 100%;
}

.breeze-btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--accent);
  border: none;
  border-radius: 6px;
  color: #ffffff;
  padding: 10px 20px;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--transition-fast) ease;
}

.breeze-btn-primary:hover {
  background: var(--accent-hover, #2980b9);
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.download-progress-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.progress-bar-bg {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.15s ease;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.progress-pct {
  color: var(--accent);
  font-family: monospace;
}

.breeze-btn-install {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #2ecc71; /* Verde Breeze */
  border: none;
  border-radius: 6px;
  color: #ffffff;
  padding: 10px 20px;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--transition-fast) ease;
}

.breeze-btn-install:hover {
  background: #27ae60;
}

.update-up-to-date {
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: left;
}

.check-icon {
  width: 32px;
  height: 32px;
  color: #2ecc71;
  flex-shrink: 0;
}

.up-to-date-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.up-to-date-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}

.up-to-date-sub {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.breeze-btn-secondary {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  padding: 8px 16px;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.breeze-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--text-secondary);
}

:global(.light-theme) .changelog-box {
  background: rgba(0, 0, 0, 0.04);
}
</style>
