<template>
  <div class="settings-section">
    <!-- PANEL DE PERSONALIZACIÓN DEL SISTEMA -->
    <SettingCard title="Personalización" :icon="PaletteIcon">
      <div class="setting-rows-list">
        <!-- Fila: Modo Claro -->
        <div class="setting-row">
          <div class="row-info">
            <span class="row-title">Modo Claro</span>
            <span class="row-sub">Utilizar un esquema de colores claros para ventanas y paneles (Estilo Breeze Light).</span>
          </div>
          <ToggleSwitch v-model="isLightTheme" />
        </div>
      </div>
    </SettingCard>

    <!-- PANEL DE PERSONALIZACIÓN DEL PANEL DE PLASMA -->
    <SettingCard title="Personalización del Panel (Bandeja de Sistema)" :icon="PanelTopIcon">
      <div class="setting-rows-list">
        <!-- Fila: Mostrar CPU -->
        <div class="setting-row">
          <div class="row-info">
            <span class="row-title">Mostrar CPU</span>
            <span class="row-sub">Visualizar el uso del procesador en la bandeja del panel inferior.</span>
          </div>
          <ToggleSwitch v-model="configStore.showTopbarCpu" />
        </div>

        <div class="row-divider"></div>

        <!-- Fila: Mostrar RAM -->
        <div class="setting-row">
          <div class="row-info">
            <span class="row-title">Mostrar RAM</span>
            <span class="row-sub">Visualizar el consumo de memoria RAM en la bandeja del panel inferior.</span>
          </div>
          <ToggleSwitch v-model="configStore.showTopbarRam" />
        </div>

        <div class="row-divider"></div>

        <!-- Fila: Mostrar Temperatura -->
        <div class="setting-row">
          <div class="row-info">
            <span class="row-title">Mostrar Temperatura</span>
            <span class="row-sub">Visualizar la temperatura del procesador en la bandeja del panel inferior.</span>
          </div>
          <ToggleSwitch v-model="configStore.showTopbarTemp" />
        </div>
      </div>
    </SettingCard>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useConfigStore } from '@/stores/configStore';
import SettingCard from '@/components/ui/SettingCard.vue';
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue';
import { Palette as PaletteIcon, PanelTop as PanelTopIcon } from 'lucide-vue-next';

const configStore = useConfigStore();

// Getter y setter bidireccionales computados sobre el store de Pinia para el tema
const isLightTheme = computed({
  get() {
    return configStore.theme === 'light';
  },
  set() {
    configStore.toggleTheme();
  }
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
  padding: 10px 0;
}

.row-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 16px;
}

.row-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
}

.row-sub {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.row-divider {
  height: 1px;
  background: var(--border-color);
  margin: 6px 0;
}
</style>
