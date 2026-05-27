import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useOSStore } from '@/stores/osStore';

export const useConfigStore = defineStore('config', () => {
  const osStore = useOSStore();

  // ---- Estados ----
  // Recuperar el tema guardado en localStorage o usar 'dark' por defecto
  const savedTheme = localStorage.getItem('vueui-theme') as 'dark' | 'light';
  const theme = ref<'dark' | 'light'>(savedTheme || 'dark');
  
  // Recuperar el estado del Dock o habilitarlo por defecto (true)
  const savedDock = localStorage.getItem('vueui-dock-enabled');
  const dockEnabled = ref(savedDock === null ? true : savedDock === 'true');
  
  const wallpaperIndex = ref(0);
  const savedWallpaperUrl = ref(localStorage.getItem('vueui-wallpaper-url') || '');
  const blurEnabled = ref(false);
  const networkSSID = ref(localStorage.getItem('vueui-network-ssid') || 'VueOS-5G');

  // --- Dock: Mostrar Métricas de Telemetría (Persistidas) ---
  const showDockCpu = ref(localStorage.getItem('vueui-dock-cpu') !== 'false');
  const showDockRam = ref(localStorage.getItem('vueui-dock-ram') !== 'false');
  const showDockTemp = ref(localStorage.getItem('vueui-dock-temp') !== 'false');

  // --- TopBar: Mostrar Métricas de Telemetría (Persistidas) ---
  const showTopbarCpu = ref(localStorage.getItem('vueui-topbar-cpu') !== 'false');
  const showTopbarRam = ref(localStorage.getItem('vueui-topbar-ram') !== 'false');
  const showTopbarTemp = ref(localStorage.getItem('vueui-topbar-temp') !== 'false');

  // --- Dock: Aplicaciones Ancladas Reactivas ---
  const savedPinned = localStorage.getItem('vueui-pinned-apps');
  const pinnedAppIds = ref<string[]>(
    savedPinned ? JSON.parse(savedPinned) : ['browser', 'terminal', 'settings', 'store', 'monitor', 'files']
  );

  // --- Accesos Directos del Escritorio ---
  const savedShortcuts = localStorage.getItem('vueui-desktop-shortcuts');
  const desktopShortcuts = ref<{ id: string; appId: string; title: string; position: { x: number; y: number } }[]>(
    savedShortcuts ? JSON.parse(savedShortcuts) : [
      { id: '1', appId: 'browser', title: 'Navegador Web', position: { x: 20, y: 20 } },
      { id: '2', appId: 'terminal', title: 'Terminal de Comando', position: { x: 20, y: 120 } },
      { id: '3', appId: 'store', title: 'Discover', position: { x: 20, y: 220 } }
    ]
  );

  // ---- Watchers reactivos en el Store ----
  watch(
    theme,
    (newTheme) => {
      localStorage.setItem('vueui-theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    },
    { immediate: true }
  );

  watch(
    dockEnabled,
    (newVal) => {
      localStorage.setItem('vueui-dock-enabled', String(newVal));
    }
  );

  watch(
    pinnedAppIds,
    (newVal) => {
      localStorage.setItem('vueui-pinned-apps', JSON.stringify(newVal));
    },
    { deep: true }
  );

  watch(
    desktopShortcuts,
    (newVal) => {
      localStorage.setItem('vueui-desktop-shortcuts', JSON.stringify(newVal));
    },
    { deep: true }
  );

  watch(showDockCpu, (newVal) => {
    localStorage.setItem('vueui-dock-cpu', String(newVal));
  });

  watch(showDockRam, (newVal) => {
    localStorage.setItem('vueui-dock-ram', String(newVal));
  });

  watch(showDockTemp, (newVal) => {
    localStorage.setItem('vueui-dock-temp', String(newVal));
  });

  watch(showTopbarCpu, (newVal) => {
    localStorage.setItem('vueui-topbar-cpu', String(newVal));
  });

  watch(showTopbarRam, (newVal) => {
    localStorage.setItem('vueui-topbar-ram', String(newVal));
  });

  watch(showTopbarTemp, (newVal) => {
    localStorage.setItem('vueui-topbar-temp', String(newVal));
  });

  watch(networkSSID, (newVal) => {
    localStorage.setItem('vueui-network-ssid', newVal);
  });

  // ---- Getters ----
  // Retorna todas las imágenes disponibles en el sistema de archivos virtual
  const systemWallpapers = computed(() => {
    const images: { name: string; type: 'file'; size?: string; dataUrl: string }[] = [];
    const seenUrls = new Set<string>();

    Object.keys(osStore.fileSystem).forEach((folderName) => {
      if (folderName === 'Inicio') return;
      const files = osStore.fileSystem[folderName] || [];
      files.forEach((file) => {
        if (file.type === 'file' && file.dataUrl) {
          const ext = file.name.split('.').pop()?.toLowerCase();
          const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '') ||
                          file.dataUrl.startsWith('data:image/') ||
                          file.dataUrl.startsWith('http://') ||
                          file.dataUrl.startsWith('https://');
          if (isImage && !seenUrls.has(file.dataUrl)) {
            seenUrls.add(file.dataUrl);
            images.push({ name: file.name, type: 'file', size: file.size, dataUrl: file.dataUrl });
          }
        }
      });
    });
    return images;
  });

  // Retorna la dataUrl del fondo seleccionado según la URL persistida o el índice activo
  const wallpaper = computed(() => {
    // Si hay un fondo persistido, lo preferimos directamente
    if (savedWallpaperUrl.value) {
      return savedWallpaperUrl.value;
    }
    
    // Fallback al listado e índice por defecto si no hay persistido
    const list = systemWallpapers.value;
    if (list.length === 0) return '';
    const idx = ((wallpaperIndex.value % list.length) + list.length) % list.length;
    return list[idx]?.dataUrl || '';
  });

  // Watcher para sincronizar y re-aliñar wallpaperIndex cuando cargan asíncronamente las imágenes reales del disco
  watch(
    () => systemWallpapers.value,
    (list) => {
      if (savedWallpaperUrl.value && list.length > 0) {
        const idx = list.findIndex(img => img.dataUrl === savedWallpaperUrl.value);
        if (idx !== -1) {
          wallpaperIndex.value = idx;
        }
      }
    },
    { deep: true, immediate: true }
  );

  // ---- Acciones ----
  function setTheme(newTheme: 'dark' | 'light') {
    theme.value = newTheme;
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
  }

  function setWallpaper(url: string) {
    const idx = systemWallpapers.value.findIndex((img) => img.dataUrl === url);
    if (idx !== -1) {
      wallpaperIndex.value = idx;
    }
    savedWallpaperUrl.value = url;
    localStorage.setItem('vueui-wallpaper-url', url);
  }

  // Desenfocar fondo general
  function toggleBlur() {
    blurEnabled.value = !blurEnabled.value;
  }

  function nextWallpaper() {
    const len = systemWallpapers.value.length;
    if (len > 0) {
      const nextIdx = (wallpaperIndex.value + 1) % len;
      wallpaperIndex.value = nextIdx;
      const url = systemWallpapers.value[nextIdx]?.dataUrl || '';
      if (url) {
        savedWallpaperUrl.value = url;
        localStorage.setItem('vueui-wallpaper-url', url);
      }
    }
  }

  function prevWallpaper() {
    const len = systemWallpapers.value.length;
    if (len > 0) {
      const prevIdx = (wallpaperIndex.value - 1 + len) % len;
      wallpaperIndex.value = prevIdx;
      const url = systemWallpapers.value[prevIdx]?.dataUrl || '';
      if (url) {
        savedWallpaperUrl.value = url;
        localStorage.setItem('vueui-wallpaper-url', url);
      }
    }
  }

  // --- Configuración: Navegación de Pestaña Activa en la App de Ajustes ---
  const settingsActiveTab = ref<'account' | 'wallpaper' | 'theme' | 'sounds' | 'network' | 'battery' | 'about'>('account');

  // --- Pantalla: Brillo del Sistema (Persistido) ---
  const savedBrightness = localStorage.getItem('vueui-brightness');
  const brightness = ref(savedBrightness ? parseInt(savedBrightness, 10) : 100);

  watch(brightness, (newVal) => {
    localStorage.setItem('vueui-brightness', String(newVal));
    document.documentElement.style.setProperty('--system-brightness', `${newVal}%`);
  }, { immediate: true });

  // --- Energía: Modo de Ahorro de Batería ---
  const batterySaver = ref(localStorage.getItem('vueui-battery-saver') === 'true');

  watch(batterySaver, (newVal) => {
    localStorage.setItem('vueui-battery-saver', String(newVal));
    if (newVal) {
      brightness.value = 35; // Al activar ahorro de batería se reduce el brillo al 35%
    }
  });

  // Acciones para Anclar / Desanclar del Dock
  function pinApp(appId: string) {
    if (!pinnedAppIds.value.includes(appId)) {
      pinnedAppIds.value.push(appId);
    }
  }

  function unpinApp(appId: string) {
    pinnedAppIds.value = pinnedAppIds.value.filter((id) => id !== appId);
  }

  function isAppPinned(appId: string): boolean {
    return pinnedAppIds.value.includes(appId);
  }

  function findFirstVacantPosition(): { x: number; y: number } {
    const GRID_W = 100;
    const GRID_H = 100;
    const OFFSET_X = 20;
    const OFFSET_Y = 20;

    for (let col = 0; col < 25; col++) {
      for (let row = 0; row < 12; row++) {
        const isOccupied = desktopShortcuts.value.some(s => {
          const sCol = Math.round((s.position.x - OFFSET_X) / GRID_W);
          const sRow = Math.round((s.position.y - OFFSET_Y) / GRID_H);
          return sCol === col && sRow === row;
        });

        if (!isOccupied) {
          return {
            x: OFFSET_X + col * GRID_W,
            y: OFFSET_Y + row * GRID_H
          };
        }
      }
    }
    return { x: OFFSET_X, y: OFFSET_Y };
  }

  function createDesktopShortcut(appId: string, title: string) {
    if (desktopShortcuts.value.some(s => s.appId === appId)) {
      return;
    }
    const id = crypto.randomUUID();
    const position = findFirstVacantPosition();
    desktopShortcuts.value.push({ id, appId, title, position });
  }

  function removeDesktopShortcut(appId: string) {
    desktopShortcuts.value = desktopShortcuts.value.filter(s => s.appId !== appId);
  }

  return {
    theme,
    dockEnabled,
    wallpaperIndex,
    blurEnabled,
    systemWallpapers,
    wallpaper,
    pinnedAppIds,
    showDockCpu,
    showDockRam,
    showDockTemp,
    showTopbarCpu,
    showTopbarRam,
    showTopbarTemp,
    settingsActiveTab,
    brightness,
    batterySaver,
    setTheme,
    toggleTheme,
    setWallpaper,
    toggleBlur,
    nextWallpaper,
    prevWallpaper,
    pinApp,
    unpinApp,
    isAppPinned,
    createDesktopShortcut,
    removeDesktopShortcut,
    desktopShortcuts,
    networkSSID
  };
});
