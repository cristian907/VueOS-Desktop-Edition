<template>
  <div class="lock-screen">
    <!-- Reloj grande centrado arriba (estilo SDDM Breeze) -->
    <div class="lock-clock">
      <span class="lock-time">{{ currentTime }}</span>
      <span class="lock-date">{{ currentDate }}</span>
    </div>

    <!-- Panel de autenticación centrado -->
    <div class="auth-panel">
      <!-- Avatar de usuario -->
      <div class="avatar-wrapper">
        <img v-if="userStore.avatarUrl" :src="userStore.avatarUrl" class="avatar-img" alt="Avatar de Usuario" />
        <UserIcon v-else class="avatar-icon" />
      </div>

      <h2 class="username">{{ userStore.username }}</h2>

      <!-- Campo de contraseña -->
      <div class="input-wrapper" :class="{ 'input-error': hasError }">
        <LockIcon class="input-icon" />
        <input
          id="lock-password-input"
          ref="inputRef"
          v-model="password"
          type="password"
          class="password-input"
          placeholder="Contraseña"
          autocomplete="current-password"
          @keydown.enter="handleUnlock"
        />
      </div>

      <!-- Mensaje de error -->
      <Transition name="fade">
        <p v-if="hasError" class="error-msg">Contraseña incorrecta. Intenta de nuevo.</p>
      </Transition>

      <!-- Botón de desbloqueo -->
      <button id="lock-unlock-btn" class="unlock-btn" @click="handleUnlock">
        <UnlockIcon class="btn-icon" />
        Desbloquear
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { User as UserIcon, Lock as LockIcon, Unlock as UnlockIcon } from 'lucide-vue-next';
import { useOSStore } from '@/stores/osStore';
import { useUserStore } from '@/stores/userStore';

const osStore = useOSStore();
const userStore = useUserStore();
const inputRef = ref<HTMLInputElement | null>(null);
const password = ref('');
const hasError = ref(false);

// ---- Reloj del sistema ----
const currentTime = ref('');
const currentDate = ref('');
let clockInterval: ReturnType<typeof setInterval>;

function updateClock() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  currentDate.value = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

onMounted(() => {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
  inputRef.value?.focus();
});

onUnmounted(() => clearInterval(clockInterval));

// ---- Lógica de autenticación reactiva ----
function handleUnlock() {
  if (password.value === userStore.password) {
    osStore.unlock();
    return;
  }

  hasError.value = true;
  password.value = '';
  inputRef.value?.focus();

  setTimeout(() => {
    hasError.value = false;
  }, 600);
}
</script>

<style scoped>
.lock-screen {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 999999;
}

/* Sutil gradiente radial de ambiente */
.lock-screen::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 40%, rgba(61, 174, 233, 0.04) 0%, transparent 70%);
  pointer-events: none;
}

/* ── Reloj grande centrado arriba ── */
.lock-clock {
  position: absolute;
  top: 10vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  pointer-events: none;
}

.lock-time {
  font-size: 5rem;
  font-weight: 300;
  color: var(--text-primary);
  letter-spacing: 4px;
  line-height: 1;
}

.lock-date {
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-secondary);
  text-transform: capitalize;
  letter-spacing: 0.5px;
}

/* ── Panel central de autenticación ── */
.auth-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 48px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-popup);
  min-width: 360px;
  z-index: 1;
}

/* Avatar */
.avatar-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  background: var(--bg-primary);
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-icon {
  width: 40px;
  height: 40px;
  color: var(--accent);
}

.username {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.5px;
  margin: 0;
}

/* Input de contraseña */
.input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input-wrapper:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(61, 174, 233, 0.2);
}

/* Estado de error con animación shake */
.input-error {
  border-color: var(--danger) !important;
  box-shadow: 0 0 0 2px rgba(237, 21, 21, 0.15) !important;
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

@keyframes shake {
  10%, 90%  { transform: translateX(-2px); }
  20%, 80%  { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-6px); }
  40%, 60%  { transform: translateX(6px); }
}

.input-icon {
  width: 16px;
  height: 16px;
  color: var(--text-disabled);
  flex-shrink: 0;
}

.password-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: var(--font-family-base);
  letter-spacing: 3px;
}

.password-input::placeholder {
  color: var(--text-disabled);
  letter-spacing: 1px;
}

/* Mensaje de error */
.error-msg {
  font-size: 0.8rem;
  color: var(--danger);
  margin: -4px 0 0;
}

/* Botón de desbloqueo */
.unlock-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 24px;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-md);
  color: #ffffff;
  font-family: var(--font-family-base);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: background var(--transition-fast);
  width: 100%;
}

.unlock-btn:hover {
  background: var(--accent-hover);
}

.unlock-btn:active {
  background: var(--accent-active);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* Transición fade para el mensaje de error */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
