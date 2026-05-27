<template>
  <div class="app-placeholder camera-app">
    <!-- Header de la Aplicación -->
    <div class="app-header">
      <CameraIcon class="app-header-icon" />
      <div>
        <h2 class="app-title">Cámara</h2>
        <span class="app-subtitle">Cámara y grabadora de video del sistema</span>
      </div>
    </div>

    <!-- Visor de cámara Breeze -->
    <div class="camera-body">
      <div class="camera-viewfinder" :class="{ 'flash-active': showFlash }">
        <!-- Indicador de Grabación Activo -->
        <div v-if="isRecording" class="recording-indicator">
          <div class="rec-dot"></div>
          <span>REC {{ formatTime(recordingSeconds) }}</span>
        </div>

        <div class="crosshair"></div>

        <!-- Feed del video real de la webcam -->
        <video
          v-show="streamActive"
          ref="videoRef"
          autoplay
          playsinline
          class="camera-video-feed"
        ></video>

        <!-- Loader si la cámara está apagada o cargando -->
        <div v-if="!streamActive" class="camera-loading-state">
          <span class="glitch-text">Inicializando dispositivo de cámara...</span>
          <span class="loading-subtext">Acepta los permisos del navegador</span>
        </div>

        <div class="viewfinder-meta">
          <span>FPS: 60.00</span>
          <span>ISO: 1200</span>
          <span>F/1.8</span>
        </div>
      </div>
    </div>

    <!-- Botones de Control de Captura -->
    <div class="camera-controls">
      <!-- Botón de Video (Grabar / Parar) -->
      <button
        class="ctrl-btn record-btn"
        :class="{ 'recording-active': isRecording }"
        :disabled="!streamActive"
        @click="toggleVideoRecording"
        :title="isRecording ? 'Detener Grabación' : 'Grabar Video'"
      >
        <VideoIcon v-if="!isRecording" class="ctrl-icon" />
        <SquareIcon v-else class="ctrl-icon stop-icon" />
      </button>

      <!-- Botón de Foto (Obturador) -->
      <button
        class="shutter-btn"
        :disabled="!streamActive || isRecording"
        @click="takePhoto"
        title="Tomar Foto"
      ></button>

      <!-- Indicador de estado de guardado rápido -->
      <div class="save-toast" :class="{ 'toast-visible': saveMessage }">
        {{ saveMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useOSStore } from '@/stores/osStore';
import {
  Camera as CameraIcon,
  Video as VideoIcon,
  Square as SquareIcon
} from 'lucide-vue-next';

const osStore = useOSStore();

const videoRef = ref<HTMLVideoElement | null>(null);
const streamActive = ref(false);
const showFlash = ref(false);
const saveMessage = ref('');

// Control de grabación
const isRecording = ref(false);
const recordingSeconds = ref(0);
let timerInterval: ReturnType<typeof setInterval>;
let mediaStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];

// Foco del temporizador de grabación
function formatTime(sec: number) {
  const mins = Math.floor(sec / 60).toString().padStart(2, '0');
  const secs = (sec % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

// Inicializar la webcam del usuario
async function initWebcam() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: true // Habilitar audio para videos grabados
    });

    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream;
      streamActive.value = true;
    }
  } catch (err) {
    console.error('[CameraApp] Error al acceder a la webcam:', err);
    alert('No se pudo acceder a la cámara. Asegúrate de otorgar permisos de cámara en tu navegador.');
  }
}

// Tomar foto instantánea utilizando Canvas
function takePhoto() {
  if (!videoRef.value || !streamActive.value) return;

  // Destello visual de flash Breeze
  showFlash.value = true;
  setTimeout(() => (showFlash.value = false), 150);

  const video = videoRef.value;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Dibujar cuadro de video en canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir a JPEG DataURL
    const dataUrl = canvas.toDataURL('image/jpeg');

    // Registrar en Imágenes de Pinia
    const filename = `foto-${Date.now()}.jpg`;
    osStore.addFileToFolder('Imágenes', {
      name: filename,
      type: 'file',
      size: '140 KB',
      dataUrl
    });

    triggerSaveMessage('¡Foto guardada en Imágenes!');
  }
}

// Iniciar/Detener la grabación de video
function toggleVideoRecording() {
  if (!mediaStream) return;

  if (!isRecording.value) {
    // Iniciar grabación
    isRecording.value = true;
    recordingSeconds.value = 0;
    recordedChunks = [];

    // Temporizador
    timerInterval = setInterval(() => {
      recordingSeconds.value++;
    }, 1000);

    try {
      mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const filename = `video-${Date.now()}.mp4`;
          
          osStore.addFileToFolder('Imágenes', {
            name: filename,
            type: 'file',
            size: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
            dataUrl
          });

          triggerSaveMessage('¡Video guardado en Imágenes!');
        };
      };

      mediaRecorder.start();
    } catch (err) {
      console.error('[CameraApp] Error al iniciar grabador:', err);
    }
  } else {
    // Detener grabación
    isRecording.value = false;
    clearInterval(timerInterval);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }
}

function triggerSaveMessage(msg: string) {
  saveMessage.value = msg;
  setTimeout(() => {
    saveMessage.value = '';
  }, 3000);
}

// Limpiar recursos y apagar la webcam al desmontar
function stopWebcam() {
  clearInterval(timerInterval);
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  streamActive.value = false;
}

onMounted(() => {
  initWebcam();
});

onUnmounted(() => {
  stopWebcam();
});
</script>

<style scoped>
.app-placeholder {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: var(--font-family-base);
  overflow: hidden;
  position: relative;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.app-header-icon {
  width: 28px;
  height: 28px;
  color: var(--accent);
}

.app-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.app-subtitle {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.camera-body {
  flex: 1;
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Visor Breeze */
.camera-viewfinder {
  position: relative;
  width: 100%;
  height: 100%;
  max-height: 270px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: background 0.15s ease;
}

.flash-active {
  background: #ffffff !important;
}

/* Transmisión de webcam */
.camera-video-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

/* Estado de carga */
.camera-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--accent);
  z-index: 2;
}

.glitch-text {
  font-family: var(--font-family-base);
  font-size: 0.9rem;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.loading-subtext {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.recording-indicator {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--danger);
  font-family: monospace;
  font-weight: bold;
  font-size: 0.85rem;
  z-index: 6;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--danger);
}

.rec-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--danger);
  animation: blink 1s infinite alternate;
}

@keyframes blink {
  from { opacity: 0.2; }
  to { opacity: 1; }
}

.crosshair {
  width: 24px;
  height: 24px;
  border: 1px solid var(--border-color);
  border-radius: 50%;
  position: absolute;
  z-index: 3;
  pointer-events: none;
}

.viewfinder-meta {
  position: absolute;
  bottom: 12px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--text-secondary);
  z-index: 6;
}

/* Panel de Controles inferiores */
.camera-controls {
  position: relative;
  height: 72px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.ctrl-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--accent);
  color: var(--accent);
}

.ctrl-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Grabación Activa */
.recording-active {
  background: rgba(237, 21, 21, 0.15) !important;
  border-color: var(--danger) !important;
  color: var(--danger) !important;
}

.ctrl-icon {
  width: 20px;
  height: 20px;
}

.stop-icon {
  width: 14px;
  height: 14px;
}

/* Obturador Shutter Foto */
.shutter-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 3.5px solid var(--accent);
  cursor: pointer;
  transition: all 0.2s ease;
}

.shutter-btn:hover:not(:disabled) {
  transform: scale(1.06);
  background: var(--bg-hover);
}

.shutter-btn:active:not(:disabled) {
  transform: scale(0.95);
  background: var(--accent);
}

.shutter-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  border-color: var(--border-color);
}

/* Toast de guardado */
.save-toast {
  position: absolute;
  top: -36px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 4px 14px;
  border-radius: 4px;
  box-shadow: var(--shadow-popup);
  pointer-events: none;
  opacity: 0;
  transition: all 0.25s ease;
  z-index: 10;
}

.toast-visible {
  opacity: 1;
  transform: translateX(-50%) translateY(-5px);
}
</style>
