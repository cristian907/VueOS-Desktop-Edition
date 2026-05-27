<template>
  <div class="power-menu-dropdown" ref="dropdownRef" @click.stop>
    <!-- SECCIÓN 1: CONTROLES DE ESTADO RÁPIDO (INTERNET & BATERÍA) -->
    <div class="quick-status-section">
      <!-- Mini Tarjeta de Internet/Wifi -->
      <div class="quick-card">
        <div class="quick-card-header">
          <div class="header-info">
            <WifiIcon v-if="osStore.stats.networkOnline !== false" class="card-icon icon-online" />
            <WifiOffIcon v-else class="card-icon icon-offline" />
            <div class="text-group">
              <span class="card-label">Wi-Fi</span>
              <span class="card-value">{{ osStore.stats.networkOnline !== false ? configStore.networkSSID : 'Desconectado' }}</span>
            </div>
          </div>
          <button class="more-options-btn" @click="goToNetworkSettings" title="Configurar Internet">
            <ChevronRightIcon class="chevron-icon" />
          </button>
        </div>
      </div>

      <!-- Mini Tarjeta de Batería y Ahorro de Energía -->
      <div class="quick-card" :class="{ 'card-active': configStore.batterySaver }">
        <div class="quick-card-header">
          <div class="header-info">
            <BatteryChargingIcon v-if="osStore.stats.batteryCharging" class="card-icon icon-charging" />
            <BatteryIcon v-else class="card-icon" />
            <div class="text-group">
              <span class="card-label">Ahorro de Batería</span>
              <span class="card-value">{{ configStore.batterySaver ? 'Activado' : 'Desactivado' }}</span>
            </div>
          </div>
          <button
            class="mini-switch"
            :class="{ 'switch-on': configStore.batterySaver }"
            @click="configStore.batterySaver = !configStore.batterySaver"
            role="switch"
            :aria-checked="configStore.batterySaver"
            title="Alternar Ahorro de Batería"
          >
            <div class="switch-bullet"></div>
          </button>
        </div>
      </div>
    </div>

    <div class="menu-divider"></div>

    <!-- SECCIÓN 2: CONTROL DESLIZANTE DE VOLUMEN RÁPIDO -->
    <div class="quick-slider-section">
      <button class="slider-icon-btn" @click="audioStore.toggleMute" title="Silenciar">
        <component :is="audioStore.iconType" class="slider-icon-svg" />
      </button>
      <input
        type="range"
        min="0"
        max="100"
        :value="audioStore.isMuted ? 0 : audioStore.volume"
        @input="onVolumeChange"
        class="breeze-slider"
        aria-label="Volumen rápido"
      />
      <span class="slider-val">{{ audioStore.isMuted ? 'Mute' : `${audioStore.volume}%` }}</span>
    </div>

    <div class="menu-divider"></div>

    <!-- SECCIÓN 2.5: CONTROL DESLIZANTE DE BRILLO RÁPIDO -->
    <div class="quick-slider-section">
      <div class="slider-icon-static" title="Brillo de pantalla">
        <SunIcon class="slider-icon-svg" />
      </div>
      <input
        type="range"
        min="20"
        max="100"
        v-model.number="configStore.brightness"
        class="breeze-slider"
        aria-label="Brillo rápido"
      />
      <span class="slider-val">{{ configStore.brightness }}%</span>
    </div>

    <div class="menu-divider"></div>

    <!-- SECCIÓN 3: BOTONES DE ENERGÍA -->
    <div class="power-buttons-row">
      <!-- Bloquear Sesión -->
      <button type="button" class="power-btn" @click="handleLock" title="Bloquear sesión">
        <LockIcon class="power-btn-icon" />
        <span class="power-btn-label">Bloquear</span>
      </button>

      <!-- Reiniciar -->
      <button type="button" class="power-btn" @click="handleRestart" title="Reiniciar sistema">
        <RotateCwIcon class="power-btn-icon" />
        <span class="power-btn-label">Reiniciar</span>
      </button>

      <!-- Apagar -->
      <button type="button" class="power-btn power-btn-danger" @click="handleShutdown" title="Apagar equipo">
        <PowerIcon class="power-btn-icon" />
        <span class="power-btn-label">Apagar</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useOSStore } from '@/stores/osStore';
import { useConfigStore } from '@/stores/configStore';
import { useAudioStore } from '@/stores/audioStore';
import {
  Lock as LockIcon,
  RotateCw as RotateCwIcon,
  Power as PowerIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  ChevronRight as ChevronRightIcon,
  Battery as BatteryIcon,
  BatteryCharging as BatteryChargingIcon,
  Sun as SunIcon
} from 'lucide-vue-next';

const osStore = useOSStore();
const configStore = useConfigStore();
const audioStore = useAudioStore();

const dropdownRef = ref<HTMLElement | null>(null);
const emit = defineEmits(['close']);

function onVolumeChange(e: Event) {
  const val = Number((e.target as HTMLInputElement).value);
  audioStore.setVolume(val);
}

function goToNetworkSettings() {
  emit('close');
  osStore.openWindow('NetworkApp');
}

// ---- Lógica de las Opciones ----

function handleShutdown() {
  emit('close');
  if (window.osAPI && typeof window.osAPI.shutdown === 'function') {
    window.osAPI.shutdown();
  } else {
    console.warn('[Power] Apagado invocado fuera del contenedor de Electron.');
    alert('Apagado físico simulado. Sesión finalizada.');
  }
}

function handleRestart() {
  emit('close');
  osStore.isBooting = true;
  osStore.windows = [];
  try {
    const audioCtx = (window as any).audioContext;
    if (audioCtx) audioCtx.close();
  } catch (e) {}

  setTimeout(() => {
    osStore.isBooting = false;
    osStore.isAuthenticated = false;
  }, 5000);
}

function handleLock() {
  emit('close');
  osStore.isAuthenticated = false;
}

// ---- Control de Cierre al Hacer Click Fuera ----
function handleOutsideClick(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    emit('close');
  }
}

onMounted(() => {
  setTimeout(() => {
    window.addEventListener('click', handleOutsideClick);
  }, 20);
});

onUnmounted(() => {
  window.removeEventListener('click', handleOutsideClick);
});
</script>

<style scoped>
.power-menu-dropdown {
  position: absolute;
  bottom: 48px;
  right: 4px;
  width: 300px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 12px;
  box-shadow: var(--shadow-popup);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000000;
  animation: dropdownSlide 180ms cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
}

@keyframes dropdownSlide {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.menu-divider {
  height: 1px;
  background: var(--border-color);
}

/* ── SECCIÓN 1: QUICK STATUS CARDS ── */
.quick-status-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quick-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  transition: all var(--transition-fast);
}

.card-active {
  border-color: var(--accent);
}

.quick-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-icon {
  width: 18px;
  height: 18px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.icon-online {
  color: var(--accent);
}

.icon-offline {
  color: var(--danger);
}

.icon-charging {
  color: var(--success);
}

.text-group {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 0.72rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.card-value {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* Botón Más opciones */
.more-options-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
}

.more-options-btn:hover {
  background: var(--bg-hover);
  color: var(--accent);
}

.chevron-icon {
  width: 14px;
  height: 14px;
}

/* Interruptor Mini */
.mini-switch {
  width: 38px;
  height: 20px;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: all 200ms ease;
  outline: none;
}

.switch-bullet {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background: var(--text-secondary);
  border-radius: 50%;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.switch-on {
  background: var(--accent);
  border-color: var(--accent);
}

.switch-on .switch-bullet {
  left: 20px;
  background: #ffffff;
}

/* ── SECCIÓN 2: SLIDERS ── */
.quick-slider-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 4px;
}

.slider-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  outline: none;
  transition: color var(--transition-fast);
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.slider-icon-btn:hover {
  color: var(--accent);
}

.slider-icon-static {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.slider-icon-svg {
  width: 16px;
  height: 16px;
}

/* Slider Breeze */
.breeze-slider {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--border-color);
  outline: none;
}

.breeze-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  height: 14px;
  width: 14px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: 2px solid var(--bg-secondary);
  box-shadow: var(--shadow-subtle);
  transition: transform var(--transition-fast);
}

.breeze-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.slider-val {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
  width: 38px;
  text-align: right;
}

/* ── SECCIÓN 3: BOTONES DE ENERGÍA ── */
.power-buttons-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 4px 0 2px;
}

.power-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  outline: none;
  transition: all var(--transition-fast);
}

.power-btn:hover {
  background: var(--bg-hover);
  color: var(--accent);
  border-color: var(--border-hover);
}

.power-btn-danger:hover {
  background: rgba(237, 21, 21, 0.1);
  color: var(--danger);
  border-color: rgba(237, 21, 21, 0.3);
}

.power-btn-icon {
  width: 18px;
  height: 18px;
}

.power-btn-label {
  font-size: 0.68rem;
  font-weight: 500;
}
</style>
