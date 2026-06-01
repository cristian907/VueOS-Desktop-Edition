import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { SYSTEM_APPS } from '@/registry/apps';
import { useOSStore } from '@/stores/osStore';
import { useConfigStore } from '@/stores/configStore';

export const useStoreStore = defineStore('store', () => {
  const osStore = useOSStore();
  const configStore = useConfigStore();

  // Apps preinstaladas por defecto (todo el catálogo excepto las de la tienda de terceros)
  const defaultPreinstalledAppIds = SYSTEM_APPS
    .filter((app) => app.id !== 'elisaplayer' && app.id !== 'kate' && app.id !== 'sysbench' && app.id !== 'kmarkdown')
    .map((app) => app.id);

  const savedInstalled = localStorage.getItem('vueui-installed-apps');
  
  // Estado: IDs de aplicaciones instaladas
  const installedAppIds = ref<string[]>(
    savedInstalled ? JSON.parse(savedInstalled) : [...defaultPreinstalledAppIds]
  );

  // Watcher para persistencia automática
  watch(
    installedAppIds,
    (newVal) => {
      localStorage.setItem('vueui-installed-apps', JSON.stringify(newVal));
    },
    { deep: true }
  );

  // Getters
  // Aplicaciones disponibles para descargar (no instaladas y que no son esenciales)
  const availableApps = computed(() => {
    return SYSTEM_APPS.filter(
      (app) => !installedAppIds.value.includes(app.id) && !app.isSystemEssential
    );
  });

  // Aplicaciones que están instaladas y que no son esenciales (para administrar en la tienda)
  const installedStoreApps = computed(() => {
    return SYSTEM_APPS.filter(
      (app) => installedAppIds.value.includes(app.id) && !app.isSystemEssential
    );
  });

  // Acciones
  function installApp(id: string) {
    if (!installedAppIds.value.includes(id)) {
      installedAppIds.value.push(id);
    }
  }

  function uninstallApp(id: string) {
    const appEntry = SYSTEM_APPS.find((app) => app.id === id);
    if (!appEntry || appEntry.isSystemEssential) {
      return; // Protección de seguridad temprana
    }

    installedAppIds.value = installedAppIds.value.filter((appId) => appId !== id);

    // Cierre robusto: Cerrar cualquier ventana abierta asociada a esta app desinstalada
    const windowsToClose = osStore.windows.filter((w) => w.appName === appEntry.name);
    windowsToClose.forEach((win) => {
      osStore.closeWindow(win.id);
    });

    // Desanclar automáticamente de la barra de tareas y eliminar del escritorio
    configStore.unpinApp(id);
    configStore.removeDesktopShortcut(id);
  }

  function isAppInstalled(id: string): boolean {
    return installedAppIds.value.includes(id);
  }

  return {
    installedAppIds,
    availableApps,
    installedStoreApps,
    installApp,
    uninstallApp,
    isAppInstalled
  };
});
