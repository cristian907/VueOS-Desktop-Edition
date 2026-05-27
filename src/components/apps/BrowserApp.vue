<template>
  <div class="browser-root">
    <!-- ── Fila de Pestañas Estilo KDE Breeze ── -->
    <div class="tabs-strip">
      <div class="tabs-container">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="browser-tab-item"
          :class="{ 'tab-active': tab.id === activeTabId }"
          @click="selectTab(tab.id)"
        >
          <!-- Icono indicador de carga o favicon -->
          <GlobeIcon class="tab-favicon" :class="{ 'spinning': tab.loading }" />
          
          <span class="tab-title-text">{{ tab.title }}</span>
          
          <!-- Botón cerrar pestaña -->
          <button
            type="button"
            class="close-tab-btn"
            @click.stop="closeTab(tab.id)"
            title="Cerrar pestaña"
          >
            ×
          </button>
        </div>
      </div>
      
      <!-- Botón añadir pestaña -->
      <button
        type="button"
        class="add-tab-btn"
        @click="addTab()"
        title="Nueva pestaña"
      >
        <PlusIcon class="add-tab-icon" />
      </button>
    </div>

    <!-- ── Barra de Dirección ── -->
    <div class="address-bar">
      <!-- Botones de navegación nativa del webview -->
      <div class="nav-controls">
        <button
          id="browser-back-btn"
          class="nav-btn"
          title="Atrás"
          :disabled="!activeTab?.canGoBack"
          @click="goBack"
        >
          <ArrowLeft class="nav-icon" />
        </button>
        <button
          id="browser-forward-btn"
          class="nav-btn"
          title="Adelante"
          :disabled="!activeTab?.canGoForward"
          @click="goForward"
        >
          <ArrowRight class="nav-icon" />
        </button>
        <button
          id="browser-reload-btn"
          class="nav-btn"
          title="Recargar"
          @click="reload"
        >
          <RotateCw class="nav-icon" :class="{ spinning: isLoading }" />
        </button>
      </div>

      <!-- Campo de URL -->
      <div class="url-wrapper">
        <GlobeIcon class="url-icon" />
        <input
          id="browser-url-input"
          v-model="inputUrl"
          type="text"
          class="url-input"
          spellcheck="false"
          autocomplete="off"
          placeholder="Escribe una URL o búsqueda..."
          @keyup.enter="mapsToUrl"
          @focus="selectOnFocus"
        />
      </div>

      <!-- Botón de Galería de Fondos -->
      <button
        class="wallpaper-toggle-btn"
        :class="{ 'wallpaper-active': isWallpaperOpen }"
        @click="isWallpaperOpen = !isWallpaperOpen"
        title="Galería de Fondos de Pantalla"
      >
        <DownloadCloudIcon class="wallpaper-btn-icon" />
        <span>Galería de Fondos</span>
      </button>
    </div>

    <!-- Contenedor del motor de renderizado multipestaña -->
    <div
      ref="containerRef"
      class="webview-container"
      :style="{ right: isWallpaperOpen ? '320px' : '0' }"
    >
      <webview
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ 'webview-hidden': tab.id !== activeTabId }"
        :ref="(el) => { if (el) registerWebview(tab.id, el); }"
        :src="tab.url"
        class="web-engine"
        allowpopups
      ></webview>
    </div>

    <!-- ── Drawer de Galería de Fondos ── -->
    <aside
      class="wallpaper-drawer"
      :class="{ 'drawer-open': isWallpaperOpen }"
    >
      <header class="drawer-header">
        <CompassIcon class="drawer-header-icon" />
        <div>
          <h3 class="drawer-title">Galería de Fondos</h3>
          <span class="drawer-subtitle">Descarga y aplica fondos al escritorio</span>
        </div>
      </header>

      <div class="drawer-body">
        <!-- Sección 1: Importar por URL -->
        <div class="drawer-section">
          <span class="section-label">Importar por URL Directa</span>
          <div class="paste-form">
            <input
              v-model="customUrl"
              type="text"
              class="drawer-input"
              placeholder="Pegar URL de la imagen (https://...)"
              spellcheck="false"
            />
            <input
              v-model="customFilename"
              type="text"
              class="drawer-input"
              placeholder="Nombre del archivo (ej. mi-paisaje)"
              spellcheck="false"
            />
            <button
              class="import-btn"
              @click="downloadCustomUrl"
              :disabled="!customUrl"
            >
              Descargar a Sistema
            </button>
          </div>
        </div>

        <div class="drawer-divider"></div>

        <!-- Sección 2: Fondos Oficiales Breeze Sugeridos -->
        <div class="drawer-section">
          <span class="section-label">Fondos Elegantes Sugeridos</span>
          <div class="suggestions-list">
            <div
              v-for="sug in suggestedWallpapers"
              :key="sug.name"
              class="sug-card"
            >
              <img :src="sug.url" class="sug-thumb" />
              <div class="sug-meta">
                <span class="sug-name">{{ sug.name }}</span>
                <button
                  class="sug-download-btn"
                  @click="downloadSuggested(sug)"
                >
                  Descargar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mensaje Toast de Guardado Rápido / Progreso Descargas -->
    <div class="save-toast" :class="{ 'toast-visible': browserToast }">
      {{ browserToast }}
    </div>

    <!-- ── MENÚ CONTEXTUAL ESTILO CHROME (BREEZE) ── -->
    <div
      v-if="isContextMenuOpen && contextMenuParams"
      class="custom-context-menu"
      :style="{ left: `${contextMenuPos.x}px`, top: `${contextMenuPos.y}px` }"
      @click.stop
    >
      <!-- OPCIONES DE ENLACE -->
      <template v-if="contextMenuParams.linkURL">
        <button class="menu-item" @click="openLinkInNewTab(contextMenuParams.linkURL)">
          <PlusIcon class="menu-item-icon" />
          <span>Abrir enlace en pestaña nueva</span>
        </button>
        <button class="menu-item" @click="copyToClipboard(contextMenuParams.linkURL, 'Dirección de enlace copiada.')">
          <CopyIcon class="menu-item-icon" />
          <span>Copiar dirección de enlace</span>
        </button>
        <div class="menu-divider"></div>
      </template>

      <!-- OPCIONES DE IMAGEN -->
      <template v-if="contextMenuParams.mediaType === 'image' && contextMenuParams.srcURL">
        <button class="menu-item" @click="setAsWallpaperFromUrl(contextMenuParams.srcURL)">
          <ImageIcon class="menu-item-icon" />
          <span>Establecer como fondo de pantalla</span>
        </button>
        <button class="menu-item" @click="downloadToDescargas(contextMenuParams.srcURL)">
          <DownloadCloudIcon class="menu-item-icon" />
          <span>Descargar a Descargas</span>
        </button>
        <button class="menu-item" @click="copyToClipboard(contextMenuParams.srcURL, 'Dirección de imagen copiada.')">
          <CopyIcon class="menu-item-icon" />
          <span>Copiar dirección de imagen</span>
        </button>
        <div class="menu-divider"></div>
      </template>

      <!-- OPCIONES DE SELECCIÓN DE TEXTO -->
      <template v-if="contextMenuParams.selectionText">
        <button class="menu-item" @click="copyToClipboard(contextMenuParams.selectionText, 'Texto copiado al portapapeles.')">
          <CopyIcon class="menu-item-icon" />
          <span>Copiar texto</span>
        </button>
        <button class="menu-item" @click="searchInGoogle(contextMenuParams.selectionText)">
          <GlobeIcon class="menu-item-icon" />
          <span>Buscar en Google</span>
        </button>
        <div class="menu-divider"></div>
      </template>

      <!-- OPCIONES GENERALES DE NAVEGACIÓN -->
      <button class="menu-item" :disabled="!activeTab?.canGoBack" @click="goBack">
        <ArrowLeft class="menu-item-icon" />
        <span>Atrás</span>
      </button>
      <button class="menu-item" :disabled="!activeTab?.canGoForward" @click="goForward">
        <ArrowRight class="menu-item-icon" />
        <span>Adelante</span>
      </button>
      <button class="menu-item" @click="reload">
        <RotateCw class="menu-item-icon" />
        <span>Volver a cargar</span>
      </button>
      <div class="menu-divider"></div>
      <button class="menu-item" @click="addTab()">
        <PlusIcon class="menu-item-icon" />
        <span>Nueva pestaña</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Globe as GlobeIcon,
  DownloadCloud as DownloadCloudIcon,
  Compass as CompassIcon,
  ImageIcon,
  Copy as CopyIcon,
  Plus as PlusIcon
} from 'lucide-vue-next';
import { useOSStore } from '@/stores/osStore';
import { useConfigStore } from '@/stores/configStore';
import { useAudioStore } from '@/stores/audioStore';

const osStore = useOSStore();
const configStore = useConfigStore();
const audioStore = useAudioStore();

// ── Tipo e Interfaces de Pestañas ──
interface BrowserTab {
  id: string;
  title: string;
  url: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

// ── Estado de Pestañas Múltiples ──
const tabs = ref<BrowserTab[]>([
  {
    id: 'tab-initial',
    title: 'Google',
    url: 'https://google.com',
    loading: false,
    canGoBack: false,
    canGoForward: false
  }
]);
const activeTabId = ref('tab-initial');
const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value));

// Mapeo físico local de webviews por ID de pestaña para no sobrecargar de reactividad a Vue
const webviewRefs = ref<Record<string, any>>({});

// ── Estado del input de navegación unificado para la pestaña activa ──
const inputUrl = ref('https://google.com');
const isLoading = ref(false);

// ── Estado de Galería de Fondos ──
const isWallpaperOpen = ref(false);
const customUrl = ref('');
const customFilename = ref('');
const browserToast = ref('');

// ── Estado del Menú Contextual Chrome-Style ──
const isContextMenuOpen = ref(false);
const contextMenuPos = ref({ x: 0, y: 0 });
const contextMenuSrc = ref('');

const suggestedWallpapers = [
  {
    name: 'breeze-mountain.jpg',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200',
    size: '1.5 MB'
  },
  {
    name: 'breeze-abstract.jpg',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200',
    size: '1.2 MB'
  },
  {
    name: 'breeze-minimal.jpg',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200',
    size: '0.9 MB'
  },
  {
    name: 'breeze-aurora.jpg',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=1200',
    size: '2.0 MB'
  }
];

function triggerBrowserToast(msg: string) {
  browserToast.value = msg;
  setTimeout(() => {
    browserToast.value = '';
  }, 4000);
}

// ── CONTROLADORES DE PESTAÑAS ──

function selectTab(tabId: string) {
  activeTabId.value = tabId;
  const tab = tabs.value.find(t => t.id === tabId);
  if (tab) {
    inputUrl.value = tab.url;
    isLoading.value = tab.loading;
  }
  nextTick(() => {
    forceWebviewResize();
  });
}

function addTab(url = 'https://google.com') {
  const id = `tab-${Date.now()}`;
  tabs.value.push({
    id,
    title: 'Nueva pestaña',
    url,
    loading: false,
    canGoBack: false,
    canGoForward: false
  });
  nextTick(() => {
    selectTab(id);
  });
}

function closeTab(tabId: string) {
  // Mantener al menos una pestaña siempre abierta
  if (tabs.value.length <= 1) {
    const tab = tabs.value[0];
    if (tab) {
      tab.url = 'https://google.com';
      tab.title = 'Google';
      inputUrl.value = 'https://google.com';
      const wv = webviewRefs.value[tab.id];
      if (wv) wv.loadURL('https://google.com');
    }
    return;
  }

  const idx = tabs.value.findIndex(t => t.id === tabId);
  if (idx === -1) return;

  // Si cerramos la pestaña activa, transfiere el foco
  if (activeTabId.value === tabId) {
    let nextIdx = idx + 1;
    if (nextIdx >= tabs.value.length) {
      nextIdx = idx - 1;
    }
    const nextTab = tabs.value[nextIdx];
    if (nextTab) {
      activeTabId.value = nextTab.id;
      inputUrl.value = nextTab.url;
      isLoading.value = nextTab.loading;
    }
  }

  // Eliminar elemento de caché
  delete webviewRefs.value[tabId];
  tabs.value = tabs.value.filter(t => t.id !== tabId);
}

// Registro dinámico y asociación programática de webviews para controlar sus eventos nativos
function registerWebview(tabId: string, el: any) {
  if (webviewRefs.value[tabId] === el) return;
  webviewRefs.value[tabId] = el;

  el.addEventListener('did-start-loading', () => {
    const tab = tabs.value.find(t => t.id === tabId);
    if (tab) {
      tab.loading = true;
      if (tabId === activeTabId.value) {
        isLoading.value = true;
      }
    }
  });

  el.addEventListener('did-stop-loading', () => {
    const tab = tabs.value.find(t => t.id === tabId);
    if (tab) {
      tab.loading = false;
      if (tabId === activeTabId.value) {
        isLoading.value = false;
      }

      const rawUrl = el.getURL();
      if (rawUrl && rawUrl !== 'about:blank') {
        tab.url = rawUrl;
        if (tabId === activeTabId.value) {
          inputUrl.value = rawUrl;
        }
      }

      const pTitle = el.getTitle();
      if (pTitle) {
        tab.title = pTitle;
      }

      tab.canGoBack = el.canGoBack();
      tab.canGoForward = el.canGoForward();
    }
    syncVolumeToWebview(tabId);
  });

  el.addEventListener('dom-ready', () => {
    syncVolumeToWebview(tabId);
  });

  el.addEventListener('context-menu', handleWebviewContextMenu);
}

// ── DESCARGAS SUGERIDAS E IMPORTACIONES ──

function downloadSuggested(sug: { name: string; url: string; size: string }) {
  osStore.addFileToFolder('Descargas', {
    name: sug.name,
    type: 'file',
    size: sug.size,
    dataUrl: sug.url
  });
  triggerBrowserToast(`¡${sug.name} guardado en Descargas! Múevelo en el Explorador a Imágenes para usarlo.`);
}

function downloadCustomUrl() {
  const url = customUrl.value.trim();
  if (!url) return;

  if (!/^https?:\/\/.+/i.test(url)) {
    triggerBrowserToast('⚠️ Error: Ingresa una URL válida que inicie con http:// o https://');
    return;
  }

  triggerBrowserToast('🔍 Validando y descargando imagen...');

  const testImg = new Image();
  testImg.src = url;

  testImg.onload = () => {
    let name = customFilename.value.trim();
    if (!name) {
      name = `imagen-${Date.now()}`;
    }
    if (!name.endsWith('.jpg') && !name.endsWith('.png') && !name.endsWith('.jpeg')) {
      name += '.jpg';
    }

    osStore.addFileToFolder('Descargas', {
      name,
      type: 'file',
      size: '850 KB',
      dataUrl: url
    });

    triggerBrowserToast(`¡${name} guardado en Descargas! Múevela en el Explorador a Imágenes para usarla.`);
    customUrl.value = '';
    customFilename.value = '';
  };

  testImg.onerror = () => {
    triggerBrowserToast('⚠️ Error: No se pudo cargar la imagen. Verifica el enlace o CORS.');
  };
}

function setAsWallpaperFromUrl(url: string) {
  isContextMenuOpen.value = false;
  triggerBrowserToast('🔍 Validando imagen...');

  const testImg = new Image();
  testImg.src = url;

  testImg.onload = () => {
    const filename = `fondo-${Date.now().toString().slice(-4)}.jpg`;

    osStore.addFileToFolder('Imágenes', {
      name: filename,
      type: 'file',
      size: '1.2 MB',
      dataUrl: url
    });

    configStore.setWallpaper(url);
    triggerBrowserToast(`🚀 ¡Escritorio actualizado con éxito a "${filename}"!`);
  };

  testImg.onerror = () => {
    triggerBrowserToast('⚠️ Error CORS: El servidor remoto no permite descargas directas.');
  };
}

function downloadToDescargas(url: string) {
  isContextMenuOpen.value = false;
  triggerBrowserToast('🔍 Descargando...');

  const testImg = new Image();
  testImg.src = url;

  testImg.onload = () => {
    const filename = `descarga-web-${Date.now().toString().slice(-4)}.jpg`;

    osStore.addFileToFolder('Descargas', {
      name: filename,
      type: 'file',
      size: '980 KB',
      dataUrl: url
    });

    triggerBrowserToast(`¡${filename} guardado en Descargas!`);
  };

  testImg.onerror = () => {
    triggerBrowserToast('⚠️ Error: El servidor remoto no permite descargas directas (CORS).');
  };
}

const contextMenuParams = ref<any>(null);

function copyToClipboard(text: string, successMsg = 'Texto copiado.') {
  isContextMenuOpen.value = false;
  navigator.clipboard.writeText(text).then(() => {
    triggerBrowserToast(`📋 ${successMsg}`);
  }).catch(() => {
    triggerBrowserToast('⚠️ Error al copiar al portapapeles.');
  });
}

function openLinkInNewTab(url: string) {
  isContextMenuOpen.value = false;
  addTab(url);
}

function searchInGoogle(text: string) {
  isContextMenuOpen.value = false;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(text.trim())}`;
  addTab(searchUrl);
}

function closeContextMenu() {
  isContextMenuOpen.value = false;
}

function handleWebviewContextMenu(e: any) {
  const { params } = e;
  if (!params) return;

  e.preventDefault();
  contextMenuParams.value = params;
  contextMenuPos.value = {
    x: params.x,
    y: params.y + 74
  };
  isContextMenuOpen.value = true;
}

// ── NAVEGACIÓN Y RESIZE ──

const containerRef = ref<HTMLDivElement | null>(null);
let resizeObserver: ResizeObserver | null = null;
let cleanupNavigateListener: (() => void) | null = null;
let cleanupProgressListener: (() => void) | null = null;

function mapsToUrl() {
  const raw = inputUrl.value.trim();
  if (!raw) return;

  const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  inputUrl.value = normalized;

  const tab = tabs.value.find(t => t.id === activeTabId.value);
  if (tab) {
    tab.url = normalized;
    const wv = webviewRefs.value[tab.id];
    if (wv) {
      wv.loadURL(normalized);
    }
  }
}

function syncVolumeToWebview(tabId?: string) {
  const volumeVal = audioStore.isMuted ? 0 : audioStore.volume / 100;
  const isMutedVal = audioStore.isMuted;

  const jsScript = `
    (function() {
      const mediaElements = document.querySelectorAll('video, audio');
      mediaElements.forEach(el => {
        el.volume = ${volumeVal};
        el.muted = ${isMutedVal};
      });
    })();
  `;

  if (tabId) {
    const wv = webviewRefs.value[tabId];
    if (wv) {
      wv.executeJavaScript(jsScript).catch((err: any) => {
        console.debug('[BrowserApp WebView] Error synchronizing audio volume:', err);
      });
    }
  } else {
    Object.values(webviewRefs.value).forEach((wv: any) => {
      wv.executeJavaScript(jsScript).catch((err: any) => {
        console.debug('[BrowserApp WebView] Error synchronizing audio volume:', err);
      });
    });
  }
}

watch(
  () => [audioStore.volume, audioStore.isMuted],
  () => {
    syncVolumeToWebview();
  },
  { deep: true }
);

function goBack() {
  const wv = webviewRefs.value[activeTabId.value];
  if (wv && wv.canGoBack()) {
    wv.goBack();
  }
}

function goForward() {
  const wv = webviewRefs.value[activeTabId.value];
  if (wv && wv.canGoForward()) {
    wv.goForward();
  }
}

function reload() {
  const wv = webviewRefs.value[activeTabId.value];
  if (wv) {
    wv.reload();
  }
}

function selectOnFocus(e: FocusEvent) {
  (e.target as HTMLInputElement).select();
}

function forceWebviewResize() {
  const wv = webviewRefs.value[activeTabId.value];
  if (!wv) return;
  const { offsetWidth, offsetHeight } = wv;
  wv.style.width = `${offsetWidth}px`;
  wv.style.height = `${offsetHeight}px`;
  requestAnimationFrame(() => {
    wv.style.width = '100%';
    wv.style.height = '100%';
  });
}

onMounted(async () => {
  await nextTick();

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      forceWebviewResize();
    });
    resizeObserver.observe(containerRef.value);
  }

  // Escuchar URLs redirigidas desde el main process
  const osAPI = (window as any).osAPI;
  if (osAPI?.onWebviewNavigate) {
    cleanupNavigateListener = osAPI.onWebviewNavigate((url: string) => {
      const tab = tabs.value.find(t => t.id === activeTabId.value);
      if (tab && url) {
        tab.url = url;
        inputUrl.value = url;
        const wv = webviewRefs.value[tab.id];
        if (wv) {
          wv.loadURL(url);
        }
      }
    });
  }

  // Escuchar progreso de descargas físicas reales desde Electron
  if (osAPI?.onDownloadProgress) {
    cleanupProgressListener = osAPI.onDownloadProgress((data: { filename: string; progress: number }) => {
      triggerBrowserToast(`📥 Descargando: "${data.filename}" (${data.progress}%)`);
    });
  }

  window.addEventListener('click', closeContextMenu);
  setTimeout(() => forceWebviewResize(), 200);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  cleanupNavigateListener?.();
  cleanupProgressListener?.();
  window.removeEventListener('click', closeContextMenu);
});
</script>

<style scoped>
.browser-root {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: var(--font-family-base);
}

/* ── Fila de Pestañas Estilo KDE Breeze ── */
.tabs-strip {
  display: flex;
  align-items: flex-end;
  height: 32px;
  background: #1b1e20;
  border-bottom: 1px solid var(--border-color);
  padding: 0 8px;
  gap: 4px;
  flex-shrink: 0;
  overflow: hidden;
}

:global(.light-theme) .tabs-strip {
  background: #eff0f1;
}

.tabs-container {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs-container::-webkit-scrollbar {
  display: none;
}

.browser-tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  width: 140px;
  max-width: 140px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  padding: 0 10px;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  min-width: 80px;
}

:global(.light-theme) .browser-tab-item {
  background: rgba(0, 0, 0, 0.03);
}

.browser-tab-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

:global(.light-theme) .browser-tab-item:hover {
  background: rgba(0, 0, 0, 0.06);
}

.browser-tab-item.tab-active {
  background: var(--bg-secondary) !important;
  border-color: var(--border-color);
  border-top: 2px solid var(--accent);
  z-index: 2;
}

.tab-favicon {
  width: 12px;
  height: 12px;
  color: var(--accent);
  flex-shrink: 0;
}

.tab-title-text {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.tab-active .tab-title-text {
  color: var(--text-primary);
  font-weight: 600;
}

.close-tab-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.15s ease;
  line-height: 1;
}

.close-tab-btn:hover {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

/* Botón Añadir Pestaña */
.add-tab-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
  transition: all var(--transition-fast) ease;
}

.add-tab-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--accent);
}

:global(.light-theme) .add-tab-btn:hover {
  background: rgba(0, 0, 0, 0.06);
}

.add-tab-icon {
  width: 12px;
  height: 12px;
}

/* ── Barra de Dirección ── */
.address-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  flex-shrink: 0;
  padding: 0 12px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-subtle);
  -webkit-app-region: no-drag;
}

/* Botones de control de navegación */
.nav-controls {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.nav-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--accent);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-icon {
  width: 14px;
  height: 14px;
}

.spinning {
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Campo de URL */
.url-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 8px;
  height: 32px;
  padding: 0 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  transition: all var(--transition-fast);
}

.url-wrapper:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(61, 174, 233, 0.4);
}

.url-icon {
  width: 14px;
  height: 14px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.url-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 0.82rem;
  color: var(--text-primary);
}

.url-input::placeholder {
  color: var(--text-disabled);
}

.webview-container {
  position: absolute;
  top: 74px; /* Shifted down because of tabs-strip (32px) + address-bar (42px) */
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  transition: right 0.3s ease;
}

.web-engine {
  position: absolute;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  border: none !important;
  background-color: #ffffff;
  display: inline-flex !important;
}

/* Botón Galería de Fondos */
.wallpaper-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 14px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.wallpaper-toggle-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
}

.wallpaper-active {
  background: var(--accent) !important;
  color: #ffffff !important;
  border-color: var(--accent) !important;
}

.wallpaper-btn-icon {
  width: 14px;
  height: 14px;
}

/* Drawer de Fondos */
.wallpaper-drawer {
  position: absolute;
  top: 74px; /* Shifted down because of tabs-strip (32px) + address-bar (42px) */
  right: -320px;
  width: 320px;
  bottom: 0;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  box-shadow: var(--shadow-window);
  display: flex;
  flex-direction: column;
  transition: right 0.3s ease;
  z-index: 10;
  padding: 20px;
  color: var(--text-primary);
  overflow-y: auto;
}

.drawer-open {
  right: 0 !important;
}

.drawer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.drawer-header-icon {
  width: 24px;
  height: 24px;
  color: var(--accent);
}

.drawer-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.drawer-subtitle {
  font-size: 0.72rem;
  color: var(--text-secondary);
  display: block;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.drawer-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  font-size: 0.75rem;
  font-weight: bold;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

/* Formulario */
.paste-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drawer-input {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px 12px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.78rem;
  outline: none;
  transition: border-color 0.2s;
}

.drawer-input:focus {
  border-color: var(--accent);
}

.import-btn {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.import-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--accent);
  color: var(--accent);
}

.import-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.drawer-divider {
  height: 1px;
  background: var(--border-color);
}

/* Sugeridos */
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sug-card {
  display: flex;
  gap: 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  padding: 8px;
  border-radius: 4px;
  align-items: center;
  transition: border-color 0.2s;
}

.sug-card:hover {
  border-color: var(--accent);
}

.sug-thumb {
  width: 72px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.sug-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sug-name {
  font-size: 0.72rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
}

.sug-download-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 10px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;
  width: fit-content;
  transition: all var(--transition-fast);
}

.sug-download-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
  color: var(--accent);
}

/* Toast flotante */
.save-toast {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent);
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: bold;
  padding: 8px 18px;
  border-radius: 4px;
  box-shadow: var(--shadow-popup);
  pointer-events: none;
  opacity: 0;
  transition: all 0.25s ease;
  z-index: 1000;
  text-align: center;
  max-width: 80%;
  line-height: 1.4;
}

.toast-visible {
  opacity: 1;
  transform: translateX(-50%) translateY(-5px);
}

/* ── MENÚ CONTEXTUAL ESTILO CHROME (BREEZE) ── */
.custom-context-menu {
  position: absolute;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 6px 0;
  width: 230px;
  box-shadow: var(--shadow-popup);
  z-index: 10000;
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.menu-item:hover {
  background: var(--bg-hover);
  color: var(--accent);
}

.menu-item-icon {
  width: 14px;
  height: 14px;
  color: var(--accent);
}

.menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}

.webview-hidden {
  width: 0 !important;
  height: 0 !important;
  opacity: 0 !important;
  pointer-events: none !important;
  position: absolute !important;
  visibility: hidden !important;
}
</style>
