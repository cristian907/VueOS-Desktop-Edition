import { defineStore } from 'pinia';
import { ref, computed, onMounted } from 'vue';
import type { WindowProcess, HardwareStats } from '@/types/os';
import { useConfigStore } from '@/stores/configStore';
import { SYSTEM_APPS } from '@/registry/apps';

// Offset en cascada para cada nueva ventana
const CASCADE_OFFSET = 30;

export const useOSStore = defineStore('os', () => {
  // ---- State ----
  const windows = ref<WindowProcess[]>([]);
  const activeWindowId = ref<string | null>(null);
  const baseZIndex = ref(100);
  const stats = ref<HardwareStats>({
    cpu_usage: 0,
    ram_usage: 0,
    batteryLevel: 85,
    batteryCharging: false,
    networkOnline: true,
    cpu_temp: 42
  });
  // Controla si el sistema operativo está experimentando el reinicio del Kernel
  const isBooting = ref(false);
  // Controla si el usuario superó la pantalla de bloqueo
  const isAuthenticated = ref(false);
  // Controla si el menú general de aplicaciones (App Grid) está visible
  const isLauncherOpen = ref(false);

  // ---- Sistema de Archivos Virtual Centralizado ----
  const fileSystem = ref<Record<string, { name: string; type: 'dir' | 'file'; size?: string; dataUrl?: string }[]>>({
    Inicio: [
      { name: 'Descargas', type: 'dir' },
      { name: 'Documentos', type: 'dir' },
      { name: 'Imágenes', type: 'dir' }
    ],
    Descargas: [
      { name: 'vue-os-v2.iso', type: 'file', size: '2.4 GB' },
      { name: 'config.json', type: 'file', size: '1.2 KB' }
    ],
    Documentos: [
      { name: 'proyecto-sistemas.pdf', type: 'file', size: '3.6 MB' },
      { name: 'bitacora-desarrollo.txt', type: 'file', size: '14 KB' },
      { name: 'vueui-arquitectura.docx', type: 'file', size: '512 KB' }
    ],
    Imágenes: [
      { name: 'breeze-mountain.jpg', type: 'file', size: '1.5 MB', dataUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200' },
      { name: 'breeze-abstract.jpg', type: 'file', size: '1.2 MB', dataUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200' },
      { name: 'desktop-mockup.png', type: 'file', size: '4.7 MB', dataUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200' }
    ]
  });

  // ---- Getters ----
  const activeWindow = computed(() =>
    windows.value.find((w) => w.id === activeWindowId.value) ?? null,
  );

  const visibleWindows = computed(() =>
    windows.value.filter((w) => !w.isMinimized),
  );

  // ---- Actions ----

  /**
   * Registra un nuevo proceso de ventana.
   * Posiciona en cascada según el número de ventanas abiertas.
   */
  function openWindow(
    appNameOrApp: string | { name: string; title: string; defaultWidth?: number; defaultHeight?: number },
    title?: string,
    defaultWidth?: number,
    defaultHeight?: number,
  ): string {
    let appName: string;
    let windowTitle: string;
    let width = 800;
    let height = 500;

    if (typeof appNameOrApp === 'object' && appNameOrApp !== null) {
      appName = appNameOrApp.name;
      windowTitle = appNameOrApp.title;
      width = appNameOrApp.defaultWidth ?? 800;
      height = appNameOrApp.defaultHeight ?? 500;
    } else {
      appName = appNameOrApp;
      windowTitle = title ?? '';
      width = defaultWidth ?? 800;
      height = defaultHeight ?? 500;
    }

    // Redirección de Centro de Redes (NetworkApp) a la pestaña de redes de la app de Configuración
    if (appName === 'NetworkApp') {
      const configStore = useConfigStore();
      configStore.settingsActiveTab = 'network';

      const existingSettings = windows.value.find((w) => w.appName === 'SettingsApp');
      if (existingSettings) {
        existingSettings.isMinimized = false;
        focusWindow(existingSettings.id);
        return existingSettings.id;
      } else {
        const settingsApp = SYSTEM_APPS.find((app) => app.name === 'SettingsApp');
        if (settingsApp) {
          return openWindow(settingsApp);
        }
      }
    }

    const id = crypto.randomUUID();
    const cascade = windows.value.length;

    const process: WindowProcess = {
      id,
      appName,
      title: windowTitle,
      zIndex: baseZIndex.value++,
      isMinimized: false,
      isMaximized: false,
      position: {
        x: 80 + cascade * CASCADE_OFFSET,
        y: 60 + cascade * CASCADE_OFFSET,
      },
      dimensions: {
        width,
        height,
      },
    };

    windows.value.push(process);
    activeWindowId.value = id;

    return id;
  }

  /**
   * Trae una ventana al frente incrementando el baseZIndex global
   * y asignándoselo a la ventana seleccionada.
   */
  function focusWindow(id: string): void {
    const win = windows.value.find((w) => w.id === id);
    if (!win) return;

    if (win.isMinimized) {
      win.isMinimized = false;
    }

    win.zIndex = baseZIndex.value++;
    activeWindowId.value = id;
  }

  /** Elimina una ventana del array de procesos */
  function closeWindow(id: string): void {
    windows.value = windows.value.filter((w) => w.id !== id);

    // Re-activar la ventana visible con el zIndex más alto
    if (activeWindowId.value === id) {
      const topWindow = [...windows.value]
        .filter((w) => !w.isMinimized)
        .sort((a, b) => b.zIndex - a.zIndex)[0];
      activeWindowId.value = topWindow?.id ?? null;
    }
  }

  /** Actualiza las coordenadas de una ventana (Drag & Drop) */
  function updateWindowPosition(id: string, x: number, y: number): void {
    const win = windows.value.find((w) => w.id === id);
    if (!win) return;
    win.position.x = x;
    win.position.y = y;
  }

  /** Minimiza una ventana */
  function minimizeWindow(id: string): void {
    const win = windows.value.find((w) => w.id === id);
    if (!win) return;
    win.isMinimized = true;

    if (activeWindowId.value === id) {
      activeWindowId.value = null;
    }
  }

  /** Alterna el estado maximizado */
  function toggleMaximize(id: string): void {
    const win = windows.value.find((w) => w.id === id);
    if (!win) return;
    win.isMaximized = !win.isMaximized;
  }

  /** Actualiza las estadísticas de hardware desde el Kernel */
  function updateStats(incoming: HardwareStats): void {
    // Mantener estado físico real para red y batería
    if (incoming.batteryLevel !== undefined) stats.value.batteryLevel = incoming.batteryLevel;
    if (incoming.batteryCharging !== undefined) stats.value.batteryCharging = incoming.batteryCharging;
    if (incoming.networkOnline !== undefined) stats.value.networkOnline = incoming.networkOnline;
  }

  /** Autentica al usuario y desbloquea el escritorio */
  function unlock(): void {
    isAuthenticated.value = true;
  }

  /** Alterna la visibilidad del launcher de aplicaciones */
  function toggleLauncher(): void {
    isLauncherOpen.value = !isLauncherOpen.value;
  }

  /** Inyecta un archivo nuevo dentro de un directorio específico */
  function addFileToFolder(folderName: string, file: { name: string; type: 'dir' | 'file'; size?: string; dataUrl?: string; content?: string }): void {
    if (fileSystem.value[folderName]) {
      fileSystem.value[folderName] = [
        ...fileSystem.value[folderName].filter((f) => f.name !== file.name),
        file
      ];

      // Si es un archivo de texto virtual (.docx, .xlsx, .txt) y tiene dataUrl pero no content,
      // asignamos content = dataUrl para que Electron lo guarde como texto plano UTF-8.
      const dotIndex = file.name.lastIndexOf('.');
      const ext = dotIndex !== -1 ? file.name.slice(dotIndex).toLowerCase() : '';
      let fileContent = file.content;
      if (['.docx', '.xlsx', '.txt', '.pdf'].includes(ext) && file.dataUrl && !fileContent) {
        fileContent = file.dataUrl;
      }

      // Guardar físicamente en Electron
      if (window.osAPI && window.osAPI.writeFile) {
        window.osAPI.writeFile(folderName, file.name, {
          content: fileContent || '',
          dataUrl: file.dataUrl || ''
        }).catch((err) => console.error('[osStore] Error al guardar archivo físico:', err));
      }
    }
  }

  /** Elimina un archivo de un directorio específico y del disco físico */
  function removeFileFromFolder(folderName: string, filename: string): void {
    if (fileSystem.value[folderName]) {
      fileSystem.value[folderName] = fileSystem.value[folderName].filter((f) => f.name !== filename);

      // Eliminar físicamente en Electron
      if (window.osAPI && window.osAPI.deleteFile) {
        window.osAPI.deleteFile(folderName, filename).catch((err) =>
          console.error('[osStore] Error al eliminar archivo físico:', err)
        );
      }
    }
  }

  // Cargar sistema de archivos persistido al iniciar si corre en Electron
  onMounted(async () => {
    if (window.osAPI && window.osAPI.readWorkspace) {
      try {
        const physicalFs = await window.osAPI.readWorkspace();
        if (physicalFs) {
          // Función auxiliar para rellenar dataUrl a partir de content en archivos de texto
          const syncWorkspaceFiles = (files: any[]) => {
            return files.map(file => {
              const dotIndex = file.name.lastIndexOf('.');
              const ext = dotIndex !== -1 ? file.name.slice(dotIndex).toLowerCase() : '';
              if (['.docx', '.xlsx', '.txt', '.pdf'].includes(ext) && file.content && !file.dataUrl) {
                return { ...file, dataUrl: file.content };
              }
              return file;
            });
          };

          if (physicalFs.Descargas && physicalFs.Descargas.length > 0) {
            fileSystem.value.Descargas = syncWorkspaceFiles(physicalFs.Descargas);
          }
          if (physicalFs.Documentos && physicalFs.Documentos.length > 0) {
            fileSystem.value.Documentos = syncWorkspaceFiles(physicalFs.Documentos);
          }
          if (physicalFs.Imágenes && physicalFs.Imágenes.length > 0) {
            fileSystem.value.Imágenes = physicalFs.Imágenes;
          }

          // Sincronizar documentos cargados con la app de Notas
          const productivityStore = (await import('@/stores/productivityStore')).useProductivityStore();
          if (productivityStore && productivityStore.syncNotesFromFileSystem) {
            productivityStore.syncNotesFromFileSystem(fileSystem.value.Documentos || []);
          }
        }
      } catch (err) {
        console.error('[osStore] Error loading physical workspace on startup:', err);
      }
    }

    // Escuchar notificaciones de descargas físicas completadas desde Electron
    if ((window as any).osAPI && (window as any).osAPI.onDownloadCompleted) {
      (window as any).osAPI.onDownloadCompleted((data: { folder: string; name: string; size: string }) => {
        addFileToFolder(data.folder, {
          name: data.name,
          type: 'file',
          size: data.size
        });
        showSystemNotification(`Archivo "${data.name}" descargado en ${data.folder} con éxito.`, 'info', 'Descarga Completada');
      });
    }
  });

  const contextMenu = ref<{
    isOpen: boolean;
    x: number;
    y: number;
    app: { id: string; name: string; title: string; icon: any } | null;
    type: 'dock' | 'launcher' | 'shortcut';
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    app: null,
    type: 'launcher',
  });

  // Archivo solicitado para abrir en su programa correspondiente
  const activeOpenFile = ref<{ name: string; folder: string; dataUrl?: string } | null>(null);

  function openContextMenu(x: number, y: number, app: any, type: 'dock' | 'launcher' | 'shortcut') {
    contextMenu.value = {
      isOpen: true,
      x,
      y,
      app,
      type,
    };
  }

  function closeContextMenu() {
    contextMenu.value.isOpen = false;
  }

  // ---- Notificaciones Globales del Sistema (OOM, etc.) ----
  const systemNotification = ref<{ title: string; message: string; type: 'info' | 'warning' | 'error' } | null>(null);

  function showSystemNotification(message: string, type: 'info' | 'warning' | 'error' = 'info', title?: string) {
    let finalTitle = title;
    if (!finalTitle) {
      if (type === 'error') finalTitle = 'Error del Sistema';
      else if (type === 'warning') finalTitle = 'Alerta del Sistema';
      else finalTitle = 'Notificación';
    }
    systemNotification.value = { title: finalTitle, message, type };
    setTimeout(() => {
      systemNotification.value = null;
    }, 4500);
  }

  // ---- Estado de Versión y Actualizaciones del Sistema ----
  const systemVersion = ref('1.0.0');
  const isUpdating = ref(false);
  const updateProgress = ref(0);

  function triggerSystemUpdate() {
    isUpdating.value = true;
    updateProgress.value = 0;
    
    const interval = setInterval(() => {
      if (updateProgress.value >= 100) {
        clearInterval(interval);
        systemVersion.value = '1.1.0';
        isUpdating.value = false;
        
        // Lanzar proceso de reinicio del sistema (Kernel Reboot)
        isBooting.value = true;
        windows.value = [];
        try {
          const audioCtx = (window as any).audioContext;
          if (audioCtx) audioCtx.close();
        } catch (e) {}

        setTimeout(() => {
          isBooting.value = false;
          isAuthenticated.value = false;
        }, 5000);
      } else {
        updateProgress.value += 4;
      }
    }, 150);
  }

  // ---- Simulación e Historial de Procesos ----
  const baseProcMetrics = ref({
    goDaemonCpu: 1.2,
    goDaemonRam: 42.5,
    electronCpu: 4.8,
    electronRam: 128.4,
    vueCpu: 2.1,
    vueRam: 89.2,
    kernelCpu: 0.5,
    kernelRam: 16.1,
    compositorCpu: 3.5,
    compositorRam: 74.0
  });

  const windowMetrics = ref<Record<string, { cpu: number; ram: number }>>({});
  const cpuStressBenchmark = ref(0);

  const processes = computed(() => {
    const list: Array<{ pid: number; name: string; cpu: number; ram: number; isApp: boolean; winId?: string }> = [
      { pid: 1402, name: 'go-daemon', cpu: baseProcMetrics.value.goDaemonCpu, ram: baseProcMetrics.value.goDaemonRam, isApp: false },
      { pid: 2195, name: 'electron-shell', cpu: baseProcMetrics.value.electronCpu, ram: baseProcMetrics.value.electronRam, isApp: false },
      { pid: 3108, name: 'vue-dev-server', cpu: baseProcMetrics.value.vueCpu, ram: baseProcMetrics.value.vueRam, isApp: false },
      { pid: 884,  name: 'vue-kernel', cpu: baseProcMetrics.value.kernelCpu, ram: baseProcMetrics.value.kernelRam, isApp: false },
      { pid: 4210, name: 'kwin-compositor', cpu: baseProcMetrics.value.compositorCpu, ram: baseProcMetrics.value.compositorRam, isApp: false }
    ];

    windows.value.forEach((win) => {
      const hash = win.id.split('-').reduce((acc, part) => acc + parseInt(part, 16) || 0, 0);
      const pid = 5000 + (Math.abs(hash) % 4000);
      
      if (!windowMetrics.value[win.id]) {
        windowMetrics.value[win.id] = {
          cpu: 5.0 + Math.random() * 10.0, // 5% a 15% de CPU
          ram: 1800.0 + Math.random() * 1000.0 // 1.8 GB a 3.0 GB de RAM para que sea muy descriptivo
        };
      }
      
      list.push({
        pid,
        name: `${win.title || win.appName} (${win.appName})`,
        cpu: windowMetrics.value[win.id].cpu,
        ram: windowMetrics.value[win.id].ram,
        isApp: true,
        winId: win.id
      });
    });

    return list;
  });

  const sortedProcesses = computed(() => {
    return [...processes.value].sort((a, b) => b.cpu - a.cpu);
  });

  const diskActivePercent = ref(12);

  const cpuHistory = ref<number[]>(Array(35).fill(0));
  const ramHistory = ref<number[]>(Array(35).fill(0));
  const diskHistory = ref<number[]>(Array(35).fill(12));

  function simulateTick() {
    // 1. Fluctuar recursos generales del sistema
    baseProcMetrics.value.goDaemonCpu = Math.max(0.1, baseProcMetrics.value.goDaemonCpu + (Math.random() - 0.5) * 0.3);
    baseProcMetrics.value.goDaemonRam = Math.max(15, baseProcMetrics.value.goDaemonRam + (Math.random() - 0.5) * 0.5);
    
    baseProcMetrics.value.electronCpu = Math.max(0.5, baseProcMetrics.value.electronCpu + (Math.random() - 0.5) * 0.7);
    baseProcMetrics.value.electronRam = Math.max(40, baseProcMetrics.value.electronRam + (Math.random() - 0.5) * 1.2);
    
    baseProcMetrics.value.vueCpu = Math.max(0.2, baseProcMetrics.value.vueCpu + (Math.random() - 0.5) * 0.4);
    baseProcMetrics.value.vueRam = Math.max(30, baseProcMetrics.value.vueRam + (Math.random() - 0.5) * 0.8);

    // 2. Fluctuar y mantener métricas de ventanas abiertas
    const currentIds = windows.value.map(w => w.id);
    Object.keys(windowMetrics.value).forEach((id) => {
      if (!currentIds.includes(id)) {
        delete windowMetrics.value[id];
      }
    });

    currentIds.forEach((id) => {
      if (windowMetrics.value[id]) {
        windowMetrics.value[id].cpu = Math.max(1.0, windowMetrics.value[id].cpu + (Math.random() - 0.5) * 1.5);
        windowMetrics.value[id].ram = Math.max(100, windowMetrics.value[id].ram + (Math.random() - 0.5) * 35);
      }
    });

    // 3. Sumarizar uso total simulado
    let totalCpu = processes.value.reduce((sum, p) => sum + p.cpu, 0);
    let totalRamMb = processes.value.reduce((sum, p) => sum + p.ram, 0);

    // 4. Si hay estrés de benchmark, aplicarlo
    if (cpuStressBenchmark.value > 0) {
      totalCpu = Math.max(totalCpu, cpuStressBenchmark.value);
      totalRamMb += (cpuStressBenchmark.value / 100) * 2048; // hasta +2GB en benchmark
    }

    // 5. Convertir a porcentajes
    const totalRam = 16384; // 16 GB en MB
    const ramUsagePercent = Math.min(99, Math.max(1, (totalRamMb / totalRam) * 100));
    const cpuUsagePercent = Math.min(100, Math.max(1, totalCpu));

    // OOM Killer: si la RAM supera el 90%, matar la ventana más antigua
    if (ramUsagePercent > 90 && windows.value.length > 0) {
      const oldestWin = windows.value[0];
      closeWindow(oldestWin.id);
      showSystemNotification(`OOM Killer: Se cerró la aplicación más antigua "${oldestWin.title || oldestWin.appName}" por sobrecarga de memoria (>90%).`, 'warning', 'Alerta de Memoria');
      
      // Recalcular el tick inmediatamente para evitar el pico del 90% en este ciclo
      simulateTick();
      return;
    }

    // 6. Fluctuar temperatura en base a CPU (Ryzen 7 5800H: idle ~38°C hasta ~90°C)
    const targetTemp = Math.round(38 + (cpuUsagePercent / 100) * 48 + (Math.random() - 0.5) * 2);
    
    // 7. Calcular actividad de disco NVMe
    diskActivePercent.value = Math.max(2, Math.min(100, 5 + (Math.random() - 0.5) * 4 + (cpuUsagePercent * 0.15)));

    // 8. Actualizar las estadísticas de forma unificada
    stats.value.cpu_usage = cpuUsagePercent;
    stats.value.ram_usage = ramUsagePercent;
    stats.value.cpu_temp = targetTemp;

    // 9. Actualizar historiales de gráficos
    cpuHistory.value.push(cpuUsagePercent);
    if (cpuHistory.value.length > 35) cpuHistory.value.shift();

    ramHistory.value.push(ramUsagePercent);
    if (ramHistory.value.length > 35) ramHistory.value.shift();

    diskHistory.value.push(diskActivePercent.value);
    if (diskHistory.value.length > 35) diskHistory.value.shift();
  }

  // Ejecutar el temporizador de simulación en segundo plano
  setInterval(simulateTick, 1000);

  return {
    // State
    windows,
    activeWindowId,
    baseZIndex,
    stats,
    isBooting,
    isAuthenticated,
    isLauncherOpen,
    fileSystem,
    contextMenu,
    activeOpenFile,
    // Global notifications
    systemNotification,
    showSystemNotification,
    // System Version & Updates
    systemVersion,
    isUpdating,
    updateProgress,
    triggerSystemUpdate,
    // Simulation / Telemetry
    baseProcMetrics,
    windowMetrics,
    cpuStressBenchmark,
    processes,
    sortedProcesses,
    diskActivePercent,
    cpuHistory,
    ramHistory,
    diskHistory,
    // Getters
    activeWindow,
    visibleWindows,
    // Actions
    openWindow,
    focusWindow,
    closeWindow,
    updateWindowPosition,
    minimizeWindow,
    toggleMaximize,
    updateStats,
    unlock,
    toggleLauncher,
    addFileToFolder,
    removeFileFromFolder,
    openContextMenu,
    closeContextMenu,
  };
});
