<template>
  <div class="settings-section">
    <!-- TARJETA: ESTADO DEL ADAPTADOR -->
    <SettingCard title="Adaptador Inalámbrico Virtual" :icon="WifiIcon">
      <div class="setting-rows-list">
        <div class="setting-row">
          <div class="row-info">
            <span class="row-title">Estado del Adaptador</span>
            <span class="row-sub">
              Activar o desactivar la interfaz de red virtual del sistema.
              (Estado: <span :class="isAdapterOn ? 'status-on-text' : 'status-off-text'">{{ isAdapterOn ? 'ENCENDIDO' : 'APAGADO' }}</span>)
            </span>
          </div>
          <ToggleSwitch v-model="isAdapterOn" />
        </div>
      </div>
    </SettingCard>

    <!-- CONTENIDO DE REDES CON TRANSICIÓN -->
    <div class="transition-container">
      <!-- Tarjetas de Conexión Activa y Redes si está ENCENDIDO -->
      <div v-if="isAdapterOn" class="networks-wrapper">
        <!-- Red Activa -->
        <SettingCard title="Red Activa" :icon="CheckIcon">
          <div class="active-connection-card">
            <div class="connection-meta">
              <CheckIcon class="check-icon" />
              <div>
                <span class="ssid-name">{{ currentSSID }}</span>
                <span class="connection-strength">Fuerza de señal: Excelente (98%)</span>
              </div>
            </div>
            <span class="connection-pill">CONECTADO</span>
          </div>
          <div class="connection-details">
            <span>Dirección IP virtual: 192.168.1.104</span>
            <span>Puerta de enlace: 192.168.1.1</span>
          </div>
        </SettingCard>

        <!-- Redes Disponibles -->
        <SettingCard title="Redes Wi-Fi Disponibles" :icon="SignalIcon">
          <div class="networks-list">
            <div
              v-for="net in availableNetworks"
              :key="net.ssid"
              class="network-item"
              :class="{ 'connected-item': net.ssid === currentSSID }"
            >
              <div class="net-info">
                <SignalIcon class="signal-icon" />
                <div>
                  <span class="net-ssid">{{ net.ssid }}</span>
                  <span class="net-security">{{ net.security }}</span>
                </div>
              </div>

              <div class="net-actions">
                <span v-if="net.ssid === currentSSID" class="connected-label">Activa</span>
                <button
                  v-else
                  class="connect-btn"
                  @click="connectToNetwork(net.ssid)"
                  :disabled="isConnecting"
                >
                  {{ isConnecting && targetSSID === net.ssid ? 'Conectando...' : 'Conectar' }}
                </button>
              </div>
            </div>
          </div>
        </SettingCard>
      </div>

      <!-- Mensaje de adaptador apagado si está DESACTIVADO -->
      <div v-else class="network-inactive-card">
        <WifiOffIcon class="empty-icon" />
        <h3 class="empty-title">Adaptador de Red Desconectado</h3>
        <p class="empty-desc">
          Enciende el adaptador virtual en la parte superior para buscar y conectarte a redes inalámbricas en tu entorno.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Signal as SignalIcon,
  Check as CheckIcon
} from 'lucide-vue-next';
import SettingCard from '@/components/ui/SettingCard.vue';
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue';
import { useConfigStore } from '@/stores/configStore';

const configStore = useConfigStore();

// Estados del adaptador
const isAdapterOn = ref(true);
const isConnecting = ref(false);
const targetSSID = ref('');

// Computed SSID vinculado bidireccionalmente con configStore
const currentSSID = computed({
  get() {
    return configStore.networkSSID;
  },
  set(val) {
    configStore.networkSSID = val;
  }
});

// Redes inalámbricas simuladas
const availableNetworks = ref([
  { ssid: 'VueOS-5G', security: 'WPA3 Personal' },
  { ssid: 'VueOS-Guests', security: 'WPA2/WPA3 Enterprise' },
  { ssid: 'Vecino_Wifi', security: 'WPA2 Personal' },
  { ssid: 'Public_Net', security: 'Abierta (Sin seguridad)' }
]);

function connectToNetwork(ssid: string) {
  if (isConnecting.value) return;

  isConnecting.value = true;
  targetSSID.value = ssid;

  setTimeout(() => {
    currentSSID.value = ssid;
    isConnecting.value = false;
    targetSSID.value = '';
  }, 1500);
}
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

.transition-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.networks-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-on-text {
  color: var(--accent);
  font-weight: bold;
}

.status-off-text {
  color: var(--text-secondary);
  font-weight: bold;
}

/* Red Activa Card Styles */
.active-connection-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.connection-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.check-icon {
  width: 20px;
  height: 20px;
  color: var(--accent);
}

.ssid-name {
  display: block;
  font-size: 1.05rem;
  font-weight: bold;
  color: var(--text-primary);
}

.connection-strength {
  display: block;
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.connection-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--accent);
  background: var(--bg-hover);
  border: 1px solid var(--border-hover);
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.connection-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-color);
  padding-top: 12px;
  margin-top: 8px;
}

/* Listado de Redes */
.networks-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 6px 0;
}

.network-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px 16px;
  transition: all 0.2s ease;
}

.network-item:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.connected-item {
  border-color: var(--accent);
  background: var(--bg-hover);
}

.net-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.signal-icon {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
}

.connected-item .signal-icon {
  color: var(--accent);
}

.net-ssid {
  display: block;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
}

.net-security {
  display: block;
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.net-actions {
  display: flex;
  align-items: center;
}

.connected-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--accent);
}

.connect-btn {
  padding: 6px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.connect-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--accent);
  color: var(--accent);
}

.connect-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Tarjeta Inactiva */
.network-inactive-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  text-align: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.empty-icon {
  width: 40px;
  height: 40px;
  color: var(--text-secondary);
  opacity: 0.4;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.empty-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  max-width: 300px;
  line-height: 1.4;
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
</style>
