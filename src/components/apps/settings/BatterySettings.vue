<template>
  <div class="settings-section">
    <!-- PANEL DE BRILLO -->
    <SettingCard title="Brillo de Pantalla" :icon="SunIcon">
      <div class="setting-rows-list">
        <div class="setting-row-vertical">
          <div class="row-info">
            <span class="row-title">Nivel de Brillo</span>
            <span class="row-sub">Ajusta la intensidad de la retroiluminación de la pantalla del simulador.</span>
          </div>
          <div class="slider-container">
            <SunIcon class="slider-icon min-icon" />
            <input
              type="range"
              min="20"
              max="100"
              v-model.number="configStore.brightness"
              class="brightness-slider"
              aria-label="Brillo del sistema"
            />
            <SunIcon class="slider-icon max-icon glow-sun" />
            <span class="slider-value">{{ configStore.brightness }}%</span>
          </div>
        </div>
      </div>
    </SettingCard>

    <!-- PANEL DE AHORRO DE BATERÍA -->
    <SettingCard title="Ahorro de Batería y Energía" :icon="BatteryIcon">
      <div class="setting-rows-list">
        <div class="setting-row">
          <div class="row-info">
            <span class="row-title">Modo Ahorro de Energía</span>
            <span class="row-sub">Reduce el brillo de la pantalla automáticamente y limita el consumo de recursos virtuales.</span>
          </div>
          <ToggleSwitch v-model="configStore.batterySaver" />
        </div>

        <div class="row-divider"></div>

        <!-- GRÁFICA DE CONSUMO SIMULADO -->
        <div class="consumption-section">
          <div class="consumption-header">
            <span class="consumption-title">Consumo de Energía Estimado</span>
            <div class="consumption-badge" :class="{ 'badge-saving': configStore.batterySaver }">
              <ZapIcon class="badge-icon" />
              <span>{{ configStore.batterySaver ? '4.8 W (Bajo)' : '15.4 W (Normal)' }}</span>
            </div>
          </div>

          <!-- Gráfico SVG Premium con gradiente y glow -->
          <div class="chart-container">
            <svg class="chart-svg" viewBox="0 0 500 150" preserveAspectRatio="none">
              <defs>
                <!-- Gradiente de fondo del gráfico -->
                <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" :stop-color="chartColor" stop-opacity="0.4" />
                  <stop offset="100%" :stop-color="chartColor" stop-opacity="0.0" />
                </linearGradient>
              </defs>

              <!-- Líneas de cuadrícula de fondo -->
              <g class="grid-lines">
                <line x1="0" y1="37.5" x2="500" y2="37.5" stroke="rgba(255, 255, 255, 0.05)" stroke-width="1" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255, 255, 255, 0.05)" stroke-width="1" />
                <line x1="0" y1="112.5" x2="500" y2="112.5" stroke="rgba(255, 255, 255, 0.05)" stroke-width="1" />
              </g>

              <!-- Relleno de la curva -->
              <path :d="fillPath" :fill="`url(#${gradientId})`" class="chart-fill" />

              <!-- Línea brillante -->
              <path :d="linePath" fill="none" :stroke="chartColor" stroke-width="3" stroke-linecap="round" class="chart-line" />
            </svg>
          </div>

          <div class="chart-labels">
            <span>Hace 30s</span>
            <span>Ahora</span>
          </div>
        </div>
      </div>
    </SettingCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useConfigStore } from '@/stores/configStore';
import SettingCard from '@/components/ui/SettingCard.vue';
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue';
import { Sun as SunIcon, Battery as BatteryIcon, Zap as ZapIcon } from 'lucide-vue-next';

const configStore = useConfigStore();
const gradientId = 'consumption-gradient-' + Math.random().toString(36).substr(2, 9);

// Puntos de consumo en tiempo real
const points = ref<number[]>([]);
const maxPoints = 20;

// Inicializar el gráfico con puntos aleatorios
function initChart() {
  const baseVal = configStore.batterySaver ? 25 : 75;
  for (let i = 0; i < maxPoints; i++) {
    const variance = (Math.random() - 0.5) * (configStore.batterySaver ? 5 : 15);
    points.value.push(Math.max(10, Math.min(140, baseVal + variance)));
  }
}

// Color del gráfico dependiendo del modo ahorro
const chartColor = computed(() => {
  return configStore.batterySaver ? 'var(--neon-green)' : 'var(--neon-magenta)';
});

// Generar coordenadas SVG
const linePath = computed(() => {
  if (points.value.length === 0) return '';
  const widthStep = 500 / (maxPoints - 1);
  return points.value.reduce((acc, val, idx) => {
    const x = idx * widthStep;
    // En SVG el eje Y crece hacia abajo, por eso invertimos (150 es el alto)
    const y = 150 - val;
    return acc + `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }, '');
});

const fillPath = computed(() => {
  const path = linePath.value;
  if (!path) return '';
  // Cerrar el polígono de relleno hacia la parte inferior del SVG
  return path + ` L 500 150 L 0 150 Z`;
});

// Temporizador para añadir nuevos puntos en tiempo real
let intervalId: any = null;
function updatePoints() {
  const baseVal = configStore.batterySaver ? 22 : 78;
  const variance = (Math.random() - 0.5) * (configStore.batterySaver ? 4 : 16);
  const nextVal = Math.max(10, Math.min(140, baseVal + variance));

  points.value.shift();
  points.value.push(nextVal);
}

// Reaccionar al cambio inmediato de ahorro de batería para forzar un reajuste rápido del gráfico
watch(() => configStore.batterySaver, (newVal) => {
  const targetBase = newVal ? 22 : 78;
  points.value = points.value.map(p => {
    // Escala los puntos antiguos al nuevo rango simulado
    const ratio = newVal ? 0.3 : 3.0;
    return Math.max(10, Math.min(140, p * ratio));
  });
});

onMounted(() => {
  initChart();
  intervalId = setInterval(updatePoints, 1500);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<style scoped>
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.35s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.setting-rows-list {
  display: flex;
  flex-direction: column;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.setting-row-vertical {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 0;
}

.row-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.row-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.row-sub {
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.row-divider {
  height: 1px;
  background: var(--glass-border);
  margin: 4px 0;
}

/* SLIDER DE BRILLO */
.slider-container {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: var(--glass-border);
  border-radius: 10px;
  padding: 12px 16px;
}

:global(.light-theme) .slider-container {
  background: rgba(0, 0, 0, 0.02);
}

.slider-icon {
  width: 18px;
  height: 18px;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.glow-sun {
  color: var(--neon-cyan);
  filter: drop-shadow(0 0 6px var(--neon-cyan));
}

.brightness-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.08);
  outline: none;
  transition: all 0.3s ease;
}

:global(.light-theme) .brightness-slider {
  background: rgba(0, 0, 0, 0.08);
}

.brightness-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: var(--neon-cyan);
  cursor: pointer;
  box-shadow: var(--glow-cyan);
  transition: transform 0.2s ease;
}

.brightness-slider::-webkit-slider-thumb:hover {
  transform: scale(1.25);
}

.slider-value {
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--neon-cyan);
  min-width: 40px;
  text-align: right;
  font-family: monospace;
}

/* SECCIÓN CONSUMO */
.consumption-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 14px;
}

.consumption-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.consumption-title {
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--text-secondary);
}

.consumption-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(255, 0, 255, 0.1);
  color: var(--neon-magenta);
  border: 1px solid rgba(255, 0, 255, 0.2);
  transition: all 0.3s ease;
}

.consumption-badge.badge-saving {
  background: rgba(0, 255, 102, 0.1);
  color: var(--neon-green);
  border: 1px solid rgba(0, 255, 102, 0.2);
}

.badge-icon {
  width: 12px;
  height: 12px;
}

.chart-container {
  height: 140px;
  background: rgba(0, 0, 0, 0.2);
  border: var(--glass-border);
  border-radius: 12px;
  padding: 10px;
  overflow: hidden;
  position: relative;
}

.chart-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.chart-line {
  transition: stroke 0.5s ease;
  filter: drop-shadow(0 0 5px v-bind(chartColor));
}

.chart-fill {
  transition: fill 0.5s ease;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--text-secondary);
  opacity: 0.6;
}
</style>
