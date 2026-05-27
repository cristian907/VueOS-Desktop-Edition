<template>
  <div class="clock-app">
    <!-- Pestañas de Navegación del Reloj (Reloj / Cronómetro) -->
    <div class="nav-tabs" role="tablist">
      <button
        type="button"
        class="tab-btn"
        :class="{ 'tab-active': activeTab === 'clock' }"
        @click="activeTab = 'clock'"
        role="tab"
      >
        <ClockIcon class="tab-icon" />
        Reloj Mundial
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ 'tab-active': activeTab === 'stopwatch' }"
        @click="activeTab = 'stopwatch'"
        role="tab"
      >
        <HourglassIcon class="tab-icon" />
        Cronómetro
      </button>
    </div>

    <!-- Contenido Dinámico -->
    <div class="tab-content">
      <!-- VISTA A: RELOJ MUNDIAL -->
      <div v-if="activeTab === 'clock'" class="clock-view">
        <div class="clock-circle">
          <div class="glow-ring"></div>
          <span class="digital-time">{{ currentTime }}</span>
          <span class="digital-date">{{ currentDate }}</span>
        </div>
        <div class="world-cities">
          <div class="city-chip">
            <span class="city-name">Bogotá (Local)</span>
            <span class="city-time">{{ currentLocalTime }}</span>
          </div>
          <div class="city-chip">
            <span class="city-name">Tokio</span>
            <span class="city-time">{{ tokyoTime }}</span>
          </div>
        </div>
      </div>

      <!-- VISTA B: CRONÓMETRO -->
      <div v-else class="stopwatch-view">
        <div class="stopwatch-display">{{ formattedStopwatchTime }}</div>
        
        <div class="controls-row">
          <!-- Botón Iniciar/Pausar -->
          <button
            type="button"
            class="control-btn"
            :class="isRunning ? 'btn-pause' : 'btn-start'"
            @click="toggleStopwatch"
          >
            <component :is="isRunning ? PauseIcon : PlayIcon" class="control-icon" />
            {{ isRunning ? 'Pausar' : 'Iniciar' }}
          </button>

          <!-- Botón Reiniciar -->
          <button
            type="button"
            class="control-btn btn-reset"
            @click="resetStopwatch"
          >
            <RotateCcwIcon class="control-icon" />
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  Clock as ClockIcon,
  Hourglass as HourglassIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  RotateCcw as RotateCcwIcon
} from 'lucide-vue-next';

// ---- Control de Pestañas ----
const activeTab = ref<'clock' | 'stopwatch'>('clock');

// ---- Lógica del Reloj Mundial ----
const currentTime = ref('');
const currentDate = ref('');
const currentLocalTime = ref('');
const tokyoTime = ref('');
let clockInterval: ReturnType<typeof setInterval>;

function updateClock() {
  const now = new Date();
  
  // Hora principal
  currentTime.value = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Fecha principal
  currentDate.value = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  // Hora Bogotá (Local)
  currentLocalTime.value = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Hora Tokio
  const options = { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false } as const;
  tokyoTime.value = now.toLocaleTimeString('es-ES', options);
}

// ---- Lógica del Cronómetro ----
const stopwatchMs = ref(0);
const isRunning = ref(false);
let stopwatchInterval: ReturnType<typeof setInterval> | null = null;

const formattedStopwatchTime = computed(() => {
  const totalMs = stopwatchMs.value;
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const centiseconds = Math.floor((totalMs % 1000) / 10);

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
});

function toggleStopwatch() {
  if (isRunning.value) {
    // Pausar
    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      stopwatchInterval = null;
    }
    isRunning.value = false;
  } else {
    // Iniciar
    isRunning.value = true;
    const startTimestamp = Date.now() - stopwatchMs.value;
    stopwatchInterval = setInterval(() => {
      stopwatchMs.value = Date.now() - startTimestamp;
    }, 10); // Intervalo de 10ms para precisión en centésimas
  }
}

function resetStopwatch() {
  if (stopwatchInterval) {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
  }
  isRunning.value = false;
  stopwatchMs.value = 0;
}

// ---- Ciclo de Vida E2E ----
onMounted(() => {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
});

onUnmounted(() => {
  clearInterval(clockInterval);
  if (stopwatchInterval) {
    clearInterval(stopwatchInterval);
  }
});
</script>

<style scoped>
.clock-app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-family-base);
  user-select: none;
  overflow: hidden;
}

/* Pestañas de Navegación */
.nav-tabs {
  display: flex;
  background-color: var(--bg-secondary);
  border-bottom: var(--glass-border);
  padding: 4px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 10px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-active {
  color: var(--neon-cyan) !important;
  box-shadow: inset 0 -2px 0 var(--neon-cyan);
}

.tab-icon {
  width: 16px;
  height: 16px;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
}

/* Reloj Mundial */
.clock-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
}

.clock-circle {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: var(--glass-bg);
  border: var(--glass-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.glow-ring {
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 1px solid var(--neon-cyan);
  animation: rotateGlow 8s linear infinite;
  box-shadow: var(--glow-cyan);
  opacity: 0.4;
  pointer-events: none;
}

@keyframes rotateGlow {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.digital-time {
  font-family: 'Courier New', Courier, monospace;
  font-size: 2.2rem;
  font-weight: bold;
  color: var(--text-primary);
  text-shadow: 0 0 10px rgba(255,255,255,0.05);
}

.digital-date {
  font-size: 0.72rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-top: 4px;
}

.world-cities {
  display: flex;
  gap: 16px;
  width: 100%;
  justify-content: center;
}

.city-chip {
  flex: 1;
  max-width: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-secondary);
  border: var(--glass-border);
  padding: 8px 12px;
  border-radius: 8px;
}

.city-name {
  font-size: 0.7rem;
  font-weight: bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.city-time {
  font-family: monospace;
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--neon-cyan);
  margin-top: 2px;
}

/* Cronómetro */
.stopwatch-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 32px;
}

.stopwatch-display {
  font-family: 'Courier New', Courier, monospace;
  font-size: 3rem;
  font-weight: bold;
  color: var(--text-primary);
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
  background: var(--bg-secondary);
  border: var(--glass-border);
  border-radius: 12px;
  padding: 12px 24px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
}

.controls-row {
  display: flex;
  gap: 16px;
  width: 100%;
  justify-content: center;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  min-width: 120px;
}

/* Botón Iniciar */
.btn-start {
  background: rgba(0, 255, 102, 0.1);
  border: 1px solid rgba(0, 255, 102, 0.25);
  color: var(--neon-green);
}

.btn-start:hover {
  background: var(--neon-green);
  color: #11111b;
  border-color: var(--neon-green);
  box-shadow: var(--glow-green);
}

/* Botón Pausar */
.btn-pause {
  background: rgba(229, 200, 144, 0.15);
  border: 1px solid rgba(229, 200, 144, 0.3);
  color: #e5c890;
}

.btn-pause:hover {
  background: #e5c890;
  color: #11111b;
  border-color: #e5c890;
  box-shadow: 0 0 10px rgba(229, 200, 144, 0.25);
}

/* Botón Reiniciar */
.btn-reset {
  background: rgba(244, 63, 94, 0.1);
  border: 1px solid rgba(244, 63, 94, 0.25);
  color: #f43f5e;
}

.btn-reset:hover {
  background: #f43f5e;
  color: #ffffff;
  border-color: #f43f5e;
  box-shadow: 0 0 10px rgba(244, 63, 94, 0.25);
}

.control-icon {
  width: 14px;
  height: 14px;
}

.control-btn:active {
  transform: translateY(1px);
}
</style>
