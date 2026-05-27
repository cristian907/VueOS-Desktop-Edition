// Posición de una ventana en el escritorio
export interface WindowPosition {
  x: number;
  y: number;
}

// Dimensiones de una ventana
export interface WindowDimensions {
  width: number;
  height: number;
}

// Un proceso de ventana activo en el Window Manager
export interface WindowProcess {
  id: string;
  appName: string;
  title: string;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  position: WindowPosition;
  dimensions: WindowDimensions;
}

// Estadísticas de hardware recibidas desde el Daemon de Go vía WebSocket
export interface HardwareStats {
  cpu_usage: number;
  ram_usage: number;
  batteryLevel?: number;
  batteryCharging?: boolean;
  networkOnline?: boolean;
  cpu_temp?: number;
}
