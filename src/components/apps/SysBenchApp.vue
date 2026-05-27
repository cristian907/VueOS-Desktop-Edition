<template>
  <div class="bench-container">
    <div class="bench-card">
      <h3 class="bench-title">SysBench v3.0</h3>
      <p class="bench-desc">Mide el rendimiento máximo simulado de tu núcleo VueOS.</p>

      <!-- MEDIDOR GAUGE RADIAL (SVG) -->
      <div class="gauge-area">
        <svg class="gauge-svg" viewBox="0 0 200 200">
          <!-- Círculo de fondo -->
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            stroke-width="12"
          />
          <!-- Círculo de relleno animado -->
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            :stroke="gaugeColor"
            stroke-width="12"
            stroke-dasharray="502"
            :stroke-dashoffset="dashOffset"
            stroke-linecap="round"
            class="gauge-circle-fill"
          />
        </svg>
        <div class="gauge-text" :class="{ 'vibrating': isTesting }">
          <span class="gauge-value">{{ Math.round(cpuStress) }}%</span>
          <span class="gauge-lbl">Estrés CPU</span>
        </div>
      </div>

      <!-- BOTÓN DE INICIO DE TEST -->
      <button
        type="button"
        class="test-btn"
        :class="{ 'test-btn-active': isTesting }"
        :disabled="isTesting"
        @click="runBenchmark"
      >
        <component :is="isTesting ? ZapIcon : PlayIcon" class="btn-icon" :class="{ 'spinning': isTesting }" />
        <span>{{ isTesting ? 'Ejecutando Estrés...' : 'Comenzar Pruebas' }}</span>
      </button>

      <!-- TERMINAL DE REGISTRO / LOGS -->
      <div class="log-terminal">
        <div v-for="(log, idx) in logs" :key="idx" class="log-line">
          <span class="log-timestamp">> </span>
          <span :class="log.type">{{ log.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { useOSStore } from '@/stores/osStore';
import { Play as PlayIcon, Zap as ZapIcon } from 'lucide-vue-next';

const osStore = useOSStore();

const isTesting = ref(false);
const cpuStress = ref(0);

watch(cpuStress, (newVal) => {
  osStore.cpuStressBenchmark = newVal;
});
const logs = ref<{ text: string; type: string }[]>([
  { text: 'SysBench inicializado. Esperando órdenes...', type: 'info' }
]);

// Círculo tiene un radio de 80, su perímetro es 2 * PI * 80 ≈ 502
const dashOffset = computed(() => {
  const pct = cpuStress.value / 100;
  return 502 - pct * 502;
});

const gaugeColor = computed(() => {
  if (cpuStress.value > 85) return 'var(--neon-magenta)';
  if (cpuStress.value > 50) return 'var(--neon-cyan)';
  return 'var(--neon-green)';
});

let testTimer: any = null;
let stressTimer: any = null;

function runBenchmark() {
  if (isTesting.value) return;

  isTesting.value = true;
  cpuStress.value = 10;
  logs.value = [];
  
  addLog('Iniciando batería de pruebas VueOS Benchmarks...', 'info');

  // Secuencia de logs y estrés simulado
  let step = 0;
  testTimer = setInterval(() => {
    step++;
    if (step === 1) {
      addLog('Creando 10,000 hilos simulados de estrés de cálculo de primos...', 'info');
      cpuStress.value = 45;
    } else if (step === 2) {
      addLog('Estresando la memoria RAM y caché virtual de IndexedDB...', 'info');
      cpuStress.value = 78;
    } else if (step === 3) {
      addLog('[Peligro] Temperatura del procesador elevada a 89°C. Carga al 99.8%. Estresando el kernel...', 'warning');
      cpuStress.value = 99.8;
      
      // Vibración de estrés
      stressTimer = setInterval(() => {
        cpuStress.value = 98 + Math.random() * 2;
      }, 80);
    } else if (step === 5) {
      clearInterval(stressTimer);
      addLog('Finalizando pruebas de estrés. Enfriando procesador...', 'info');
      cpuStress.value = 30;
    } else if (step === 6) {
      clearInterval(testTimer);
      isTesting.value = false;
      cpuStress.value = 0;
      
      const score = Math.floor(35000 + Math.random() * 10000);
      addLog(`¡Prueba Completada Exitosamente!`, 'success');
      addLog(`Puntuación final: ${score.toLocaleString()} VUE-POINTS`, 'success-glow');
    }
  }, 1000);
}

function addLog(text: string, type: string) {
  logs.value.push({ text, type });
  // Mantener solo los últimos 5 logs en pantalla para el terminal compacto
  if (logs.value.length > 5) {
    logs.value.shift();
  }
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
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #08080c;
  padding: 20px;
}

.bench-card {
  width: 100%;
  max-width: 380px;
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  backdrop-filter: blur(16px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
}

.bench-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 1px;
}

.bench-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.4;
  margin-top: -8px;
}

/* MEDIDOR GAUGE */
.gauge-area {
  position: relative;
  width: 160px;
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.gauge-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.gauge-circle-fill {
  transition: stroke-dashoffset 0.3s ease, stroke 0.5s ease;
  filter: drop-shadow(0 0 4px v-bind(gaugeColor));
}

.gauge-text {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.gauge-value {
  font-size: 1.8rem;
  font-weight: 900;
  color: #ffffff;
  font-family: monospace;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}

.gauge-lbl {
  font-size: 0.65rem;
  font-weight: bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.vibrating {
  animation: shake 0.1s infinite;
}

@keyframes shake {
  0% { transform: translate(1px, 1px) rotate(0deg); }
  25% { transform: translate(-1px, -1px) rotate(-1deg); }
  50% { transform: translate(-1px, 1px) rotate(0deg); }
  75% { transform: translate(1px, -1px) rotate(1deg); }
  100% { transform: translate(1px, 1px) rotate(0deg); }
}

/* BOTÓN DE ACCIÓN */
.test-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  background: rgba(0, 243, 255, 0.08);
  border: 1px solid rgba(0, 243, 255, 0.25);
  border-radius: 10px;
  color: var(--neon-cyan);
  font-family: inherit;
  font-weight: bold;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.25s ease;
}

.test-btn:hover:not(:disabled) {
  background: var(--neon-cyan);
  color: #000000;
  box-shadow: var(--glow-cyan);
}

.test-btn-active {
  background: rgba(255, 0, 255, 0.08) !important;
  border-color: rgba(255, 0, 255, 0.25) !important;
  color: var(--neon-magenta) !important;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* TERMINAL DE LOGS */
.log-terminal {
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 12px;
  height: 110px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 6px;
}

.log-line {
  font-size: 0.68rem;
  line-height: 1.4;
  font-family: monospace;
}

.log-timestamp {
  color: var(--neon-cyan);
}

.info {
  color: rgba(255, 255, 255, 0.7);
}

.warning {
  color: #f59e0b; /* Naranja advertencia */
}

.success {
  color: var(--neon-green);
}

.success-glow {
  color: var(--neon-magenta);
  font-weight: bold;
  text-shadow: var(--glow-magenta);
}
</style>
