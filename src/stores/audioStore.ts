import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { VolumeX, Volume1, Volume2 } from 'lucide-vue-next';

export const useAudioStore = defineStore('audio', () => {
  // ---- Recuperación del Estado del Almacenamiento Local ----
  const savedVolume = localStorage.getItem('vueui-audio-volume');
  const savedMute = localStorage.getItem('vueui-audio-muted');

  // ---- Estados Reactivos ----
  const volume = ref<number>(savedVolume ? parseInt(savedVolume, 10) : 50);
  const isMuted = ref<boolean>(savedMute === 'true');

  // ---- Getters Computados ----
  // Retorna el componente de icono dinámico adecuado de lucide para simplificar su renderizado
  const iconType = computed(() => {
    if (isMuted.value || volume.value === 0) {
      return VolumeX;
    }
    if (volume.value < 50) {
      return Volume1;
    }
    return Volume2;
  });

  // ---- Acciones del Audio ----
  /**
   * Modifica el volumen global del sistema y sincroniza con Electron IPC
   * @param val Nivel del volumen (0 a 100)
   */
  function setVolume(val: number) {
    // Asegurar los límites de volumen
    volume.value = Math.max(0, Math.min(100, val));
    
    // Si se establece en 0, se silencia físicamente
    if (volume.value === 0) {
      isMuted.value = true;
    } else if (isMuted.value) {
      // Si el volumen aumenta y estaba silenciado, reactivar el sonido
      isMuted.value = false;
    }

    // Comunicar volumen normalizado (0.0 a 1.0) a Electron
    if (window.osAPI && typeof window.osAPI.setVolume === 'function') {
      window.osAPI.setVolume(volume.value / 100);
    }
  }

  /**
   * Alterna el estado de silencio (Mute) y comunica a Electron IPC
   */
  function toggleMute() {
    isMuted.value = !isMuted.value;
    
    if (window.osAPI && typeof window.osAPI.toggleMute === 'function') {
      window.osAPI.toggleMute(isMuted.value);
    }
  }

  // ---- Sincronización Persistente con LocalStorage ----
  watch(volume, (newVol) => {
    localStorage.setItem('vueui-audio-volume', String(newVol));
  });

  watch(isMuted, (newMute) => {
    localStorage.setItem('vueui-audio-muted', String(newMute));
  });

  // Sincronizar estado inicial al arrancar el OS con Electron
  if (window.osAPI) {
    if (typeof window.osAPI.setVolume === 'function') {
      window.osAPI.setVolume(volume.value / 100);
    }
    if (typeof window.osAPI.toggleMute === 'function') {
      window.osAPI.toggleMute(isMuted.value);
    }
  }

  return {
    volume,
    isMuted,
    iconType,
    setVolume,
    toggleMute
  };
});
