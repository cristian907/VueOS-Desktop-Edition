<template>
  <div class="recorder-app">
    <!-- ÁREA CENTRAL DE GRABACIÓN -->
    <div class="record-area">
      <!-- Botón de Micrófono Circular -->
      <button
        type="button"
        class="mic-btn"
        :class="{ 'mic-recording': isRecording }"
        @click="toggleRecording"
        :title="isRecording ? 'Detener grabación' : 'Iniciar grabación'"
      >
        <MicIcon class="mic-icon" />
        <div class="mic-glow-ring"></div>
      </button>

      <!-- Contador de Tiempo Transcurrido -->
      <div class="timer-display">{{ formattedTime }}</div>
      <p class="status-msg">
        {{ isRecording ? 'Grabando audio en vivo...' : 'Presiona para grabar audio' }}
      </p>
    </div>

    <!-- LISTADO DE GRABACIONES -->
    <div class="recordings-panel">
      <header class="panel-header">
        <span class="panel-title">Lista de Grabaciones</span>
        <span class="panel-count">{{ recordings.length }} notas</span>
      </header>

      <div class="recordings-list">
        <div v-if="recordings.length === 0" class="empty-list">
          No hay grabaciones de voz guardadas en esta sesión.
        </div>
        <div
          v-for="(rec, index) in recordings"
          :key="rec.id"
          class="recording-card"
        >
          <div class="card-meta">
            <span class="card-title">{{ rec.name }}</span>
            <span class="card-date">{{ rec.duration }}</span>
          </div>

          <!-- Reproductor de Audio Nativo -->
          <audio controls :src="rec.url" class="audio-player"></audio>

          <button
            type="button"
            class="delete-btn"
            @click="deleteRecording(index)"
            title="Eliminar grabación"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { Mic as MicIcon } from 'lucide-vue-next';

interface Recording {
  id: string;
  name: string;
  url: string;
  duration: string;
}

// ---- Estados Reactivos ----
const isRecording = ref(false);
const recordingTime = ref(0);
const recordings = ref<Recording[]>([]);

let mediaRecorder: MediaRecorder | null = null;
let audioStream: MediaStream | null = null;
let audioChunks: Blob[] = [];
let timerInterval: ReturnType<typeof setInterval> | null = null;

// Formatear el contador de segundos (ej: "00:00")
const formattedTime = computed(() => {
  const mins = Math.floor(recordingTime.value / 60);
  const secs = recordingTime.value % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(mins)}:${pad(secs)}`;
});

// ---- Lógica de Grabación ----
async function toggleRecording() {
  if (isRecording.value) {
    stopRecording();
  } else {
    await startRecording();
  }
}

async function startRecording() {
  audioChunks = [];
  try {
    // 1. Solicitar permisos de micrófono al usuario
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioStream = stream;

    // 2. Instanciar el MediaRecorder nativo
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      // 3. Crear el Blob de audio y generar su URL local
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const durationStr = formattedTime.value;
      const index = recordings.value.length + 1;
      
      recordings.value.push({
        id: crypto.randomUUID(),
        name: `Grabación de Voz #${index}`,
        url: audioUrl,
        duration: durationStr
      });
      
      recordingTime.value = 0;
    };

    // Iniciar grabación física
    mediaRecorder.start();
    isRecording.value = true;

    // Inicializar cronómetro de segundos transcurridos
    recordingTime.value = 0;
    timerInterval = setInterval(() => {
      recordingTime.value++;
    }, 1000);

  } catch (err) {
    console.error('Error al acceder al micrófono:', err);
    alert('No se pudo acceder al micrófono. Por favor, otorga los permisos necesarios.');
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
  }
  
  isRecording.value = false;
  
  // Limpiar timers
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Detener todos los tracks del micrófono físico para apagar el indicador de grabación del OS
  if (audioStream) {
    audioStream.getTracks().forEach((track) => track.stop());
    audioStream = null;
  }
}

function deleteRecording(index: number) {
  const url = recordings.value[index]?.url;
  if (url) {
    URL.revokeObjectURL(url); // Liberar memoria del navegador
  }
  recordings.value.splice(index, 1);
}

// ---- Ciclo de Vida: Limpieza Estricta al Cerrar la Ventana ----
onUnmounted(() => {
  stopRecording();
  // Revocar todos los blobs para no dejar fugas de memoria
  recordings.value.forEach((rec) => {
    URL.revokeObjectURL(rec.url);
  });
});
</script>

<style scoped>
.recorder-app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-family-base);
  overflow: hidden;
  user-select: none;
  /* Configuración de gris universal adaptativo y filtros de escala de grises legibles */
  --audio-bg: #27272a;
  --audio-filter: invert(0.9);
}

:global(.light-theme) .recorder-app {
  --audio-bg: #e4e4e7;
  --audio-filter: opacity(0.8);
}

/* Área de Grabación */
.record-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  gap: 16px;
  background: var(--bg-secondary);
  border-bottom: var(--glass-border);
}

.mic-btn {
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: var(--bg-primary);
  border: 2px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.mic-icon {
  width: 36px;
  height: 36px;
  z-index: 2;
  transition: transform 0.25s ease;
}

.mic-btn:hover {
  border-color: var(--neon-cyan);
  color: var(--neon-cyan);
}

.mic-btn:hover .mic-icon {
  transform: scale(1.1);
}

/* Animación de Pulso Neón Magenta al grabar */
.mic-recording {
  background-color: var(--bg-primary) !important;
  border-color: var(--neon-magenta) !important;
  color: var(--neon-magenta) !important;
  animation: pulse-ring 1.5s infinite;
}

@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 0, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(255, 0, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 0, 255, 0);
  }
}

.timer-display {
  font-family: 'Courier New', Courier, monospace;
  font-size: 2rem;
  font-weight: bold;
  letter-spacing: 1px;
}

.status-msg {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Panel de grabaciones guardadas */
.recordings-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: var(--glass-border);
}

.panel-title {
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--text-primary);
  text-transform: uppercase;
}

.panel-count {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.recordings-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.empty-list {
  font-size: 0.78rem;
  color: var(--text-secondary);
  text-align: center;
  padding: 32px 0;
  line-height: 1.4;
}

.recording-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  padding: 10px 14px;
  gap: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.recording-card:hover {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 10px rgba(0, 243, 255, 0.2);
  transform: translateY(-1px);
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 100px;
}

.card-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-date {
  font-size: 0.65rem;
  color: var(--text-secondary);
}

/* Reproductor de Audio Estilizado */
.audio-player {
  flex: 1;
  height: 32px;
  border-radius: 8px;
  outline: none;
  background: var(--audio-bg);
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;
}

.audio-player:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

:global(.light-theme) .audio-player:hover {
  border-color: rgba(0, 0, 0, 0.15);
}

/* Sobreescribir reproductor nativo del navegador */
.audio-player::-webkit-media-controls-panel {
  background-color: var(--audio-bg);
  border-radius: 8px;
}

/* Estilización Webkit de los controles e iconos internos de audio */
.audio-player::-webkit-media-controls-play-button,
.audio-player::-webkit-media-controls-mute-button,
.audio-player::-webkit-media-controls-timeline,
.audio-player::-webkit-media-controls-current-time-display,
.audio-player::-webkit-media-controls-time-remaining-display,
.audio-player::-webkit-media-controls-volume-slider {
  filter: var(--audio-filter);
  transition: filter 0.2s ease;
}

.delete-btn {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1;
  padding: 0 2px;
  transition: color 0.2s;
}

.delete-btn:hover {
  color: #f43f5e;
}
</style>
