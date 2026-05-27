import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useUserStore = defineStore('user', () => {
  // ---- Estructura de Datos del Perfil de Usuario ----
  interface UserProfile {
    username: string;
    email: string;
    avatarUrl: string;
    password?: string;
  }

  // ---- Valores por Defecto ----
  const DEFAULT_PROFILE: UserProfile = {
    username: 'Admin',
    email: 'admin@vueos.org',
    avatarUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImJyZWV6ZUdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMyYTJlMzIiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMzZGFlZTkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgcng9IjY0IiBmaWxsPSJ1cmwoI2JyZWV6ZUdyYWQpIi8+PHBhdGggZD0iTTY0LDY4IEM0Ni4zMyw2OCAzMiw4Mi4zMyAzMiwxMDBMMTk2LDEwMCBDOTYsODIuMzMgODEuNjcsNjggNjQsNjggWiBNNjQsMjggQzUwLjc1LDI4IDQwLDM4Ljc1IDQwLDUyIEM0MCw2NS4yNSA1MC43NSw3NiA2NCw3NiBDNzcuMjUsNzYgODgsNjUuMjUgODgsNTIgQzg4LDM4Ljc1IDc3LjI1LDI4IDY0LDI4IFoiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4=',
    password: '123456'
  };

  // ---- Recuperar Estado del localStorage o usar valores por defecto ----
  const savedData = localStorage.getItem('vueui-user');
  let initialProfile = DEFAULT_PROFILE;

  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      if (parsed.username === 'antorlok') {
        initialProfile = DEFAULT_PROFILE;
      } else {
        initialProfile = { ...DEFAULT_PROFILE, ...parsed };
      }
    } catch (e) {
      console.error('Error al parsear el perfil de usuario guardado:', e);
    }
  }

  // ---- Estados Reactivos ----
  const username = ref(initialProfile.username);
  const email = ref(initialProfile.email);
  const avatarUrl = ref(initialProfile.avatarUrl);
  const password = ref(initialProfile.password || '123456');

  // ---- Persistencia Automática Reactiva ----
  watch(
    [username, email, avatarUrl, password],
    () => {
      const dataToSave = {
        username: username.value,
        email: email.value,
        avatarUrl: avatarUrl.value,
        password: password.value
      };
      localStorage.setItem('vueui-user', JSON.stringify(dataToSave));
    },
    { deep: true }
  );

  // ---- Acciones ----
  /**
   * Actualiza la información pública del perfil.
   */
  function updateProfile(newName: string, newEmail: string, newAvatar: string) {
    username.value = newName.trim();
    email.value = newEmail.trim();
    avatarUrl.value = newAvatar.trim();
  }

  /**
   * Actualiza de forma segura la contraseña tras verificar la contraseña actual.
   * Retorna true en caso de éxito, false de lo contrario.
   */
  function updatePassword(currentPass: string, newPass: string): boolean {
    if (currentPass === password.value) {
      password.value = newPass;
      return true;
    }
    return false;
  }

  return {
    username,
    email,
    avatarUrl,
    password,
    updateProfile,
    updatePassword
  };
});
