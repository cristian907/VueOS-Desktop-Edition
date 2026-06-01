<template>
  <div class="bench-container">
    <!-- BARRA SUPERIOR DE PESTAÑAS (KDE BREEZE STYLE) -->
    <header class="bench-header">
      <div class="bench-tabs">
        <button
          type="button"
          class="bench-tab"
          :class="{ active: activeTab === 'cpu' }"
          @click="activeTab = 'cpu'"
          :disabled="isTesting"
        >
          <CpuIcon class="tab-icon" />
          <span>Prueba de CPU</span>
        </button>
        <button
          type="button"
          class="bench-tab"
          :class="{ active: activeTab === 'disk' }"
          @click="activeTab = 'disk'"
          :disabled="isTesting"
        >
          <HardDriveIcon class="tab-icon" />
          <span>Benchmark de Disco</span>
        </button>
      </div>
      <span class="system-tag">KDE SysBench v4.0</span>
    </header>

    <div class="bench-body">
      <!-- SECCIÓN: PRUEBA DE CPU -->
      <div v-if="activeTab === 'cpu'" class="tab-pane">
        <div class="pane-meta">
          <h3>Rendimiento y Cálculo de CPU</h3>
          <p>Mide el rendimiento máximo simulado en operaciones de punto flotante por segundo (GFLOPS) y estrés del núcleo.</p>
        </div>

        <div class="progress-section">
          <div class="progress-header">
            <span>Estrés del Procesador</span>
            <span class="progress-val">{{ Math.round(cpuStress) }}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" :style="{ width: `${cpuStress}%` }"></div>
          </div>
          <div class="speed-indicator" v-if="isTesting">
            Velocidad de procesamiento: <span class="highlight">{{ (cpuStress * 1.8 + 20).toFixed(1) }} GFLOPS</span>
          </div>
        </div>

        <!-- Métrica de especificaciones -->
        <div class="stats-table">
          <div class="table-row">
            <span class="lbl">Hilos de cálculo activo:</span>
            <span class="val">{{ isTesting ? '16 Hilos (Máximo)' : '0 Hilos (Reposo)' }}</span>
          </div>
          <div class="table-row">
            <span class="lbl">Estado térmico de CPU:</span>
            <span class="val" :class="{ 'warning-text': cpuStress > 80 }">
              {{ isTesting ? Math.round(45 + (cpuStress * 0.45)) : '38' }}°C
            </span>
          </div>
        </div>

        <button
          type="button"
          class="breeze-btn btn-primary"
          :class="{ active: isTesting }"
          :disabled="isTesting"
          @click="runCpuBenchmark"
        >
          <PlayIcon class="btn-icon" :class="{ spinning: isTesting }" />
          <span>{{ isTesting ? 'Ejecutando Estrés CPU...' : 'Comenzar Pruebas de CPU' }}</span>
        </button>
      </div>

      <!-- SECCIÓN: BENCHMARK DE DISCO -->
      <div v-else-if="activeTab === 'disk'" class="tab-pane">
        <div class="pane-meta">
          <h3>Benchmark de Disco NVMe</h3>
          <p>Simula pruebas secuenciales y aleatorias 4K en tu SSD para medir la velocidad física de lectura y escritura.</p>
        </div>

        <!-- Resultados del Benchmark de Disco -->
        <div class="disk-results">
          <div class="disk-test-row">
            <div class="test-label">
              <span class="title">Lectura Secuencial (SEQ1M Q8T1)</span>
              <span class="desc">Velocidad máxima de transferencia de archivos grandes</span>
            </div>
            <div class="test-value" :class="{ active: activeDiskPhase === 'seqRead' || diskResults.seqRead > 0 }">
              {{ diskResults.seqRead > 0 ? `${diskResults.seqRead.toLocaleString()} MB/s` : (activeDiskPhase === 'seqRead' ? `${tempSpeed} MB/s` : '--') }}
            </div>
          </div>

          <div class="disk-test-row">
            <div class="test-label">
              <span class="title">Escritura Secuencial (SEQ1M Q8T1)</span>
              <span class="desc">Velocidad máxima de escritura de archivos grandes</span>
            </div>
            <div class="test-value" :class="{ active: activeDiskPhase === 'seqWrite' || diskResults.seqWrite > 0 }">
              {{ diskResults.seqWrite > 0 ? `${diskResults.seqWrite.toLocaleString()} MB/s` : (activeDiskPhase === 'seqWrite' ? `${tempSpeed} MB/s` : '--') }}
            </div>
          </div>

          <div class="disk-test-row">
            <div class="test-label">
              <span class="title">Lectura Aleatoria (RND4K Q32T1)</span>
              <span class="desc">Lectura de bloques pequeños (IOPS de base de datos)</span>
            </div>
            <div class="test-value" :class="{ active: activeDiskPhase === 'rndRead' || diskResults.rndRead > 0 }">
              {{ diskResults.rndRead > 0 ? `${diskResults.rndRead.toLocaleString()} IOPS` : (activeDiskPhase === 'rndRead' ? `${Math.round(tempSpeed * 12)} IOPS` : '--') }}
            </div>
          </div>

          <div class="disk-test-row">
            <div class="test-label">
              <span class="title">Escritura Aleatoria (RND4K Q32T1)</span>
              <span class="desc">Escritura de bloques pequeños (IOPS de base de datos)</span>
            </div>
            <div class="test-value" :class="{ active: activeDiskPhase === 'rndWrite' || diskResults.rndWrite > 0 }">
              {{ diskResults.rndWrite > 0 ? `${diskResults.rndWrite.toLocaleString()} IOPS` : (activeDiskPhase === 'rndWrite' ? `${Math.round(tempSpeed * 10)} IOPS` : '--') }}
            </div>
          </div>
        </div>

        <button
          type="button"
          class="breeze-btn btn-primary"
          :class="{ active: isTesting }"
          :disabled="isTesting"
          @click="runDiskBenchmark"
        >
          <PlayIcon class="btn-icon" :class="{ spinning: isTesting }" />
          <span>{{ isTesting ? 'Ejecutando Pruebas de Disco...' : 'Comenzar Pruebas de Disco' }}</span>
        </button>
      </div>

      <!-- TERMINAL DE REGISTROS (KONSOLE COMPACTA) -->
      <footer class="konsole-logs">
        <div class="logs-header">
          <TerminalIcon class="logs-icon" />
          <span>Salida de Registro (SysBench Kern)</span>
        </div>
        <div class="logs-body" ref="logsBodyRef">
          <div v-for="(log, idx) in logs" :key="idx" class="log-line">
            <span class="prompt">></span>
            <span class="log-text" :class="log.type">{{ log.text }}</span>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';
import { useOSStore } from '@/stores/osStore';
import {
  Cpu as CpuIcon,
  HardDrive as HardDriveIcon,
  Play as PlayIcon,
  Terminal as TerminalIcon
} from 'lucide-vue-next';

const osStore = useOSStore();

// --- STATE ---
const activeTab = ref<'cpu' | 'disk'>('cpu');
const isTesting = ref(false);
const cpuStress = ref(0);
const logsBodyRef = ref<HTMLElement | null>(null);

// Logs
const logs = ref<{ text: string; type: string }[]>([
  { text: 'KDE SysBench inicializado. Esperando comandos del operador...', type: 'info' }
]);

// Disk Results
const diskResults = ref({
  seqRead: 0,
  seqWrite: 0,
  rndRead: 0,
  rndWrite: 0
});
const activeDiskPhase = ref<'seqRead' | 'seqWrite' | 'rndRead' | 'rndWrite' | null>(null);
const tempSpeed = ref(0); // velocidad temporal en tiempo real

watch(cpuStress, (newVal) => {
  osStore.cpuStressBenchmark = newVal;
});

// --- METHODS ---
function addLog(text: string, type: 'info' | 'warning' | 'success' = 'info') {
  logs.value.push({ text, type });
  nextTick(() => {
    if (logsBodyRef.value) {
      logsBodyRef.value.scrollTop = logsBodyRef.value.scrollHeight;
    }
  });
}

let testTimer: any = null;
let stressTimer: any = null;

// --- CPU STRESS TEST ---
function runCpuBenchmark() {
  if (isTesting.value) return;

  isTesting.value = true;
  cpuStress.value = 10;
  logs.value = [];
  
  addLog('Iniciando batería de pruebas CPU VueOS Benchmarks...', 'info');

  let step = 0;
  testTimer = setInterval(() => {
    step++;
    if (step === 1) {
      addLog('Generando subprocesos del kernel para cálculo de números primos...', 'info');
      cpuStress.value = 45;
    } else if (step === 2) {
      addLog('Comprobando estabilidad bajo cálculo en punto flotante (16 hilos)...', 'info');
      cpuStress.value = 85;
    } else if (step === 3) {
      addLog('[Alerta] Carga del procesador al 98.6%. Verificando estrangulamiento térmico...', 'warning');
      cpuStress.value = 98.6;
      
      // Simular ligeras oscilaciones
      stressTimer = setInterval(() => {
        cpuStress.value = 97 + Math.random() * 2.8;
      }, 100);
    } else if (step === 5) {
      clearInterval(stressTimer);
      addLog('Enfriando procesador y recolectando datos de telemetría...', 'info');
      cpuStress.value = 25;
    } else if (step === 6) {
      clearInterval(testTimer);
      isTesting.value = false;
      cpuStress.value = 0;
      
      const score = Math.floor(38000 + Math.random() * 8000);
      addLog('¡Prueba de CPU finalizada con éxito!', 'success');
      addLog(`Puntuación final: ${score.toLocaleString()} GFLOPS-Index (Estable)`, 'success');
    }
  }, 1000);
}

// --- DISK SPEED BENCHMARK ---
function runDiskBenchmark() {
  if (isTesting.value) return;

  isTesting.value = true;
  diskResults.value = { seqRead: 0, seqWrite: 0, rndRead: 0, rndWrite: 0 };
  logs.value = [];
  
  addLog('Iniciando pruebas de transferencia en Disco NVMe...', 'info');

  let step = 0;
  activeDiskPhase.value = 'seqRead';
  
  // Temporizador para simular velocidad en tiempo real
  stressTimer = setInterval(() => {
    if (activeDiskPhase.value === 'seqRead') {
      tempSpeed.value = Math.round(4200 + Math.random() * 800);
    } else if (activeDiskPhase.value === 'seqWrite') {
      tempSpeed.value = Math.round(3000 + Math.random() * 600);
    } else if (activeDiskPhase.value === 'rndRead') {
      tempSpeed.value = Math.round(35000 + Math.random() * 5000);
    } else if (activeDiskPhase.value === 'rndWrite') {
      tempSpeed.value = Math.round(32000 + Math.random() * 4000);
    }
  }, 80);

  testTimer = setInterval(() => {
    step++;
    if (step === 1) {
      addLog('Fase 1: Ejecutando lectura secuencial (tamaño bloque: 1MB)...', 'info');
    } else if (step === 2) {
      diskResults.value.seqRead = tempSpeed.value;
      addLog(`✓ Lectura Secuencial: ${diskResults.value.seqRead} MB/s (Completado)`, 'success');
      activeDiskPhase.value = 'seqWrite';
    } else if (step === 3) {
      addLog('Fase 2: Ejecutando escritura secuencial (tamaño bloque: 1MB)...', 'info');
    } else if (step === 4) {
      diskResults.value.seqWrite = tempSpeed.value;
      addLog(`✓ Escritura Secuencial: ${diskResults.value.seqWrite} MB/s (Completado)`, 'success');
      activeDiskPhase.value = 'rndRead';
    } else if (step === 5) {
      addLog('Fase 3: Ejecutando lectura aleatoria 4K de alta concurrencia...', 'info');
    } else if (step === 6) {
      diskResults.value.rndRead = Math.round(tempSpeed.value * 12);
      addLog(`✓ Lectura Aleatoria 4K: ${diskResults.value.rndRead.toLocaleString()} IOPS (Completado)`, 'success');
      activeDiskPhase.value = 'rndWrite';
    } else if (step === 7) {
      addLog('Fase 4: Ejecutando escritura aleatoria 4K de alta concurrencia...', 'info');
    } else if (step === 8) {
      diskResults.value.rndWrite = Math.round(tempSpeed.value * 10);
      addLog(`✓ Escritura Aleatoria 4K: ${diskResults.value.rndWrite.toLocaleString()} IOPS (Completado)`, 'success');
      
      // Finalizar
      clearInterval(testTimer);
      clearInterval(stressTimer);
      activeDiskPhase.value = null;
      isTesting.value = false;
      addLog('¡Batería de pruebas de disco finalizada con éxito!', 'success');
    }
  }, 1200);
}

onUnmounted(() => {
  if (testTimer) clearInterval(testTimer);
  if (stressTimer) clearInterval(stressTimer);
  osStore.cpuStressBenchmark = 0;
});
</script>

<style scoped>
.bench-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-family-base), sans-serif;
  overflow: hidden;
  user-select: none;
}

/* BARRA SUPERIOR DE PESTAÑAS */
.bench-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 0 16px;
  flex-shrink: 0;
}

.bench-tabs {
  display: flex;
  gap: 4px;
}

.bench-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.bench-tab:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.bench-tab.active {
  background: var(--bg-active) !important;
  color: var(--accent) !important;
  border-bottom: 2px solid var(--accent);
}

.bench-tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-icon {
  width: 14px;
  height: 14px;
}

.system-tag {
  font-size: 0.7rem;
  color: var(--text-disabled);
  font-weight: bold;
  letter-spacing: 0.5px;
}

/* CUERPO DEL BENCHMARK */
.bench-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 20px;
  overflow-y: auto;
}

.tab-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pane-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pane-meta h3 {
  font-size: 1.1rem;
  font-weight: bold;
}

.pane-meta p {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

/* ESTILOS DE ESTRÉS CPU (BARRAS LINEALES) */
.progress-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 16px 20px;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: bold;
}

.progress-val {
  color: var(--accent);
  font-family: monospace;
}

.progress-bar-bg {
  width: 100%;
  height: 10px;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.progress-bar-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.15s ease;
}

.speed-indicator {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.highlight {
  color: var(--accent);
  font-weight: bold;
}

/* Tablas de métricas serias */
.stats-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 18px;
  background: var(--bg-secondary);
  font-size: 0.78rem;
}

.table-row:not(:last-child) {
  border-bottom: 1px solid var(--border-color);
}

.table-row .lbl {
  color: var(--text-secondary);
}

.table-row .val {
  font-weight: bold;
}

.warning-text {
  color: var(--danger) !important;
}

/* BOTONES BREEZE */
.breeze-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.btn-primary {
  background: var(--accent);
  border: 1px solid var(--accent);
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* BENCHMARK DE DISCO GRIDS */
.disk-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.disk-test-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: border-color var(--transition-fast);
}

.disk-test-row:hover {
  border-color: var(--border-hover);
}

.test-label {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.test-label .title {
  font-size: 0.82rem;
  font-weight: bold;
}

.test-label .desc {
  font-size: 0.68rem;
  color: var(--text-secondary);
}

.test-value {
  font-size: 1.1rem;
  font-weight: 800;
  font-family: monospace;
  color: var(--text-disabled);
}

.test-value.active {
  color: var(--accent);
}

/* TERMINAL DE REGISTROS DE SYSBENCH */
.konsole-logs {
  background: #141618;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 140px;
  flex-shrink: 0;
}

.logs-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--bg-titlebar);
  border-bottom: 1px solid var(--border-color);
  font-size: 0.72rem;
  font-weight: bold;
}

.logs-icon {
  width: 12px;
  height: 12px;
  color: var(--accent);
}

.logs-body {
  flex: 1;
  padding: 10px 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: 'Fira Code', monospace;
  font-size: 0.68rem;
  scrollbar-width: thin;
}

.log-line {
  display: flex;
  gap: 8px;
}

.log-line .prompt {
  color: var(--accent);
}

.log-text.info {
  color: rgba(255, 255, 255, 0.75);
}

.log-text.warning {
  color: var(--warning);
}

.log-text.success {
  color: var(--success);
}
</style>
