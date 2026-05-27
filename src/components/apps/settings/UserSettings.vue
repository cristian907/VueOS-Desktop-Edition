<template>
  <div class="user-settings-section">
    <!-- TARJETA 1: INFORMACIÓN PÚBLICA -->
    <SettingCard title="Información Pública" :icon="UserIcon">
      <div class="profile-layout">
        <!-- Panel Izquierdo: Avatar y Modificación -->
        <div class="avatar-column">
          <div class="profile-avatar-wrapper">
            <img :src="draftAvatar" alt="Avatar de Usuario" class="profile-avatar-img" />
            <div class="avatar-shadow-overlay"></div>
          </div>
          <button type="button" class="action-btn" @click="changeAvatarPrompt">
            <CameraIcon class="btn-icon" />
            Cambiar Foto
          </button>
        </div>

        <!-- Panel Derecho: Campos de Texto -->
        <div class="fields-column">
          <div class="input-group">
            <label for="username-input" class="input-label">Nombre de Usuario</label>
            <input
              id="username-input"
              v-model="draftName"
              type="text"
              class="styled-input"
              placeholder="Ej. hacker_gamer"
              spellcheck="false"
            />
          </div>

          <div class="input-group">
            <label for="email-input" class="input-label">Correo Electrónico</label>
            <input
              id="email-input"
              v-model="draftEmail"
              type="email"
              class="styled-input"
              placeholder="Ej. usuario@correo.com"
              spellcheck="false"
            />
          </div>

          <div class="action-row">
            <button type="button" class="save-btn" @click="saveProfile">
              <CheckIcon class="btn-icon" />
              Guardar Cambios
            </button>
            <Transition name="fade">
              <span v-if="profileSuccess" class="success-text">¡Perfil actualizado correctamente!</span>
            </Transition>
          </div>
        </div>
      </div>
    </SettingCard>

    <!-- TARJETA 2: SEGURIDAD Y AUTENTICACIÓN -->
    <SettingCard title="Cambiar Contraseña" :icon="ShieldAlertIcon">
      <div class="security-layout">
        <div class="input-group">
          <label for="current-password-input" class="input-label">Contraseña Actual</label>
          <input
            id="current-password-input"
            v-model="currentPassword"
            type="password"
            class="styled-input"
            placeholder="••••••••"
            autocomplete="current-password"
          />
        </div>

        <div class="input-group">
          <label for="new-password-input" class="input-label">Nueva Contraseña</label>
          <input
            id="new-password-input"
            v-model="newPassword"
            type="password"
            class="styled-input"
            placeholder="••••••••"
            autocomplete="new-password"
          />
        </div>

        <div class="input-group">
          <label for="confirm-password-input" class="input-label">Confirmar Nueva Contraseña</label>
          <input
            id="confirm-password-input"
            v-model="confirmPassword"
            type="password"
            class="styled-input"
            placeholder="••••••••"
            autocomplete="new-password"
          />
        </div>

        <div class="action-row-col">
          <button type="button" class="save-btn security-btn" @click="changePassword">
            <KeyIcon class="btn-icon" />
            Actualizar Contraseña
          </button>
          
          <Transition name="fade">
            <p v-if="securityError" class="error-text">{{ securityError }}</p>
            <p v-else-if="securitySuccess" class="success-text">{{ securitySuccess }}</p>
          </Transition>
        </div>
      </div>
    </SettingCard>

    <!-- MODAL SELECCIONADOR DE IMÁGENES / AVATAR -->
    <Transition name="fade">
      <div v-if="showAvatarSelector" class="modal-overlay" @click.self="showAvatarSelector = false">
        <div class="modal-content">
          <header class="modal-header">
            <h3 class="modal-title">Seleccionar Avatar</h3>
            <button type="button" class="close-btn" @click="showAvatarSelector = false">×</button>
          </header>
          
          <div class="modal-body">
            <p class="modal-sub">Elige una imagen de la galería de imágenes descargadas y del sistema o ingresa una URL externa.</p>
            
            <!-- Grid de imágenes del sistema -->
            <div class="avatar-grid">
              <button
                v-for="img in systemImages"
                :key="img.name"
                type="button"
                class="avatar-option"
                :class="{ 'avatar-option-active': draftAvatar === img.dataUrl }"
                @click="selectAvatar(img.dataUrl || '')"
                :title="img.name"
              >
                <img :src="img.dataUrl" class="option-thumb" />
                <span class="option-name">{{ img.name }}</span>
              </button>
            </div>

            <!-- Divisor -->
            <div class="modal-divider"></div>

            <!-- Entrada de URL externa -->
            <div class="url-input-area">
              <label for="modal-url-input" class="input-label">URL de Imagen Externa</label>
              <div class="input-row">
                <input
                  id="modal-url-input"
                  v-model="customUrl"
                  type="text"
                  placeholder="https://ejemplo.com/mi-avatar.jpg"
                  class="styled-input"
                  spellcheck="false"
                />
                <button type="button" class="apply-url-btn" @click="applyCustomUrl">
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useOSStore } from '@/stores/osStore';
import SettingCard from '@/components/ui/SettingCard.vue';
import {
  User as UserIcon,
  Camera as CameraIcon,
  Check as CheckIcon,
  ShieldAlert as ShieldAlertIcon,
  Key as KeyIcon
} from 'lucide-vue-next';

const userStore = useUserStore();
const osStore = useOSStore();

// ---- Estados Locales para Información Pública ----
const draftName = ref(userStore.username);
const draftEmail = ref(userStore.email);
const draftAvatar = ref(userStore.avatarUrl);
const profileSuccess = ref(false);

// ---- Estados Locales para Cambio de Contraseña ----
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const securityError = ref('');
const securitySuccess = ref('');

// ---- Modal de Selección de Avatar ----
const showAvatarSelector = ref(false);
const customUrl = ref('');

// Obtiene reactivamente las imágenes de la carpeta virtual de imágenes
const systemImages = computed(() => {
  return (osStore.fileSystem['Imágenes'] || []).filter(
    (file) => file.type === 'file' && file.dataUrl
  );
});

// Despliega el modal interactivo
function changeAvatarPrompt() {
  customUrl.value = '';
  showAvatarSelector.value = true;
}

// Selecciona un avatar del listado
function selectAvatar(url: string) {
  if (url) {
    draftAvatar.value = url;
    showAvatarSelector.value = false;
  }
}

// Aplica una URL externa escrita en el input
function applyCustomUrl() {
  const url = customUrl.value.trim();
  if (url) {
    draftAvatar.value = url;
    showAvatarSelector.value = false;
  }
}

// Guardar cambios del perfil
function saveProfile() {
  if (!draftName.value.trim()) {
    alert('El nombre de usuario no puede estar vacío.');
    return;
  }
  userStore.updateProfile(draftName.value, draftEmail.value, draftAvatar.value);
  profileSuccess.value = true;
  setTimeout(() => {
    profileSuccess.value = false;
  }, 3000);
}

// Cambiar contraseña de forma segura con validaciones
function changePassword() {
  securityError.value = '';
  securitySuccess.value = '';

  const current = currentPassword.value;
  const next = newPassword.value;
  const confirm = confirmPassword.value;

  // Validaciones locales
  if (!current || !next || !confirm) {
    securityError.value = 'Por favor, completa todos los campos de contraseña.';
    return;
  }

  if (next !== confirm) {
    securityError.value = 'La nueva contraseña y su confirmación no coinciden.';
    return;
  }

  if (next.length < 4) {
    securityError.value = 'La nueva contraseña debe tener al menos 4 caracteres.';
    return;
  }

  // Llamar al store para validar contraseña actual y aplicar cambios
  const result = userStore.updatePassword(current, next);
  if (result) {
    securitySuccess.value = '¡Contraseña actualizada con éxito!';
    // Limpiar campos
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } else {
    securityError.value = 'La contraseña actual es incorrecta.';
  }
}
</script>

<style scoped>
.user-settings-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.35s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Layout de Perfil */
.profile-layout {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

@media (max-width: 600px) {
  .profile-layout {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
}

.avatar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.profile-avatar-wrapper {
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.profile-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-shadow-overlay {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
  pointer-events: none;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.action-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
  color: var(--accent);
}

.btn-icon {
  width: 14px;
  height: 14px;
}

/* Campos de entrada */
.fields-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.input-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.styled-input {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 10px 14px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.85rem;
  outline: none;
  transition: all 0.2s ease;
}

.styled-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(61, 174, 233, 0.25);
}

/* Botones de Guardar */
.action-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px 18px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.save-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
  color: var(--accent);
}

.success-text {
  font-size: 0.8rem;
  font-weight: bold;
  color: #2ecc71;
}

.error-text {
  font-size: 0.8rem;
  font-weight: bold;
  color: #ff4444;
}

/* Layout de seguridad */
.security-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-row-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
  margin-top: 8px;
}

.security-btn:hover {
  border-color: #ff4444;
  color: #ff4444;
}

/* ── MODAL SELECCIONADOR DE IMÁGENES / AVATAR ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
}

.modal-content {
  width: 480px;
  max-width: 90%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: scaleUp 0.2s ease-out;
}

@keyframes scaleUp {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 0.95rem;
  font-weight: bold;
  color: var(--text-primary);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.3rem;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1;
  transition: color var(--transition-fast) ease;
}

.close-btn:hover {
  color: #ff4444;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-sub {
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
}

.avatar-option {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  outline: none;
}

.avatar-option:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.avatar-option-active {
  border-color: var(--accent) !important;
  background: var(--bg-active);
}

.option-thumb {
  width: 100%;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.option-name {
  font-size: 0.62rem;
  color: var(--text-secondary);
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  font-family: monospace;
}

.avatar-option-active .option-name {
  color: var(--accent);
  font-weight: bold;
}

.modal-divider {
  height: 1px;
  background: var(--border-color);
}

.url-input-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-row {
  display: flex;
  gap: 10px;
}

.apply-url-btn {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0 16px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  white-space: nowrap;
}

.apply-url-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
  color: var(--accent);
}

/* Transiciones */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
