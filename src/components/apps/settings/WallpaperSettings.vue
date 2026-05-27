<template>
  <div class="settings-section">
    <!-- TARJETA PRINCIPAL: PREVISUALIZACIÓN DE FONDO DE PANTALLA -->
    <SettingCard title="Fondo de pantalla" :icon="ImageIcon">
      <div class="wallpaper-preview-container">
        <!-- Fila 1: Miniatura y Navegación Secuencial / Selector -->
        <div class="preview-panel">
          <div class="thumbnail-wrapper">
            <img
              :src="configStore.wallpaper"
              alt="Miniatura de Fondo"
              class="thumbnail-img"
              :class="{ 'thumbnail-blurred': configStore.blurEnabled }"
            />
            <div class="thumbnail-overlay">
              <span class="preview-badge">VISTA PREVIA</span>
            </div>
          </div>

          <div class="navigation-controls">
            <span class="file-name">{{ currentWallpaperName }}</span>
            
            <div class="control-actions-row">
              <!-- Navegación Secuencial Neón -->
              <div class="btn-group">
                <button
                  type="button"
                  class="nav-btn"
                  @click="configStore.prevWallpaper"
                  title="Fondo anterior"
                >
                  <ChevronLeftIcon class="nav-icon" />
                </button>
                <button
                  type="button"
                  class="nav-btn"
                  @click="configStore.nextWallpaper"
                  title="Siguiente fondo"
                >
                  <ChevronRightIcon class="nav-icon" />
                </button>
              </div>

              <!-- Botón Unificado estilo Perfil de Usuario para abrir la Carpeta de Imágenes -->
              <button
                type="button"
                class="select-image-btn"
                @click="openWallpaperPicker"
                title="Elegir imagen de tu carpeta de Imágenes del sistema"
              >
                <FolderOpenIcon class="btn-icon" />
                Elegir de Imágenes
              </button>
            </div>
          </div>
        </div>
      </div>
    </SettingCard>

    <!-- TARJETAS DE OPCIONES / TOGGLES -->
    <SettingCard title="Opciones de Escritorio" :icon="SlidersIcon">
      <div class="setting-rows-list">
        <!-- Fila A: Fondos según modo -->
        <div class="setting-row">
          <div class="row-info">
            <span class="row-title">Fondos de pantalla según el modo</span>
            <span class="row-sub">Cambia automáticamente el fondo al activar el modo oscuro o claro.</span>
          </div>
          <ToggleSwitch v-model="modeSpecific" />
        </div>

        <div class="row-divider"></div>

        <!-- Fila B: Desenfocar fondo general -->
        <div class="setting-row">
          <div class="row-info">
            <span class="row-title">Desenfocar en la vista general</span>
            <span class="row-sub">Aplica un difuminado estético al fondo del escritorio al abrir aplicaciones.</span>
          </div>
          <ToggleSwitch v-model="configStore.blurEnabled" />
        </div>

        <div class="row-divider"></div>

        <!-- Fila C: Efecto de transición -->
        <div class="setting-row">
          <div class="row-info">
            <span class="row-title">Efecto de transición</span>
            <span class="row-sub">Animación al alternar entre diferentes fondos de pantalla.</span>
          </div>
          <div class="select-wrapper">
            <select v-model="transitionEffect" class="styled-select">
              <option value="fade">Disolver (Fade)</option>
              <option value="slide">Deslizar suave</option>
              <option value="zoom">Zoom holográfico</option>
              <option value="none">Ninguno</option>
            </select>
          </div>
        </div>
      </div>
    </SettingCard>

    <!-- MODAL SELECCIONADOR DE FONDOS DE PANTALLA (GLASSMORPHIC CYBERPUNK) -->
    <Transition name="fade">
      <div v-if="showWallpaperSelector" class="modal-overlay" @click.self="showWallpaperSelector = false">
        <div class="modal-content">
          <header class="modal-header">
            <h3 class="modal-title">Elegir Fondo de Pantalla</h3>
            <button type="button" class="close-btn" @click="showWallpaperSelector = false">×</button>
          </header>
          
          <div class="modal-body">
            <p class="modal-sub">Elige una imagen de tu carpeta virtual de Imágenes o escribe una URL externa para aplicarla de inmediato.</p>
            
            <!-- Grid de imágenes de la carpeta virtual Imágenes -->
            <div class="wallpaper-grid">
              <button
                v-for="img in systemImages"
                :key="img.name"
                type="button"
                class="wallpaper-option"
                :class="{ 'wallpaper-option-active': configStore.wallpaper === img.dataUrl }"
                @click="selectWallpaper(img.dataUrl || '')"
                :title="img.name"
              >
                <img :src="img.dataUrl" class="option-thumb" />
                <span class="option-name">{{ img.name }}</span>
              </button>
              <div v-if="systemImages.length === 0" class="empty-picker">
                No hay imágenes guardadas en tu carpeta de Imágenes.
              </div>
            </div>

            <!-- Divisor -->
            <div class="modal-divider"></div>

            <!-- Entrada de URL externa -->
            <div class="url-input-area">
              <label for="modal-url-input" class="input-label">URL de Imagen Externa</label>
              <div class="input-row">
                <input
                  id="modal-url-input"
                  v-model="customUrl"
                  type="text"
                  placeholder="https://ejemplo.com/fondo-neon.jpg"
                  class="styled-input"
                  spellcheck="false"
                />
                <button type="button" class="apply-url-btn" @click="applyCustomUrl">
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useConfigStore } from '@/stores/configStore';
import { useOSStore } from '@/stores/osStore';
import SettingCard from '@/components/ui/SettingCard.vue';
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue';
import {
  Image as ImageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Sliders as SlidersIcon,
  FolderOpen as FolderOpenIcon
} from 'lucide-vue-next';

const configStore = useConfigStore();
const osStore = useOSStore();

// Estados Locales
const modeSpecific = ref(false);
const transitionEffect = ref('fade');

// Control del Modal de Selección de Fondos
const showWallpaperSelector = ref(false);
const customUrl = ref('');

// Obtiene reactivamente las imágenes disponibles en todo el sistema de archivos
const systemImages = computed(() => {
  const images: { name: string; type: 'file'; size?: string; dataUrl: string }[] = [];
  const seenUrls = new Set<string>();

  Object.keys(osStore.fileSystem).forEach((folderName) => {
    if (folderName === 'Inicio') return; // Saltar carpetas contenedoras de nivel superior

    const files = osStore.fileSystem[folderName] || [];
    files.forEach((file) => {
      if (file.type === 'file' && file.dataUrl) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
        const isValidImage = isImage || 
                             file.dataUrl.startsWith('data:image/') || 
                             file.dataUrl.startsWith('http://') || 
                             file.dataUrl.startsWith('https://');

        if (isValidImage && !seenUrls.has(file.dataUrl)) {
          seenUrls.add(file.dataUrl);
          images.push({
            name: file.name,
            type: 'file',
            size: file.size,
            dataUrl: file.dataUrl
          });
        }
      }
    });
  });

  return images;
});

// Despliega el modal de fondos de pantalla
function openWallpaperPicker() {
  customUrl.value = '';
  showWallpaperSelector.value = true;
}

// Selecciona una imagen del listado de la carpeta
function selectWallpaper(url: string) {
  if (url) {
    configStore.setWallpaper(url);
    showWallpaperSelector.value = false;
  }
}

// Aplica una URL externa escrita
function applyCustomUrl() {
  const url = customUrl.value.trim();
  if (url) {
    // Para admitir enlaces externos reactivos, los registramos en el sistema de archivos virtual
    const filename = `wallpaper_${Date.now().toString().slice(-4)}.png`;
    osStore.addFileToFolder('Imágenes', {
      name: filename,
      type: 'file',
      size: 'Enlace web',
      dataUrl: url
    });

    // Pequeño retraso controlado para permitir que el store se actualice antes de aplicar el fondo
    setTimeout(() => {
      configStore.setWallpaper(url);
    }, 50);

    showWallpaperSelector.value = false;
  }
}

// Obtiene el nombre del archivo del fondo de pantalla actual de forma reactiva
const currentWallpaperName = computed(() => {
  const list = configStore.systemWallpapers;
  if (list.length === 0) return 'Sin imágenes';
  const idx = ((configStore.wallpaperIndex % list.length) + list.length) % list.length;
  return list[idx]?.name || 'Fondo_Personalizado.png';
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

/* Previsualización del Wallpaper */
.wallpaper-preview-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-panel {
  display: flex;
  gap: 20px;
  align-items: center;
}

.thumbnail-wrapper {
  width: 160px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: var(--glass-border);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.4s ease;
}

.thumbnail-blurred {
  filter: blur(5px) brightness(0.8);
}

.thumbnail-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
  pointer-events: none;
}

.preview-badge {
  font-family: monospace;
  font-size: 0.6rem;
  font-weight: bold;
  color: var(--neon-cyan);
  letter-spacing: 0.8px;
  text-shadow: var(--glow-cyan);
}

.navigation-controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-name {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-family: monospace;
  word-break: break-all;
}

/* Fila de controles organizados */
.control-actions-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.nav-btn {
  background: var(--bg-primary);
  border: var(--glass-border);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: var(--neon-cyan);
  color: #11111b;
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}

.nav-icon {
  width: 20px;
  height: 20px;
}

/* Botón interactivo premium para acceder a imágenes */
.select-image-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-primary);
  border: var(--glass-border);
  border-radius: 8px;
  padding: 8px 16px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  height: 36px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.select-image-btn:hover {
  background: var(--neon-cyan);
  color: #11111b;
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
  transform: translateY(-1px);
}

.btn-icon {
  width: 15px;
  height: 15px;
}

.divider {
  height: 1px;
  background: var(--glass-border);
}

/* Lista de filas de opciones */
.setting-rows-list {
  display: flex;
  flex-direction: column;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.row-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 16px;
}

.row-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
}

.row-sub {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.row-divider {
  height: 1px;
  background: var(--glass-border);
  margin: 6px 0;
}

/* Selector estilizado nativo */
.select-wrapper {
  position: relative;
}

.styled-select {
  background: var(--bg-primary);
  border: var(--glass-border);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.8rem;
  padding: 6px 32px 6px 12px;
  outline: none;
  cursor: pointer;
  appearance: none;
  transition: all 0.2s;
  min-width: 140px;
}

.styled-select:focus {
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}

.select-wrapper::after {
  content: '▼';
  font-size: 0.6rem;
  color: var(--text-secondary);
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* ── MODAL SELECCIONADOR DE IMÁGENES / WALLPAPER (GLASSMORPHIC) ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
}

.modal-content {
  width: 480px;
  max-width: 90%;
  background: rgba(17, 17, 27, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--neon-cyan);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), var(--glow-cyan);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleUp {
  from { transform: scale(0.92); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: var(--glass-border);
}

.modal-title {
  font-size: 1rem;
  font-weight: bold;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--neon-magenta);
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-sub {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
}

.wallpaper-option {
  background: var(--bg-primary);
  border: var(--glass-border);
  border-radius: 10px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.wallpaper-option:hover {
  border-color: var(--neon-cyan);
  transform: translateY(-2px);
  box-shadow: var(--glow-cyan);
}

.wallpaper-option-active {
  border-color: var(--neon-cyan) !important;
  background: rgba(0, 243, 255, 0.05);
  box-shadow: var(--glow-cyan);
}

.option-thumb {
  width: 100%;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: var(--glass-border);
}

.option-name {
  font-size: 0.62rem;
  color: var(--text-secondary);
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  font-family: monospace;
}

.wallpaper-option-active .option-name {
  color: var(--neon-cyan);
  font-weight: bold;
}

.empty-picker {
  grid-column: span 3;
  text-align: center;
  padding: 24px 0;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.modal-divider {
  height: 1px;
  background: var(--glass-border);
}

.url-input-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-row {
  display: flex;
  gap: 10px;
}

.styled-input {
  flex: 1;
  background: var(--glass-bg);
  border: var(--glass-border);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.8rem;
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.styled-input:focus {
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}

.apply-url-btn {
  background: var(--bg-primary);
  border: var(--glass-border);
  border-radius: 8px;
  padding: 0 16px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.apply-url-btn:hover {
  background: var(--neon-cyan);
  color: #11111b;
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}

/* Transiciones de Alerta / Modal */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

