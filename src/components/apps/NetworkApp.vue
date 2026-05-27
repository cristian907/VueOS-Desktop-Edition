<template>
  <div class="network-container">
    <!-- Panel superior: Adaptador de red y switch -->
    <header class="network-header">
      <div class="adapter-control">
        <div class="adapter-info">
          <WifiIcon v-if="isAdapterOn" class="header-icon icon-on" />
          <WifiOffIcon v-else class="header-icon icon-off" />
          <div>
            <h2 class="adapter-title">Adaptador Inalámbrico Virtual</h2>
            <span class="adapter-status">
              Estado: <span :class="isAdapterOn ? 'status-on-text' : 'status-off-text'">{{ isAdapterOn ? 'ENCENDIDO' : 'APAGADO' }}</span>
            </span>
          </div>
        </div>

        <!-- Switch Toggle Breeze -->
        <button
          class="breeze-switch"
          :class="{ 'switch-active': isAdapterOn }"
          @click="toggleAdapter"
          role="switch"
          :aria-checked="isAdapterOn"
          title="Alternar adaptador de red"
        >
          <div class="switch-handle"></div>
        </button>
      </div>
    </header>

    <!-- Panel de contenido principal -->
    <main class="network-main">
      <Transition name="fade-slide">
        <!-- Contenido cuando el adaptador está encendido -->
        <div v-if="isAdapterOn" class="network-active-view">
          <!-- Tarjeta de conexión activa -->
          <div class="connection-card">
            <h3 class="card-title">Red Inalámbrica Activa</h3>
            <div class="current-connection">
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
          </div>

          <!-- Listado de redes disponibles -->
          <div class="available-networks-section">
            <h3 class="section-title">Redes Wi-Fi Disponibles</h3>
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
          </div>
        </div>

        <!-- Contenido cuando el adaptador está apagado -->
        <div v-else class="network-inactive-view">
          <WifiOffIcon class="empty-icon" />
          <h3 class="empty-title">Adaptador de Red Desconectado</h3>
          <p class="empty-desc">
            Enciende el adaptador virtual en la barra superior para buscar y conectarte a redes inalámbricas en tu entorno.
          </p>
        </div>
      </Transition>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Signal as SignalIcon,
  Check as CheckIcon
} from 'lucide-vue-next';

// Adaptador virtual encendido/apagado
const isAdapterOn = ref(true);
const currentSSID = ref('Antor-5G');
const isConnecting = ref(false);
const targetSSID = ref('');

// Listado de redes disponibles simuladas
const availableNetworks = ref([
  { ssid: 'Antor-5G', security: 'WPA3 Personal' },
  { ssid: 'VueOS-Guests', security: 'WPA2/WPA3 Enterprise' },
  { ssid: 'Vecino_Wifi', security: 'WPA2 Personal' },
  { ssid: 'Public_Net', security: 'Abierta (Sin seguridad)' }
]);

function toggleAdapter() {
  isAdapterOn.value = !isAdapterOn.value;
  isConnecting.value = false;
  targetSSID.value = '';
}

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
.network-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: var(--font-family-base);
  overflow: hidden;
}

/* Header Adaptador de red */
.network-header {
  padding: 16px 20px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.adapter-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.adapter-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 32px;
  height: 32px;
  transition: all 0.3s ease;
}

.icon-on {
  color: var(--accent);
}

.icon-off {
  color: var(--text-disabled);
}

.adapter-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.adapter-status {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.status-on-text {
  color: var(--accent);
  font-weight: bold;
}

.status-off-text {
  color: var(--text-disabled);
  font-weight: bold;
}

/* Switch Toggle Breeze */
.breeze-switch {
  width: 44px;
  height: 24px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  outline: none;
}

.switch-handle {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: var(--text-secondary);
  border-radius: 50%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch-active {
  background: var(--accent);
  border-color: var(--accent);
}

.switch-active .switch-handle {
  left: 22px;
  background: var(--bg-primary);
}

/* Panel Principal */
.network-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  position: relative;
}

.network-active-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Tarjeta Conexión Activa */
.connection-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--shadow-subtle);
}

.card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.current-connection {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--text-primary);
}

.connection-strength {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.connection-pill {
  font-size: 0.75rem;
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
  font-size: 0.8rem;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-color);
  padding-top: 12px;
}

/* Sección Redes Disponibles */
.available-networks-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.networks-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.network-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px 18px;
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
  gap: 14px;
}

.signal-icon {
  width: 18px;
  height: 18px;
  color: var(--text-secondary);
}

.connected-item .signal-icon {
  color: var(--accent);
}

.net-ssid {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.net-security {
  display: block;
  font-size: 0.75rem;
  color: var(--text-disabled);
}

.net-actions {
  display: flex;
  align-items: center;
}

.connected-label {
  font-size: 0.8rem;
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
  font-size: 0.8rem;
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

/* Vista Inactiva (Adaptador apagado) */
.network-inactive-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: var(--text-disabled);
  margin-bottom: 16px;
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  max-width: 320px;
  line-height: 1.5;
}

/* Transición animada */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
