import {
  Globe,
  TerminalSquare,
  Settings,
  Activity,
  FolderOpen,
  FileText,
  Camera,
  Wifi,
  BookOpen,
  Calculator,
  Calendar,
  Clock,
  Mic,
  ShoppingBag,
  Music,
  Code,
  Gauge,
  type LucideIcon
} from 'lucide-vue-next';

export interface AppRegistryEntry {
  id: string;
  name: string;      // Component name
  title: string;     // Display title
  icon: LucideIcon;
  defaultWidth?: number;
  defaultHeight?: number;
  isSystemEssential: boolean;
  description: string;
  developer: string;
  size: string;
}

// Catálogo centralizado de aplicaciones del sistema operativo VueUI
export const SYSTEM_APPS: AppRegistryEntry[] = [
  {
    id: 'browser',
    name: 'BrowserApp',
    title: 'Navegador Web',
    icon: Globe,
    defaultWidth: 1000,
    defaultHeight: 600,
    isSystemEssential: false,
    description: 'Navegador web virtual de alta velocidad.',
    developer: 'VueOS Core Team',
    size: '85 MB'
  },
  {
    id: 'terminal',
    name: 'TerminalApp',
    title: 'Terminal de Comando',
    icon: TerminalSquare,
    defaultWidth: 700,
    defaultHeight: 450,
    isSystemEssential: false,
    description: 'Línea de comandos nativa de VueOS.',
    developer: 'VueOS Core Team',
    size: '12 MB'
  },
  {
    id: 'settings',
    name: 'SettingsApp',
    title: 'Configuración',
    icon: Settings,
    defaultWidth: 800,
    defaultHeight: 500,
    isSystemEssential: true,
    description: 'Centro de control de personalización y dispositivos.',
    developer: 'VueOS Core Team',
    size: '42 MB'
  },
  {
    id: 'monitor',
    name: 'MonitorApp',
    title: 'Monitor de Sistema',
    icon: Activity,
    defaultWidth: 850,
    defaultHeight: 550,
    isSystemEssential: false,
    description: 'Monitorización de CPU, RAM y telemetrías.',
    developer: 'VueOS Core Team',
    size: '18 MB'
  },
  {
    id: 'files',
    name: 'FilesApp',
    title: 'Gestor de Archivos',
    icon: FolderOpen,
    defaultWidth: 900,
    defaultHeight: 550,
    isSystemEssential: true,
    description: 'Explorador y gestor de archivos virtual.',
    developer: 'VueOS Core Team',
    size: '34 MB'
  },
  {
    id: 'notes',
    name: 'NotesApp',
    title: 'Editor de Notas',
    icon: FileText,
    defaultWidth: 700,
    defaultHeight: 520,
    isSystemEssential: false,
    description: 'Editor de notas de texto plano.',
    developer: 'VueOS Core Team',
    size: '8 MB'
  },
  {
    id: 'camera',
    name: 'CameraApp',
    title: 'Cámara',
    icon: Camera,
    defaultWidth: 640,
    defaultHeight: 560,
    isSystemEssential: false,
    description: 'Aplicación de cámara del sistema.',
    developer: 'VueOS Core Team',
    size: '22 MB'
  },
  {
    id: 'network',
    name: 'NetworkApp',
    title: 'Centro de Redes',
    icon: Wifi,
    defaultWidth: 750,
    defaultHeight: 480,
    isSystemEssential: false,
    description: 'Gestor y escáner de redes virtuales.',
    developer: 'VueOS Core Team',
    size: '15 MB'
  },
  {
    id: 'office',
    name: 'OfficeApp',
    title: 'Suite de Oficina',
    icon: BookOpen,
    defaultWidth: 950,
    defaultHeight: 600,
    isSystemEssential: false,
    description: 'Suite de oficina y lectura de documentos.',
    developer: 'VueOS Core Team',
    size: '95 MB'
  },
  {
    id: 'calculator',
    name: 'CalculatorApp',
    title: 'Calculadora',
    icon: Calculator,
    defaultWidth: 350,
    defaultHeight: 490,
    isSystemEssential: false,
    description: 'Calculadora científica del sistema.',
    developer: 'VueOS Core Team',
    size: '6 MB'
  },
  {
    id: 'calendar',
    name: 'CalendarApp',
    title: 'Calendario',
    icon: Calendar,
    defaultWidth: 720,
    defaultHeight: 540,
    isSystemEssential: false,
    description: 'Organizador y calendario digital.',
    developer: 'VueOS Core Team',
    size: '14 MB'
  },
  {
    id: 'clock',
    name: 'ClockApp',
    title: 'Reloj y Cronómetro',
    icon: Clock,
    defaultWidth: 500,
    defaultHeight: 420,
    isSystemEssential: false,
    description: 'Reloj mundial, alarmas y temporizador.',
    developer: 'VueOS Core Team',
    size: '10 MB'
  },
  {
    id: 'recorder',
    name: 'RecorderApp',
    title: 'Grabadora de Voz',
    icon: Mic,
    defaultWidth: 400,
    defaultHeight: 500,
    isSystemEssential: false,
    description: 'Grabadora de audio y espectrógrafo.',
    developer: 'VueOS Core Team',
    size: '16 MB'
  },
  {
    id: 'store',
    name: 'StoreApp',
    title: 'Discover',
    icon: ShoppingBag,
    defaultWidth: 900,
    defaultHeight: 600,
    isSystemEssential: true,
    description: 'Centro de software y tienda de aplicaciones de KDE Plasma.',
    developer: 'VueOS Core Team',
    size: '28 MB'
  },
  {
    id: 'elisaplayer',
    name: 'ElisaPlayerApp',
    title: 'Elisa Player',
    icon: Music,
    defaultWidth: 750,
    defaultHeight: 500,
    isSystemEssential: false,
    description: 'Reproductor de música de KDE Plasma.',
    developer: 'antorlok Systems',
    size: '45 MB'
  },
  {
    id: 'kate',
    name: 'KateApp',
    title: 'Kate',
    icon: Code,
    defaultWidth: 850,
    defaultHeight: 550,
    isSystemEssential: false,
    description: 'Editor de código avanzado para desarrolladores.',
    developer: 'antorlok Systems',
    size: '56 MB'
  },
  {
    id: 'sysbench',
    name: 'SysBenchApp',
    title: 'SysBench',
    icon: Gauge,
    defaultWidth: 650,
    defaultHeight: 480,
    isSystemEssential: false,
    description: 'Pruebas de rendimiento y benchmarks de CPU/memoria.',
    developer: 'antorlok Labs',
    size: '30 MB'
  }
];
