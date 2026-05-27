<template>
  <div class="monitor-container">
    <!-- Barra de Navegación Lateral Principal (Estilo KDE/Windows Task Manager) -->
    <aside class="monitor-main-sidebar">
      <div class="sidebar-header">
        <CpuIcon class="header-icon" />
        <h3 class="sidebar-app-name">Monitor de Sistema</h3>
      </div>
      <nav class="sidebar-nav">
        <button 
          class="nav-item" 
          :class="{ active: currentSection === 'rendimiento' }"
          @click="currentSection = 'rendimiento'"
        >
          <ActivityIcon class="nav-icon" />
          <span>Rendimiento</span>
        </button>
        <button 
          class="nav-item" 
          :class="{ active: currentSection === 'procesos' }"
          @click="currentSection = 'procesos'"
        >
          <TerminalIcon class="nav-icon" />
          <span>Procesos</span>
        </button>
      </nav>
    </aside>

    <!-- Contenedor Principal Derecho -->
    <div class="monitor-workspace">
      <!-- SECCIÓN RENDIMIENTO -->
      <div v-if="currentSection === 'rendimiento'" class="rendimiento-layout">
        <!-- Sub-sidebar de Tarjetas de Recursos -->
        <div class="recursos-sidebar">
          <!-- CPU Card -->
          <button 
            class="recurso-card" 
            :class="{ active: selectedResource === 'cpu' }"
            @click="selectedResource = 'cpu'"
          >
            <div class="card-header">
              <span class="card-name">CPU</span>
              <span class="card-value">{{ Math.round(osStore.stats.cpu_usage) }}%</span>
            </div>
            <div class="sparkline-container">
              <svg class="sparkline-svg" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path class="sparkline-path cpu-line" :d="generateSparklineD(osStore.cpuHistory)" />
              </svg>
            </div>
            <div class="card-footer">{{ cpuSpeed }}</div>
          </button>

          <!-- Memoria RAM Card -->
          <button 
            class="recurso-card" 
            :class="{ active: selectedResource === 'ram' }"
            @click="selectedResource = 'ram'"
          >
            <div class="card-header">
              <span class="card-name">Memoria</span>
              <span class="card-value">{{ Math.round(osStore.stats.ram_usage) }}%</span>
            </div>
            <div class="sparkline-container">
              <svg class="sparkline-svg" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path class="sparkline-path ram-line" :d="generateSparklineD(osStore.ramHistory)" />
              </svg>
            </div>
            <div class="card-footer">
              {{ ((16 * osStore.stats.ram_usage) / 100).toFixed(1) }} / 16.0 GB
            </div>
          </button>

          <!-- Disco SSD Card -->
          <button 
            class="recurso-card" 
            :class="{ active: selectedResource === 'disco' }"
            @click="selectedResource = 'disco'"
          >
            <div class="card-header">
              <span class="card-name">Disco (SSD)</span>
              <span class="card-value">{{ Math.round(osStore.diskActivePercent) }}%</span>
            </div>
            <div class="sparkline-container">
              <svg class="sparkline-svg" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path class="sparkline-path disk-line" :d="generateSparklineD(osStore.diskHistory)" />
              </svg>
            </div>
            <div class="card-footer">C: 50% usado</div>
          </button>
        </div>

        <!-- Panel de Gráfico Detallado y Telemetría -->
        <div class="recurso-detail-panel">
          <header class="recurso-header">
            <div>
              <h2 class="recurso-title">{{ resourceTitle }}</h2>
              <span class="recurso-subtitle">{{ resourceSubtitle }}</span>
            </div>
            <div class="current-big-value">
              <span class="big-number">{{ currentBigPercent }}</span>
              <span class="big-unit">%</span>
            </div>
          </header>

          <!-- Área del Gráfico Histórico en Tiempo Real -->
          <div class="large-chart-container">
            <!-- Líneas de cuadrícula de fondo -->
            <div class="chart-grid-lines">
              <div class="grid-line" style="top: 0%"><span>100%</span></div>
              <div class="grid-line" style="top: 25%"><span>75%</span></div>
              <div class="grid-line" style="top: 50%"><span>50%</span></div>
              <div class="grid-line" style="top: 75%"><span>25%</span></div>
              <div class="grid-line" style="top: 100%"><span>0%</span></div>
            </div>
            
            <svg class="large-chart-svg" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#3daee9" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="#3daee9" stop-opacity="0.0" />
                </linearGradient>
                <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#2ecc71" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="#2ecc71" stop-opacity="0.0" />
                </linearGradient>
                <linearGradient id="diskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#f1c40f" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="#f1c40f" stop-opacity="0.0" />
                </linearGradient>
              </defs>

              <!-- Área de degradado bajo la línea -->
              <path 
                class="chart-area-path" 
                :d="generateAreaD(activeHistory)" 
                :fill="`url(#${selectedResource}Gradient)`"
              />
              <!-- Contorno del gráfico -->
              <path 
                class="chart-line-path" 
                :class="selectedResource" 
                :d="generateLineD(activeHistory)"
              />
            </svg>
          </div>

          <!-- Cuadrícula de Especificaciones de Hardware Detalladas -->
          <div class="detailed-stats-grid">
            <div v-for="stat in activeStats" :key="stat.label" class="stat-box">
              <span class="stat-label">{{ stat.label }}</span>
              <span class="stat-value">{{ stat.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN PROCESOS -->
      <div v-if="currentSection === 'procesos'" class="procesos-layout">
        <header class="procesos-header">
          <div>
            <h2 class="recurso-title">Detalles de Procesos</h2>
            <span class="recurso-subtitle">Administra, monitorea y fuerza el cierre de ventanas de usuario y demonios en tiempo real</span>
          </div>
          <div class="processes-summary">
          <span class="summary-badge">Procesos: {{ osStore.sortedProcesses.length }}</span>
          <span class="summary-badge">Hilos: {{ osStore.sortedProcesses.length * 12 }}</span>
        </div>
      </header>

      <div class="table-wrapper">
        <table class="processes-table">
          <thead>
            <tr>
              <th>PID</th>
              <th>Nombre del Proceso</th>
              <th>CPU %</th>
              <th>Uso de Memoria</th>
              <th>Tipo</th>
              <th class="col-action">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="proc in osStore.sortedProcesses" :key="proc.pid" :class="{ 'row-app': proc.isApp }">
                <td class="proc-pid">#{{ proc.pid }}</td>
                <td class="proc-name">
                  <component :is="proc.isApp ? LayersIcon : TerminalIcon" class="proc-icon" :class="{ 'app-proc-icon': proc.isApp }" />
                  <span class="proc-name-text">{{ proc.name }}</span>
                </td>
                <td class="proc-cpu" :class="{ 'high-usage': proc.cpu > 15 }">
                  {{ proc.cpu.toFixed(1) }}%
                </td>
                <td class="proc-ram">{{ proc.ram.toFixed(1) }} MB</td>
                <td class="proc-type">
                  <span class="type-badge" :class="proc.isApp ? 'badge-app' : 'badge-system'">
                    {{ proc.isApp ? 'Aplicación' : 'Sistema' }}
                  </span>
                </td>
                <td class="proc-action">
                  <button 
                    v-if="proc.isApp" 
                    class="end-task-btn" 
                    @click="killProcess(proc)"
                    title="Fuerza el cierre inmediato de esta aplicación"
                  >
                    Terminar tarea
                  </button>
                  <span v-else class="system-locked-label">Protegido</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useOSStore } from '@/stores/osStore';
import { 
  Cpu as CpuIcon, 
  Terminal as TerminalIcon, 
  Layers as LayersIcon, 
  Activity as ActivityIcon
} from 'lucide-vue-next';

const osStore = useOSStore();

// Navegación principal de secciones
const currentSection = ref('rendimiento');
// Recurso activo en Rendimiento (cpu, ram, disco)
const selectedResource = ref('cpu');

// Tiempo de actividad simulado (segundos acumulados)
const secondsActive = ref(9952); 

// Temporizador acumulativo del sistema
const formatUptime = () => {
  const hrs = Math.floor(secondsActive.value / 3600);
  const mins = Math.floor((secondsActive.value % 3600) / 60);
  const secs = secondsActive.value % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Frecuencia dinámica del Ryzen 7 5800H
const cpuSpeed = computed(() => {
  const base = 3.20;
  const boost = 1.20;
  const speed = base + (osStore.stats.cpu_usage / 100) * boost;
  return `${speed.toFixed(2)} GHz`;
});

// Generadores de rutas de trazado SVG para sparklines y gráficos grandes
function generateLineD(history: number[]) {
  if (!history || history.length === 0) return '';
  const W = 500;
  const H = 200;
  const points = history.map((val, idx) => {
    const x = (idx / (history.length - 1)) * W;
    const y = H - (val / 100) * H;
    return `${x},${y}`;
  });
  return `M ${points.join(' L ')}`;
}

function generateAreaD(history: number[]) {
  if (!history || history.length === 0) return '';
  const W = 500;
  const H = 200;
  const lineD = generateLineD(history);
  return `${lineD} L ${W},${H} L 0,${H} Z`;
}

function generateSparklineD(history: number[]) {
  if (!history || history.length === 0) return '';
  const W = 100;
  const H = 30;
  const points = history.map((val, idx) => {
    const x = (idx / (history.length - 1)) * W;
    const y = H - (val / 100) * H;
    return `${x},${y}`;
  });
  return `M ${points.join(' L ')}`;
}

// Títulos y subtítulos dinámicos basados en selección
const resourceTitle = computed(() => {
  if (selectedResource.value === 'cpu') return 'Procesador (CPU)';
  if (selectedResource.value === 'ram') return 'Memoria Física (RAM)';
  return 'Disco Principal (SSD)';
});

const resourceSubtitle = computed(() => {
  if (selectedResource.value === 'cpu') return 'AMD Ryzen 7 5800H @ 3.20GHz';
  if (selectedResource.value === 'ram') return 'Estadísticas de ocupación y paginación del sistema de memoria virtual';
  return 'Lectura/Escritura y uso del bus PCIe NVMe de la unidad principal';
});

const activeHistory = computed(() => {
  if (selectedResource.value === 'cpu') return osStore.cpuHistory;
  if (selectedResource.value === 'ram') return osStore.ramHistory;
  return osStore.diskHistory;
});

const currentBigPercent = computed(() => {
  if (selectedResource.value === 'cpu') return Math.round(osStore.stats.cpu_usage);
  if (selectedResource.value === 'ram') return Math.round(osStore.stats.ram_usage);
  return Math.round(osStore.diskActivePercent);
});

// Telemetría de hardware
const activeStats = computed(() => {
  if (selectedResource.value === 'cpu') {
    return [
      { label: 'Utilización', value: `${Math.round(osStore.stats.cpu_usage)}%` },
      { label: 'Velocidad', value: cpuSpeed.value },
      { label: 'Procesos', value: osStore.sortedProcesses.length.toString() },
      { label: 'Hilos', value: (osStore.sortedProcesses.length * 12).toString() },
      { label: 'Tiempo activo', value: formatUptime() },
      { label: 'Virtualización', value: 'Habilitada' },
      { label: 'Caché L1', value: '512 KB' },
      { label: 'Caché L2', value: '4.0 MB' },
      { label: 'Caché L3', value: '16.0 MB' },
    ];
  } else if (selectedResource.value === 'ram') {
    const totalRam = 16.0;
    const inUse = ((totalRam * osStore.stats.ram_usage) / 100).toFixed(1);
    const available = (totalRam - parseFloat(inUse)).toFixed(1);
    return [
      { label: 'En uso', value: `${inUse} GB (${Math.round(osStore.stats.ram_usage)}%)` },
      { label: 'Disponible', value: `${available} GB` },
      { label: 'Confirmada', value: `${inUse}/${totalRam + 4.0} GB` },
      { label: 'Velocidad', value: '3200 MHz' },
      { label: 'Ranuras usadas', value: '2 de 4' },
      { label: 'Factor de forma', value: 'SODIMM' },
      { label: 'Reservada hardware', value: '120 MB' },
      { label: 'Grupo paginado', value: '520 MB' },
      { label: 'Grupo no paginado', value: '280 MB' },
    ];
  } else {
    const lastDiskVal = osStore.diskHistory[osStore.diskHistory.length - 1] || 12;
    const readSpeed = (Math.max(0.2, (lastDiskVal * 3.4) + (Math.random() - 0.5) * 4)).toFixed(1);
    const writeSpeed = (Math.max(0.1, (lastDiskVal * 1.8) + (Math.random() - 0.5) * 2)).toFixed(1);
    return [
      { label: 'Tiempo de actividad', value: `${Math.round(lastDiskVal)}%` },
      { label: 'Velocidad de lectura', value: `${readSpeed} MB/s` },
      { label: 'Velocidad de escritura', value: `${writeSpeed} MB/s` },
      { label: 'Capacidad', value: '512 GB' },
      { label: 'Tipo de sistema', value: 'ext4' },
      { label: 'Punto de montaje', value: '/workspace' },
      { label: 'Tipo de medio', value: 'SSD (NVMe)' },
      { label: 'Temperatura', value: `${(osStore.stats.cpu_temp ?? 42) + 3} °C` },
      { label: 'Ocupación total', value: '50% (256 GB Libres)' }
    ];
  }
});

// Forzar cierre de una aplicación
function killProcess(proc: any) {
  if (proc.isApp && proc.winId) {
    osStore.closeWindow(proc.winId);
  }
}

let updateInterval: ReturnType<typeof setInterval>;

onMounted(() => {
  updateInterval = setInterval(() => {
    secondsActive.value++;
  }, 1000);
});

onUnmounted(() => {
  clearInterval(updateInterval);
});
</script>

<style scoped>
.monitor-container {
  display: flex;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-family-base);
  overflow: hidden;
}

/* Sidebar Estilo Breeze / Windows Task Manager */
.monitor-main-sidebar {
  width: 200px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-icon {
  width: 20px;
  height: 20px;
  color: var(--accent);
}

.sidebar-app-name {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: #eff0f1;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.65);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--bg-active) !important;
  color: var(--accent) !important;
  box-shadow: inset 3px 0 0 0 var(--accent);
}

.nav-icon {
  width: 16px;
  height: 16px;
}

/* Espacio de trabajo */
.monitor-workspace {
  flex: 1;
  overflow: hidden;
  background: var(--bg-primary);
}

/* ── DISEÑO RENDIMIENTO ── */
.rendimiento-layout {
  display: flex;
  width: 100%;
  height: 100%;
}

.recursos-sidebar {
  width: 240px;
  border-right: 1px solid var(--border-color);
  background: rgba(2, 6, 23, 0.1);
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
  gap: 12px;
  overflow-y: auto;
  flex-shrink: 0;
}

.recurso-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  text-align: left;
}

.recurso-card:hover {
  background: var(--bg-hover);
  border-color: rgba(61, 174, 233, 0.4);
}

.recurso-card.active {
  border-color: var(--accent) !important;
  background: var(--bg-active) !important;
  box-shadow: 0 0 8px rgba(61, 174, 233, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: #eff0f1;
}

.card-value {
  font-family: monospace;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.sparkline-container {
  height: 30px;
  width: 100%;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.sparkline-svg {
  width: 100%;
  height: 100%;
}

.sparkline-path {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.5;
}

.ram-line {
  stroke: #2ecc71;
}

.disk-line {
  stroke: #f1c40f;
}

.card-footer {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

/* Panel Detallado Derecho */
.recurso-detail-panel {
  flex: 1;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.recurso-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 14px;
}

.recurso-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #eff0f1;
}

.recurso-subtitle {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.current-big-value {
  display: flex;
  align-items: baseline;
  color: var(--text-primary);
}

.big-number {
  font-family: monospace;
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
}

.big-unit {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-left: 2px;
}

/* Gran Gráfico Histórico */
.large-chart-container {
  position: relative;
  height: 200px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.chart-grid-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px dashed rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: flex-start;
  padding-left: 8px;
}

.grid-line span {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.25);
  margin-top: 2px;
}

.large-chart-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.chart-line-path {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
  transition: d 0.5s ease;
}

.chart-line-path.ram {
  stroke: #2ecc71;
}

.chart-line-path.disco {
  stroke: #f1c40f;
}

.chart-area-path {
  transition: d 0.5s ease;
}

/* Estadísticas Cuadrícula */
.detailed-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 16px;
}

.stat-box {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.02);
  border-radius: 4px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.72rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-value {
  font-size: 0.9rem;
  font-weight: bold;
  color: #eff0f1;
  margin-top: 2px;
}

/* ── DISEÑO PROCESOS ── */
.procesos-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 24px;
  overflow: hidden;
}

.procesos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 14px;
  margin-bottom: 16px;
}

.processes-summary {
  display: flex;
  gap: 10px;
}

.summary-badge {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  color: var(--text-primary);
  font-weight: bold;
}

.table-wrapper {
  flex: 1;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow-y: auto;
  box-shadow: var(--shadow-subtle);
  scrollbar-width: thin;
  scrollbar-color: #3b3f43 var(--bg-secondary);
}

.table-wrapper::-webkit-scrollbar {
  width: 6px;
}
.table-wrapper::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}
.table-wrapper::-webkit-scrollbar-thumb {
  background: #3b3f43;
  border-radius: 3px;
}

.processes-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.85rem;
}

.processes-table th {
  background: rgba(2, 6, 23, 0.4);
  padding: 12px 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: sticky;
  top: 0;
  z-index: 1;
}

.processes-table td {
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  color: #eff0f1;
}

.processes-table tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.row-app {
  background: rgba(61, 174, 233, 0.015);
}

.proc-pid {
  font-family: monospace;
  color: rgba(255, 255, 255, 0.45);
}

.proc-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.proc-name-text {
  font-weight: 600;
}

.proc-icon {
  width: 14px;
  height: 14px;
  color: var(--text-secondary);
}

.app-proc-icon {
  color: var(--accent);
}

.proc-cpu {
  font-family: monospace;
  font-weight: bold;
}

.proc-cpu.high-usage {
  color: #e74c3c;
}

.proc-ram {
  font-family: monospace;
}

.type-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: bold;
}

.badge-app {
  background: rgba(61, 174, 233, 0.15);
  color: var(--accent);
  border: 1px solid rgba(61, 174, 233, 0.2);
}

.badge-system {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.55);
}

.col-action {
  width: 130px;
  text-align: center;
}

.proc-action {
  text-align: center;
}

.end-task-btn {
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.4);
  color: #e74c3c;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.end-task-btn:hover {
  background: #e74c3c;
  color: #ffffff;
}

.system-locked-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.25);
}
</style>
