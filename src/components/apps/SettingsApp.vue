<template>
  <div class="settings-app-container">
    <!-- SIDEBAR DE NAVEGACIÓN (IZQUIERDA) -->
    <aside class="settings-sidebar">
      <!-- Perfil de Usuario Dinámico -->
      <div class="user-profile-card">
        <div class="avatar-glow">
          <img
            :src="userStore.avatarUrl"
            :alt="`Avatar de ${userStore.username}`"
            class="user-avatar"
          />
        </div>
        <div class="user-info">
          <span class="username">{{ userStore.username }}</span>
          <span class="user-role">Administrador del Sistema</span>
        </div>
      </div>

      <!-- Buscador Integrado Semi-Transparente -->
      <div class="search-box">
        <SearchIcon class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar ajustes..."
          class="search-input"
          spellcheck="false"
        />
      </div>

      <!-- Menú de Navegación por Categorías -->
      <nav class="categories-nav">
        <span class="menu-label">Sistema</span>
        <button
          type="button"
          class="nav-item"
          :class="{ 'nav-item-active': configStore.settingsActiveTab === 'account' }"
          @click="configStore.settingsActiveTab = 'account'"
        >
          <UserIcon class="nav-icon" />
          <span>Cuenta de Usuario</span>
        </button>

        <button
          type="button"
          class="nav-item"
          :class="{ 'nav-item-active': configStore.settingsActiveTab === 'about' }"
          @click="configStore.settingsActiveTab = 'about'"
        >
          <InfoIcon class="nav-icon" />
          <span>Información del Sistema</span>
        </button>

        <span class="menu-label">Personalización</span>
        <button
          type="button"
          class="nav-item"
          :class="{ 'nav-item-active': configStore.settingsActiveTab === 'wallpaper' }"
          @click="configStore.settingsActiveTab = 'wallpaper'"
        >
          <ImageIcon class="nav-icon" />
          <span>Fondo de pantalla</span>
        </button>

        <button
          type="button"
          class="nav-item"
          :class="{ 'nav-item-active': configStore.settingsActiveTab === 'theme' }"
          @click="configStore.settingsActiveTab = 'theme'"
        >
          <PaletteIcon class="nav-icon" />
          <span>Personalización</span>
        </button>

        <span class="menu-label">Dispositivo</span>
        <button
          type="button"
          class="nav-item"
          :class="{ 'nav-item-active': configStore.settingsActiveTab === 'sounds' }"
          @click="configStore.settingsActiveTab = 'sounds'"
        >
          <Volume2Icon class="nav-icon" />
          <span>Sonidos</span>
        </button>

        <button
          type="button"
          class="nav-item"
          :class="{ 'nav-item-active': configStore.settingsActiveTab === 'network' }"
          @click="configStore.settingsActiveTab = 'network'"
        >
          <WifiIcon class="nav-icon" />
          <span>Red Inalámbrica</span>
        </button>

        <button
          type="button"
          class="nav-item"
          :class="{ 'nav-item-active': configStore.settingsActiveTab === 'battery' }"
          @click="configStore.settingsActiveTab = 'battery'"
        >
          <BatteryIcon class="nav-icon" />
          <span>Batería y Brillo</span>
        </button>
      </nav>
    </aside>

    <!-- ÁREA DE CONTENIDO DINÁMICO (DERECHA) -->
    <main class="settings-main-content">
      <!-- PESTAÑA: CUENTA DE USUARIO -->
      <div v-if="configStore.settingsActiveTab === 'account'">
        <h2 class="content-title">Cuenta de Usuario</h2>
        <p class="content-sub">Administra tu perfil, avatar e información de seguridad del sistema.</p>
        <UserSettings />
      </div>

      <!-- PESTAÑA: INFORMACIÓN DEL SISTEMA -->
      <div v-else-if="configStore.settingsActiveTab === 'about'">
        <h2 class="content-title">Información del Sistema</h2>
        <p class="content-sub">Detalles acerca de la distribución Vue OS y especificaciones técnicas de la sesión.</p>
        <AboutSettings />
      </div>

      <!-- PESTAÑA: FONDO DE PANTALLA -->
      <div v-else-if="configStore.settingsActiveTab === 'wallpaper'">
        <h2 class="content-title">Personalizar Fondo</h2>
        <p class="content-sub">Elige un fondo de pantalla gamer y gestiona la apariencia del escritorio central.</p>
        <WallpaperSettings />
      </div>

      <!-- PESTAÑA COMPLETA: PERSONALIZACIÓN -->
      <div v-else-if="configStore.settingsActiveTab === 'theme'">
        <h2 class="content-title">Personalización</h2>
        <p class="content-sub">Elige el esquema de colores, efectos visuales y paneles del entorno del sistema.</p>
        <ThemeSettings />
      </div>

      <!-- PESTAÑA: SONIDOS -->
      <div v-else-if="configStore.settingsActiveTab === 'sounds'">
        <h2 class="content-title">Sonido del Sistema</h2>
        <p class="content-sub">Ajusta el volumen de reproducción y administra la salida de audio de la sesión.</p>
        <AudioSettings />
      </div>

      <!-- PESTAÑA: RED INALÁMBRICA -->
      <div v-else-if="configStore.settingsActiveTab === 'network'">
        <h2 class="content-title">Red Inalámbrica</h2>
        <p class="content-sub">Gestiona la interfaz de Wi-Fi virtual y conéctate a redes inalámbricas.</p>
        <NetworkSettings />
      </div>

      <!-- PESTAÑA: BATERÍA Y BRILLO -->
      <div v-else-if="configStore.settingsActiveTab === 'battery'">
        <h2 class="content-title">Batería y Brillo</h2>
        <p class="content-sub">Administra el brillo de la pantalla, ahorro de energía virtual y supervisa el consumo.</p>
        <BatterySettings />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  Search as SearchIcon,
  User as UserIcon,
  Image as ImageIcon,
  Palette as PaletteIcon,
  Volume2 as Volume2Icon,
  Wifi as WifiIcon,
  Battery as BatteryIcon,
  Info as InfoIcon
} from 'lucide-vue-next';
import { useUserStore } from '@/stores/userStore';
import { useConfigStore } from '@/stores/configStore';
import WallpaperSettings from '@/components/apps/settings/WallpaperSettings.vue';
import ThemeSettings from '@/components/apps/settings/ThemeSettings.vue';
import UserSettings from '@/components/apps/settings/UserSettings.vue';
import AudioSettings from '@/components/apps/settings/AudioSettings.vue';
import NetworkSettings from '@/components/apps/settings/NetworkSettings.vue';
import BatterySettings from '@/components/apps/settings/BatterySettings.vue';
import AboutSettings from '@/components/apps/settings/AboutSettings.vue';

const userStore = useUserStore();
const configStore = useConfigStore();

const searchQuery = ref('');
</script>

<style scoped>
.settings-app-container {
  display: flex;
  width: 100%;
  height: 100%;
  color: var(--text-primary);
  background-color: var(--bg-primary);
  font-family: var(--font-family-base);
  overflow: hidden;
  user-select: none;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* SIDEBAR DE NAVEGACIÓN */
.settings-sidebar {
  width: 260px;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  gap: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 100%;
  flex-shrink: 0;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

/* Scrollbar ultra sutil */
.settings-sidebar::-webkit-scrollbar {
  width: 4px;
}

.settings-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.settings-sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}

.settings-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}

/* Tarjeta de Perfil de Usuario */
.user-profile-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
  padding: 10px 12px;
  border-radius: 8px;
  flex-shrink: 0;
}

.avatar-glow {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  padding: 1px;
  background: var(--border-color);
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: var(--bg-primary);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 0.88rem;
  font-weight: bold;
  color: var(--text-primary);
}

.user-role {
  font-size: 0.68rem;
  color: var(--text-secondary);
}

/* Buscador */
.search-box {
  position: relative;
  width: 100%;
  flex-shrink: 0;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: var(--text-secondary);
}

.search-input {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px 12px 6px 32px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.8rem;
  outline: none;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(61, 174, 233, 0.25);
}

/* Navegación */
.categories-nav {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex-shrink: 0;
}

.menu-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 12px;
  margin-bottom: 4px;
  padding-left: 10px;
  opacity: 0.6;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item-active {
  background: var(--bg-active) !important;
  color: var(--accent) !important;
  box-shadow: inset 3px 0 0 0 var(--accent);
}

.nav-icon {
  width: 15px;
  height: 15px;
}

/* CONTENIDO PRINCIPAL (DERECHA) */
.settings-main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  background-color: var(--bg-primary);
  transition: background-color 0.3s ease;
}

.content-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #eff0f1;
  margin-bottom: 4px;
}

.content-sub {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

/* Fallback de pestañas */
.fallback-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60%;
  text-align: center;
  padding: 40px;
  animation: fadeIn 0.3s ease-out;
}

.fallback-icon {
  width: 48px;
  height: 48px;
  color: rgba(61, 174, 233, 0.15);
  margin-bottom: 14px;
}

.fallback-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 6px;
}

.fallback-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  max-width: 340px;
  line-height: 1.4;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
