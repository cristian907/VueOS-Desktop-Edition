<template>
  <div class="weather-container" :class="activeWeather.id">
    <!-- LIENZO PARA LA SIMULACIÓN DE PARTÍCULAS (LLUVIA / NIEVE) -->
    <canvas ref="particleCanvasRef" class="particle-canvas"></canvas>

    <!-- BARRA LATERAL DE CIUDADES -->
    <aside class="weather-sidebar">
      <div class="sidebar-header">
        <MapPinIcon class="header-icon" />
        <span>KWEATHER</span>
      </div>

      <div class="cities-list">
        <button
          v-for="city in cities"
          :key="city.name"
          type="button"
          class="city-btn"
          :class="{ active: currentCity.name === city.name }"
          @click="selectCity(city)"
        >
          <div class="city-info">
            <span class="city-name">{{ city.name }}</span>
            <span class="city-country">{{ city.country }}</span>
          </div>
          <span class="city-temp">{{ city.weatherData[activeTab].temp }}°</span>
        </button>
      </div>

      <div class="sidebar-footer">
        <span>KDE Plasma Weather</span>
      </div>
    </aside>

    <!-- CUERPO PRINCIPAL DEL CLIMA -->
    <main class="weather-main">
      <!-- HEADER CON INFORMACIÓN PRINCIPAL Y SELECTOR DE CLIMA MANUAL (SIMULADOR) -->
      <header class="weather-header">
        <div class="main-info">
          <h2 class="city-title">{{ currentCity.name }}</h2>
          <p class="weather-desc">{{ activeWeather.name }}</p>
        </div>

        <!-- SIMULADOR INTERACTIVO DE CLIMA -->
        <div class="weather-simulator-controls">
          <span class="sim-label">Modo Clima:</span>
          <div class="sim-buttons">
            <button
              v-for="state in weatherStates"
              :key="state.id"
              type="button"
              class="sim-btn"
              :class="{ active: simulatedWeatherId === state.id }"
              @click="setSimulatedWeather(state.id)"
              :title="state.name"
            >
              <component :is="state.icon" class="sim-icon" />
            </button>
          </div>
        </div>
      </header>

      <!-- SECCIÓN PRINCIPAL: TEMPERATURA Y TARJETAS DE DETALLES -->
      <section class="weather-body">
        <div class="hero-weather-card">
          <div class="temp-big-row">
            <component :is="activeWeather.icon" class="hero-weather-icon animated-float" />
            <div class="temp-col">
              <span class="big-temp">{{ currentCity.weatherData[activeTab].temp }}°C</span>
              <span class="feels-like">Sensación térmica: {{ currentCity.weatherData[activeTab].feelsLike }}°C</span>
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <DropletsIcon class="stat-icon color-cyan" />
            <div class="stat-details">
              <span class="stat-value">{{ currentCity.weatherData[activeTab].humidity }}%</span>
              <span class="stat-lbl">Humedad</span>
            </div>
          </div>

          <div class="stat-card">
            <WindIcon class="stat-icon color-blue" />
            <div class="stat-details">
              <span class="stat-value">{{ currentCity.weatherData[activeTab].wind }} km/h</span>
              <span class="stat-lbl">Viento</span>
            </div>
          </div>

          <div class="stat-card">
            <SunIcon class="stat-icon color-yellow" />
            <div class="stat-details">
              <span class="stat-value">{{ currentCity.weatherData[activeTab].uv }}</span>
              <span class="stat-lbl">Índice UV</span>
            </div>
          </div>

          <div class="stat-card">
            <GaugeIcon class="stat-icon color-magenta" />
            <div class="stat-details">
              <span class="stat-value">{{ currentCity.weatherData[activeTab].pressure }} hPa</span>
              <span class="stat-lbl">Presión</span>
            </div>
          </div>
        </div>
      </section>

      <!-- GRÁFICO SVG DE TEMPERATURA DEL DÍA -->
      <section class="weather-graph-section">
        <h4 class="section-title">Fluctuación de Temperatura (Hoy)</h4>
        <div class="svg-graph-container">
          <svg class="graph-svg" viewBox="0 0 500 120" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.45" />
                <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.0" />
              </linearGradient>
            </defs>
            
            <!-- Grid de fondo -->
            <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255, 255, 255, 0.05)" stroke-dasharray="4" />
            <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(255, 255, 255, 0.05)" stroke-dasharray="4" />
            <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255, 255, 255, 0.05)" stroke-dasharray="4" />
            
            <!-- Relleno inferior -->
            <path :d="graphAreaPath" fill="url(#area-grad)" />

            <!-- Línea de temperatura diurna -->
            <path :d="graphLinePath" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" />

            <!-- Puntos de datos y texto de temperatura -->
            <g v-for="(pt, idx) in graphPoints" :key="idx">
              <circle :cx="pt.x" :cy="pt.y" r="5" fill="var(--bg-secondary)" stroke="var(--accent)" stroke-width="2" />
              <text :x="pt.x" :y="pt.y - 12" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="bold" font-family="monospace">
                {{ pt.temp }}°
              </text>
              <text :x="pt.x" :y="110" text-anchor="middle" fill="var(--text-secondary)" font-size="8" font-family="sans-serif">
                {{ pt.time }}
              </text>
            </g>
          </svg>
        </div>
      </section>

      <!-- PRONÓSTICO DE 5 DÍAS -->
      <section class="forecast-section">
        <h4 class="section-title">Pronóstico de la Semana</h4>
        <div class="forecast-grid">
          <div
            v-for="(day, index) in currentCity.forecast"
            :key="index"
            class="forecast-card"
            :class="{ active: index === activeTab }"
            @click="activeTab = index"
          >
            <span class="forecast-day">{{ day.day }}</span>
            <component :is="getWeatherIcon(day.weatherId)" class="forecast-icon" />
            <div class="forecast-temp-range">
              <span class="temp-max">{{ day.tempMax }}°</span>
              <span class="temp-min">{{ day.tempMin }}°</span>
            </div>
            <span class="forecast-state">{{ day.stateName }}</span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  MapPin as MapPinIcon,
  Sun as SunIcon,
  CloudSun as CloudSunIcon,
  Cloud as CloudIcon,
  CloudRain as RainIcon,
  CloudLightning as StormIcon,
  CloudSnow as SnowIcon,
  Droplets as DropletsIcon,
  Wind as WindIcon,
  Gauge as GaugeIcon
} from 'lucide-vue-next';

// --- CLIMAS DEFINIDOS ---
const weatherStates = [
  { id: 'sunny', name: 'Soleado', icon: SunIcon, bg: 'linear-gradient(135deg, #2b3a4a 0%, #15222d 100%)' },
  { id: 'cloudy', name: 'Nublado', icon: CloudIcon, bg: 'linear-gradient(135deg, #202428 0%, #111416 100%)' },
  { id: 'rainy', name: 'Lluvioso', icon: RainIcon, bg: 'linear-gradient(135deg, #1b2631 0%, #0d1318 100%)' },
  { id: 'stormy', name: 'Tormenta', icon: StormIcon, bg: 'linear-gradient(135deg, #18192b 0%, #0a0b12 100%)' },
  { id: 'snowy', name: 'Nieve', icon: SnowIcon, bg: 'linear-gradient(135deg, #1c2d3d 0%, #0c1720 100%)' },
] as const;

// Datos realistas y dinámicos para ciudades de Venezuela y globales
const cities = [
  {
    name: 'Valencia',
    country: 'Venezuela',
    weatherData: [
      { temp: 32, feelsLike: 35, humidity: 74, wind: 12, uv: 9, pressure: 1012 },
      { temp: 31, feelsLike: 34, humidity: 78, wind: 10, uv: 8, pressure: 1011 },
      { temp: 28, feelsLike: 31, humidity: 82, wind: 16, uv: 5, pressure: 1010 },
      { temp: 30, feelsLike: 33, humidity: 76, wind: 11, uv: 8, pressure: 1012 },
      { temp: 33, feelsLike: 36, humidity: 70, wind: 9, uv: 10, pressure: 1013 },
    ],
    forecast: [
      { day: 'Hoy', weatherId: 'sunny', tempMax: 33, tempMin: 23, stateName: 'Despejado' },
      { day: 'Mar', weatherId: 'sunny', tempMax: 32, tempMin: 22, stateName: 'Despejado' },
      { day: 'Mié', weatherId: 'rainy', tempMax: 29, tempMin: 21, stateName: 'Chubascos' },
      { day: 'Jue', weatherId: 'cloudy', tempMax: 31, tempMin: 22, stateName: 'Parcialmente' },
      { day: 'Vie', weatherId: 'stormy', tempMax: 28, tempMin: 20, stateName: 'Tormentas' }
    ],
    hourlyTemp: [23, 25, 29, 33, 31, 26]
  },
  {
    name: 'Caracas',
    country: 'Venezuela',
    weatherData: [
      { temp: 26, feelsLike: 27, humidity: 68, wind: 15, uv: 8, pressure: 1015 },
      { temp: 25, feelsLike: 26, humidity: 72, wind: 14, uv: 7, pressure: 1014 },
      { temp: 24, feelsLike: 25, humidity: 75, wind: 18, uv: 6, pressure: 1013 },
      { temp: 27, feelsLike: 28, humidity: 65, wind: 12, uv: 9, pressure: 1016 },
      { temp: 28, feelsLike: 29, humidity: 62, wind: 10, uv: 9, pressure: 1017 },
    ],
    forecast: [
      { day: 'Hoy', weatherId: 'sunny', tempMax: 27, tempMin: 18, stateName: 'Despejado' },
      { day: 'Mar', weatherId: 'cloudy', tempMax: 26, tempMin: 17, stateName: 'Parcialmente' },
      { day: 'Mié', weatherId: 'rainy', tempMax: 24, tempMin: 16, stateName: 'Llovizna' },
      { day: 'Jue', weatherId: 'sunny', tempMax: 28, tempMin: 18, stateName: 'Soleado' },
      { day: 'Vie', weatherId: 'sunny', tempMax: 29, tempMin: 19, stateName: 'Soleado' }
    ],
    hourlyTemp: [18, 20, 24, 27, 25, 21]
  },
  {
    name: 'San Cristóbal',
    country: 'Venezuela',
    weatherData: [
      { temp: 23, feelsLike: 24, humidity: 82, wind: 8, uv: 6, pressure: 1016 },
      { temp: 21, feelsLike: 21, humidity: 88, wind: 11, uv: 4, pressure: 1014 },
      { temp: 20, feelsLike: 20, humidity: 90, wind: 14, uv: 3, pressure: 1013 },
      { temp: 24, feelsLike: 25, humidity: 78, wind: 9, uv: 7, pressure: 1017 },
      { temp: 25, feelsLike: 26, humidity: 75, wind: 7, uv: 8, pressure: 1018 },
    ],
    forecast: [
      { day: 'Hoy', weatherId: 'rainy', tempMax: 24, tempMin: 15, stateName: 'Chubascos' },
      { day: 'Mar', weatherId: 'stormy', tempMax: 22, tempMin: 14, stateName: 'Tormentas' },
      { day: 'Mié', weatherId: 'stormy', tempMax: 20, tempMin: 13, stateName: 'Tormentas' },
      { day: 'Jue', weatherId: 'cloudy', tempMax: 24, tempMin: 16, stateName: 'Nublado' },
      { day: 'Vie', weatherId: 'sunny', tempMax: 25, tempMin: 17, stateName: 'Despejado' }
    ],
    hourlyTemp: [15, 17, 21, 24, 22, 18]
  },
  {
    name: 'Tokyo',
    country: 'Japón',
    weatherData: [
      { temp: 18, feelsLike: 17, humidity: 55, wind: 14, uv: 5, pressure: 1019 },
      { temp: 15, feelsLike: 14, humidity: 62, wind: 20, uv: 3, pressure: 1017 },
      { temp: 12, feelsLike: 10, humidity: 70, wind: 25, uv: 2, pressure: 1014 },
      { temp: 16, feelsLike: 15, humidity: 50, wind: 16, uv: 6, pressure: 1019 },
      { temp: 20, feelsLike: 20, humidity: 48, wind: 12, uv: 7, pressure: 1021 },
    ],
    forecast: [
      { day: 'Hoy', weatherId: 'cloudy', tempMax: 19, tempMin: 11, stateName: 'Nublado' },
      { day: 'Mar', weatherId: 'rainy', tempMax: 16, tempMin: 9, stateName: 'Lluvia Fuerte' },
      { day: 'Mié', weatherId: 'stormy', tempMax: 13, tempMin: 8, stateName: 'Borrasca' },
      { day: 'Jue', weatherId: 'sunny', tempMax: 18, tempMin: 10, stateName: 'Despejado' },
      { day: 'Vie', weatherId: 'sunny', tempMax: 21, tempMin: 12, stateName: 'Despejado' }
    ],
    hourlyTemp: [11, 13, 17, 19, 16, 13]
  }
];

// --- STATE ---
const currentCity = ref(cities[0]);
const activeTab = ref(0);
const simulatedWeatherId = ref<'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | null>(null);

// Lienzo de animación
const particleCanvasRef = ref<HTMLCanvasElement | null>(null);

// --- COMPUTEDS ---
// Obtener clima activo real o simulado
const activeWeather = computed(() => {
  if (simulatedWeatherId.value) {
    return weatherStates.find(w => w.id === simulatedWeatherId.value)!;
  }
  // Tomar el estado del forecast activo según la pestaña seleccionada
  const activeForecast = currentCity.value.forecast[activeTab.value];
  return weatherStates.find(w => w.id === activeForecast.weatherId)!;
});

// Generar coordenadas y paths del gráfico SVG de forma reactiva
const graphPoints = computed(() => {
  const temps = currentCity.value.hourlyTemp;
  const times = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
  const minTemp = Math.min(...temps) - 2;
  const maxTemp = Math.max(...temps) + 2;
  const range = maxTemp - minTemp;
  
  return temps.map((t, idx) => {
    // Escalar puntos de forma proporcional en un viewBox de 500x120
    const x = 40 + idx * 84;
    // t = maxTemp -> y = 25, t = minTemp -> y = 95
    const y = 95 - ((t - minTemp) / range) * 70;
    return { x, y, temp: t, time: times[idx] };
  });
});

const graphLinePath = computed(() => {
  const pts = graphPoints.value;
  if (pts.length === 0) return '';
  
  // Dibujar curva bezier suave
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const cpX1 = pts[i].x + 42;
    const cpY1 = pts[i].y;
    const cpX2 = pts[i + 1].x - 42;
    const cpY2 = pts[i + 1].y;
    d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pts[i+1].x} ${pts[i+1].y}`;
  }
  return d;
});

const graphAreaPath = computed(() => {
  const pts = graphPoints.value;
  if (pts.length === 0) return '';
  const linePath = graphLinePath.value;
  
  // Cerrar el polígono de abajo para rellenar con degradado
  return `${linePath} L ${pts[pts.length - 1].x} 100 L ${pts[0].x} 100 Z`;
});

// --- METHODS ---
function selectCity(city: typeof cities[0]) {
  currentCity.value = city;
  activeTab.value = 0;
  // Reiniciar simulación al cambiar de ciudad para ver el clima real
  simulatedWeatherId.value = null;
}

function setSimulatedWeather(weatherId: typeof simulatedWeatherId.value) {
  simulatedWeatherId.value = weatherId;
}

function getWeatherIcon(weatherId: string) {
  const state = weatherStates.find(w => w.id === weatherId);
  return state ? state.icon : SunIcon;
}

// --- PARTICLE ANIMATION SYSTEM (HTML5 CANVAS) ---
let animFrameId: number;
let particles: { x: number; y: number; vy: number; vx: number; r: number; alpha: number }[] = [];

function initParticles() {
  const canvas = particleCanvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  particles = [];
  const maxParticles = activeWeather.value.id === 'rainy' ? 120 : activeWeather.value.id === 'stormy' ? 160 : activeWeather.value.id === 'snowy' ? 90 : 0;

  for (let i = 0; i < maxParticles; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vy: activeWeather.value.id === 'snowy' ? 1 + Math.random() * 1.5 : 8 + Math.random() * 5, // nieve lenta, lluvia rápida
      vx: activeWeather.value.id === 'snowy' ? -0.5 + Math.random() : -1 - Math.random() * 0.5,
      r: activeWeather.value.id === 'snowy' ? 2 + Math.random() * 3 : 1,
      alpha: 0.2 + Math.random() * 0.5
    });
  }
}

function updateAndDrawParticles() {
  const canvas = particleCanvasRef.value;
  const c = canvas?.getContext('2d');
  if (!canvas || !c) return;

  c.clearRect(0, 0, canvas.width, canvas.height);

  const weatherId = activeWeather.value.id;

  // Lógica de Rayos para Tormentas
  if (weatherId === 'stormy' && Math.random() > 0.985) {
    c.fillStyle = `rgba(255, 255, 255, ${0.15 + Math.random() * 0.25})`;
    c.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (particles.length === 0) return;

  particles.forEach(p => {
    // Dibujar partícula
    c.beginPath();
    c.fillStyle = weatherId === 'snowy' 
      ? `rgba(255, 255, 255, ${p.alpha})` 
      : `rgba(165, 220, 255, ${p.alpha * 0.7})`;

    if (weatherId === 'snowy') {
      c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      c.fill();
    } else {
      // Dibujar gotas estiradas para lluvia
      c.lineWidth = 1.5;
      c.strokeStyle = `rgba(174, 219, 255, ${p.alpha * 0.6})`;
      c.moveTo(p.x, p.y);
      c.lineTo(p.x + p.vx * 1.2, p.y + p.vy * 1.2);
      c.stroke();
    }

    // Actualizar posición
    p.y += p.vy;
    p.x += p.vx;

    // Reset si sale de la pantalla
    if (p.y > canvas.height) {
      p.y = -10;
      p.x = Math.random() * canvas.width;
    }
    if (p.x < -10) {
      p.x = canvas.width + 10;
    }
  });
}

function startAnimationLoop() {
  function loop() {
    updateAndDrawParticles();
    animFrameId = requestAnimationFrame(loop);
  }
  loop();
}

// Observar cambios de clima reactivamente para recrear partículas
watch(() => activeWeather.value.id, () => {
  initParticles();
});

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  initParticles();
  startAnimationLoop();

  // Escuchar redimensión de la app para ajustar la resolución del Canvas
  const parent = particleCanvasRef.value?.parentElement;
  if (parent) {
    resizeObserver = new ResizeObserver(() => {
      initParticles();
    });
    resizeObserver.observe(parent);
  }
});

onUnmounted(() => {
  cancelAnimationFrame(animFrameId);
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<style scoped>
.weather-container {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #0d0f12;
  font-family: var(--font-family-base), sans-serif;
  color: var(--text-primary);
  overflow: hidden;
  user-select: none;
  transition: background-image 0.6s ease;
}

/* GRADIENTES REACTIVOS A LOS CLIMAS */
.weather-container.sunny { background-image: linear-gradient(135deg, #182a3c 0%, #0c151e 100%); }
.weather-container.cloudy { background-image: linear-gradient(135deg, #1f2327 0%, #101214 100%); }
.weather-container.rainy { background-image: linear-gradient(135deg, #13222e 0%, #0a1117 100%); }
.weather-container.stormy { background-image: linear-gradient(135deg, #121324 0%, #06060c 100%); }
.weather-container.snowy { background-image: linear-gradient(135deg, #192b3a 0%, #0c161e 100%); }

/* CANVAS DE PARTÍCULAS */
.particle-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

/* BARRA LATERAL (ESTILO SERIO KDE BREEZE) */
.weather-sidebar {
  width: 220px;
  background: rgba(20, 24, 28, 0.45);
  border-right: 1px solid var(--border-color);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  padding: 16px 8px;
  gap: 16px;
  z-index: 2;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 10px;
  font-size: 0.72rem;
  font-weight: bold;
  color: var(--accent);
  letter-spacing: 1px;
}

.header-icon {
  width: 14px;
  height: 14px;
}

.cities-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.city-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  text-align: left;
  transition: all var(--transition-fast) ease;
}

.city-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.city-btn.active {
  background: var(--bg-active) !important;
  color: var(--accent) !important;
  font-weight: bold;
  box-shadow: inset 3px 0 0 var(--accent);
}

.city-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.city-name {
  font-size: 0.8rem;
  font-weight: 600;
}

.city-country {
  font-size: 0.65rem;
  opacity: 0.7;
}

.city-temp {
  font-size: 0.95rem;
  font-weight: bold;
  font-family: monospace;
}

.sidebar-footer {
  font-size: 0.65rem;
  color: var(--text-disabled);
  text-align: center;
  opacity: 0.6;
}

/* ÁREA DE CONTENIDO PRINCIPAL */
.weather-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 24px;
  overflow-y: auto;
  z-index: 2;
  scrollbar-width: thin;
}

.weather-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.city-title {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.weather-desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Panel simulador manual */
.weather-simulator-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  padding: 4px 10px;
  border-radius: var(--radius-lg);
  backdrop-filter: blur(10px);
}

.sim-label {
  font-size: 0.68rem;
  font-weight: bold;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.sim-buttons {
  display: flex;
  gap: 4px;
}

.sim-btn {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.sim-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sim-btn.active {
  background: var(--bg-active) !important;
  color: var(--accent) !important;
}

.sim-icon {
  width: 14px;
  height: 14px;
}

/* CARDS PRINCIPALES */
.weather-body {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 20px;
}

.hero-weather-card {
  background: rgba(15, 23, 42, 0.3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  align-items: center;
  backdrop-filter: blur(10px);
}

.temp-big-row {
  display: flex;
  align-items: center;
  gap: 24px;
}

.hero-weather-icon {
  width: 68px;
  height: 68px;
  color: var(--accent);
  filter: drop-shadow(0 0 12px rgba(61, 174, 233, 0.45));
}

.temp-col {
  display: flex;
  flex-direction: column;
}

.big-temp {
  font-size: 3rem;
  font-weight: 900;
  font-family: monospace;
  line-height: 1;
}

.feels-like {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Tarjetas stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  background: rgba(15, 23, 42, 0.3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  backdrop-filter: blur(10px);
}

.stat-icon {
  width: 22px;
  height: 22px;
  opacity: 0.9;
}

.stat-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 0.9rem;
  font-weight: bold;
  font-family: monospace;
}

.stat-lbl {
  font-size: 0.68rem;
  color: var(--text-secondary);
}

/* Colores de iconos */
.color-cyan { color: #00f3ff; }
.color-blue { color: var(--accent); }
.color-yellow { color: #f1c40f; }
.color-magenta { color: #d42dd4; }

/* SECCIÓN DEL GRÁFICO */
.weather-graph-section {
  background: rgba(15, 23, 42, 0.3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 18px 24px;
  backdrop-filter: blur(10px);
}

.section-title {
  font-size: 0.72rem;
  font-weight: bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 4px;
}

.svg-graph-container {
  width: 100%;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.graph-svg {
  width: 100%;
  height: 100%;
  max-width: 500px;
  overflow: visible;
}

/* PRONÓSTICO SEMANAL */
.forecast-section {
  display: flex;
  flex-direction: column;
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.forecast-card {
  background: rgba(15, 23, 42, 0.3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all var(--transition-fast) ease;
}

.forecast-card:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
  transform: translateY(-2px);
}

.forecast-card.active {
  background: var(--bg-active) !important;
  border-color: var(--accent) !important;
  box-shadow: 0 4px 12px rgba(61, 174, 233, 0.15);
}

.forecast-day {
  font-size: 0.75rem;
  font-weight: bold;
}

.forecast-icon {
  width: 28px;
  height: 28px;
  color: var(--accent);
}

.forecast-temp-range {
  display: flex;
  gap: 6px;
  font-size: 0.75rem;
  font-family: monospace;
}

.temp-max {
  font-weight: bold;
}

.temp-min {
  color: var(--text-secondary);
}

.forecast-state {
  font-size: 0.65rem;
  color: var(--text-secondary);
  text-align: center;
}

/* Animaciones flotantes */
.animated-float {
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
}
</style>
