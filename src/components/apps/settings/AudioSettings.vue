<template>
  <div class="audio-settings-container">
    <!-- PANEL DE VOLUMEN PRINCIPAL -->
    <SettingCard title="Volumen Principal" :icon="Volume2Icon">
      <div class="audio-control-panel">
        <div class="control-row">
          <!-- Icono Dinámico Interactible con Animación de Silencio -->
          <button
            class="mute-toggle-btn"
            :class="{ 'is-muted': audioStore.isMuted }"
            @click="audioStore.toggleMute"
            title="Alternar Silencio (Mute)"
          >
            <component :is="audioStore.iconType" class="volume-icon-svg" />
          </button>

          <!-- Slider Estilizado Breeze -->
          <div class="slider-wrapper">
            <input
              type="range"
              min="0"
              max="100"
              :value="audioStore.isMuted ? 0 : audioStore.volume"
              @input="onVolumeChange"
              class="breeze-slider"
              aria-label="Volumen del sistema"
            />
          </div>

          <!-- Indicador Numérico Brillante -->
          <div class="volume-display" :class="{ 'text-muted': audioStore.isMuted }">
            <span v-if="audioStore.isMuted" class="muted-label">SILENCIADO</span>
            <span v-else class="volume-percent">{{ audioStore.volume }}%</span>
          </div>
        </div>
      </div>
    </SettingCard>
  </div>
</template>

<script setup lang="ts">
import { useAudioStore } from '@/stores/audioStore';
import SettingCard from '@/components/ui/SettingCard.vue';
import { Volume2 as Volume2Icon } from 'lucide-vue-next';

const audioStore = useAudioStore();

function onVolumeChange(e: Event) {
  const val = Number((e.target as HTMLInputElement).value);
  audioStore.setVolume(val);
}
</script>

<style scoped>
.audio-settings-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.35s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.audio-control-panel {
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

/* Botón Mute Dinámico interactivo */
.mute-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  outline: none;
  transition: all var(--transition-fast);
}

.mute-toggle-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
  color: var(--accent);
}

.mute-toggle-btn.is-muted {
  color: var(--danger);
  border-color: var(--danger);
}

.mute-toggle-btn.is-muted:hover {
  background: rgba(237, 21, 21, 0.1);
}

.volume-icon-svg {
  width: 20px;
  height: 20px;
  transition: transform 0.2s ease;
}

.mute-toggle-btn:active .volume-icon-svg {
  transform: scale(0.9);
}

/* Envoltorio del Slider */
.slider-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
}

/* Input Range Breeze */
.breeze-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--border-color);
  outline: none;
  transition: all 0.2s ease;
}

/* Estilo del Track de Carga */
.breeze-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 6px;
  cursor: pointer;
}

/* Estilo del Botón de Arrastre (Thumb) - Webkit */
.breeze-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  cursor: pointer;
  margin-top: -5px;
  transition: all 0.2s ease;
}

.breeze-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  background: var(--accent-hover);
}

/* Estilo del Botón de Arrastre (Thumb) - Firefox */
.breeze-slider::-moz-range-thumb {
  height: 14px;
  width: 14px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.breeze-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  background: var(--accent-hover);
}

/* Indicador de Volumen */
.volume-display {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90px;
  height: 36px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: bold;
  letter-spacing: 0.5px;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.volume-display.text-muted {
  color: var(--danger);
  border-color: var(--danger);
}

.muted-label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.8px;
}

.volume-percent {
  font-size: 0.95rem;
}
</style>
