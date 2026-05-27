<template>
  <div class="player-container" :class="{ 'v2-layout': isV2 }">
    <!-- Elemento de audio nativo para reproducción real -->
    <audio
      ref="audioElement"
      :src="currentTrack.src"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="nextTrack"
    ></audio>

    <!-- INTERFAZ V2 (Doble Columna) PARA SISTEMA V1.1.0 -->
    <div v-if="isV2" class="player-v2-grid">
      <!-- Columna Izquierda: Playlist/Biblioteca -->
      <div class="v2-sidebar">
        <div class="sidebar-header">
          <LibraryIcon class="sidebar-header-icon" />
          <h4 class="sidebar-title">Biblioteca de Música</h4>
        </div>
        <div class="track-list-scrollable">
          <div
            v-for="(track, idx) in tracks"
            :key="idx"
            class="playlist-item"
            :class="{ 'item-active': trackIndex === idx }"
            @click="selectTrack(idx)"
          >
            <div class="playlist-item-left">
              <span class="track-number">{{ idx + 1 }}</span>
              <div class="playlist-item-details">
                <span class="playlist-item-title" :title="track.title">{{ track.title }}</span>
                <span class="playlist-item-artist">{{ track.artist }}</span>
              </div>
            </div>
            
            <div class="playlist-item-right">
              <span class="track-duration-lbl">{{ formatTime(track.duration) }}</span>
              <div v-if="trackIndex === idx && isPlaying" class="playing-indicator-micro">
                <span class="indicator-bar bar-1"></span>
                <span class="indicator-bar bar-2"></span>
                <span class="indicator-bar bar-3"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna Derecha: Reproductor Detallado -->
      <div class="v2-main-player">
        <div class="v2-album-art-area">
          <div class="art-disc" :class="{ 'disc-spinning': isPlaying }">
            <div class="disc-vinyl">
              <MusicIcon class="disc-center-icon" />
            </div>
          </div>
          
          <!-- ONDAS DE SONIDO REACTIVAS -->
          <div class="wave-visualizer" :class="{ 'wave-active': isPlaying }">
            <div v-for="i in 16" :key="i" class="wave-bar" :style="barStyle(i)"></div>
          </div>
        </div>

        <div class="v2-track-info">
          <h3 class="v2-track-title" :title="currentTrack.title">{{ currentTrack.title }}</h3>
          <span class="v2-track-artist">{{ currentTrack.artist }}</span>
        </div>

        <!-- BARRA DE PROGRESO -->
        <div class="v2-progress-section">
          <span class="time-lbl">{{ formatTime(currentTime) }}</span>
          <div class="progress-bar-bg" @click="seek">
            <div class="progress-bar-fill" :style="{ width: `${progressPct}%` }"></div>
          </div>
          <span class="time-lbl">{{ formatTime(trackDuration) }}</span>
        </div>

        <!-- SECCIÓN DE CONTROLES Y VOLUMEN -->
        <div class="v2-controls-row">
          <!-- Espacio izquierdo para balancear el volumen de la derecha -->
          <div class="v2-left-spacer"></div>

          <!-- Controles multimedia -->
          <div class="v2-media-controls">
            <button type="button" class="ctrl-btn-side" @click="prevTrack" title="Anterior">
              <SkipBackIcon class="ctrl-icon-svg" />
            </button>

            <button type="button" class="ctrl-btn-play" @click="togglePlay" :title="isPlaying ? 'Pausar' : 'Reproducir'">
              <component :is="isPlaying ? PauseIcon : PlayIcon" class="ctrl-icon-play-svg" />
            </button>

            <button type="button" class="ctrl-btn-side" @click="nextTrack" title="Siguiente">
              <SkipForwardIcon class="ctrl-icon-svg" />
            </button>
          </div>

          <!-- Control de Volumen integrado -->
          <div class="v2-volume-control">
            <button type="button" class="vol-btn" @click="audioStore.toggleMute" title="Silenciar">
              <component :is="audioStore.iconType" class="vol-icon-svg" />
            </button>
            <input
              type="range"
              min="0"
              max="100"
              :value="audioStore.volume"
              @input="onVolumeChange"
              class="vol-slider"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- INTERFAZ V1 (Original / Clásica) PARA SISTEMA V1.0.0 -->
    <div v-else class="player-card">
      <div class="album-art-area">
        <div class="art-disc" :class="{ 'disc-spinning': isPlaying }">
          <div class="disc-vinyl">
            <MusicIcon class="disc-center-icon" />
          </div>
        </div>
        
        <!-- ONDAS DE SONIDO REACTIVAS -->
        <div class="wave-visualizer" :class="{ 'wave-active': isPlaying }">
          <div v-for="i in 12" :key="i" class="wave-bar" :style="barStyle(i)"></div>
        </div>
      </div>

      <div class="track-info">
        <h3 class="track-title" :title="currentTrack.title">{{ currentTrack.title }}</h3>
        <span class="track-artist">{{ currentTrack.artist }}</span>
      </div>

      <!-- BARRA DE TIEMPO / PROGRESO -->
      <div class="progress-section">
        <span class="time-lbl">{{ formatTime(currentTime) }}</span>
        <div class="progress-bar-bg" @click="seek">
          <div class="progress-bar-fill" :style="{ width: `${progressPct}%` }"></div>
        </div>
        <span class="time-lbl">{{ formatTime(trackDuration) }}</span>
      </div>

      <!-- CONTROLES MULTIMEDIA -->
      <div class="media-controls">
        <button type="button" class="ctrl-btn-side" @click="prevTrack" title="Anterior">
          <SkipBackIcon class="ctrl-icon-svg" />
        </button>

        <button type="button" class="ctrl-btn-play" @click="togglePlay" :title="isPlaying ? 'Pausar' : 'Reproducir'">
          <component :is="isPlaying ? PauseIcon : PlayIcon" class="ctrl-icon-play-svg" />
        </button>

        <button type="button" class="ctrl-btn-side" @click="nextTrack" title="Siguiente">
          <SkipForwardIcon class="ctrl-icon-svg" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useOSStore } from '@/stores/osStore';
import { useAudioStore } from '@/stores/audioStore';
import {
  Play as PlayIcon,
  Pause as PauseIcon,
  SkipBack as SkipBackIcon,
  SkipForward as SkipForwardIcon,
  Music as MusicIcon,
  Library as LibraryIcon
} from 'lucide-vue-next';

interface Track {
  title: string;
  artist: string;
  duration: number; // en segundos (fallback)
  src: string;
}

const osStore = useOSStore();
const audioStore = useAudioStore();

const isV2 = computed(() => osStore.systemVersion === '1.1.0');

const finalVolume = computed(() => audioStore.isMuted ? 0 : audioStore.volume / 100);

const defaultTracks = computed<Track[]>(() => {
  const base = [
    {
      title: 'Symphony No. 5 in C minor',
      artist: 'Ludwig van Beethoven',
      duration: 420,
      src: '/music/beethoven_symphony_5.mp3'
    },
    {
      title: 'Clair de Lune',
      artist: 'Claude Debussy',
      duration: 305,
      src: '/music/debussy_clair_de_lune.mp3'
    },
    {
      title: 'Gymnopédie No. 1',
      artist: 'Erik Satie',
      duration: 190,
      src: '/music/satie_gymnopedie_1.mp3'
    }
  ];

  if (isV2.value) {
    return [
      ...base,
      {
        title: 'Primavera (Spring) - Las Cuatro Estaciones',
        artist: 'Antonio Vivaldi',
        duration: 210,
        src: '/music/vivaldi_spring.mp3'
      },
      {
        title: 'Nocturne in E-flat major, Op. 9 No. 2',
        artist: 'Frédéric Chopin',
        duration: 270,
        src: '/music/chopin_nocturne.mp3'
      },
      {
        title: 'Lacrimosa - Réquiem en Re menor',
        artist: 'Wolfgang Amadeus Mozart',
        duration: 185,
        src: '/music/mozart_lacrimosa.mp3'
      }
    ];
  }

  return base;
});

// Obtener dinámicamente los mp3s guardados en la carpeta Descargas
const localTracks = computed<Track[]>(() => {
  const downloadedFiles = osStore.fileSystem['Descargas'] || [];
  return downloadedFiles
    .filter(file => file.type === 'file' && file.name.toLowerCase().endsWith('.mp3') && file.dataUrl)
    .map(file => {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
      return {
        title: cleanTitle,
        artist: 'Archivo Local',
        duration: 180,
        src: file.dataUrl as string
      };
    });
});

const tracks = computed<Track[]>(() => {
  return [...defaultTracks.value, ...localTracks.value];
});

const trackIndex = ref(0);
const isPlaying = ref(false);
const currentTime = ref(0);

const currentTrack = computed(() => {
  const allTracks = tracks.value;
  if (trackIndex.value >= allTracks.length) {
    trackIndex.value = 0;
  }
  return allTracks[trackIndex.value] || defaultTracks.value[0];
});

const trackDuration = ref(currentTrack.value.duration);
const progressPct = computed(() => {
  if (trackDuration.value === 0) return 0;
  return (currentTime.value / trackDuration.value) * 100;
});

const audioElement = ref<HTMLAudioElement | null>(null);
let simulationTimer: any = null;
const isUsingSimulation = ref(false);

watch(finalVolume, (newVol) => {
  if (audioElement.value) {
    audioElement.value.volume = newVol;
  }
});

watch(currentTrack, async (newTrack) => {
  trackDuration.value = newTrack.duration;
  currentTime.value = 0;
  isUsingSimulation.value = false;
  
  // Esperar a que Vue actualice el atributo :src del elemento <audio> en el DOM real
  await nextTick();
  
  if (audioElement.value) {
    audioElement.value.load(); // Forzar al elemento audio a cargar el nuevo origen
    audioElement.value.volume = finalVolume.value; // Inicializar volumen
  }
  
  if (isPlaying.value) {
    playAudio();
  }
});

function onLoadedMetadata() {
  if (audioElement.value) {
    audioElement.value.volume = finalVolume.value; // Inicializar volumen al cargar metadatos
    if (audioElement.value.duration) {
      trackDuration.value = Math.floor(audioElement.value.duration);
    }
  }
}

function onTimeUpdate() {
  if (audioElement.value && !isUsingSimulation.value) {
    currentTime.value = Math.floor(audioElement.value.currentTime);
  }
}

function playAudio() {
  if (simulationTimer) {
    clearInterval(simulationTimer);
    simulationTimer = null;
  }

  if (audioElement.value) {
    audioElement.value.volume = finalVolume.value; // Sincronizar volumen antes de play
    audioElement.value.play().then(() => {
      isUsingSimulation.value = false;
    }).catch((err) => {
      console.debug("Audio file failed or missing, starting smart virtual simulation:", err);
      startSimulation();
    });
  } else {
    startSimulation();
  }
}

function startSimulation() {
  isUsingSimulation.value = true;
  if (simulationTimer) clearInterval(simulationTimer);
  simulationTimer = setInterval(() => {
    if (currentTime.value >= trackDuration.value) {
      nextTrack();
    } else {
      currentTime.value++;
    }
  }, 1000);
}

function togglePlay() {
  isPlaying.value = !isPlaying.value;
  if (isPlaying.value) {
    playAudio();
  } else {
    if (audioElement.value) {
      audioElement.value.pause();
    }
    if (simulationTimer) {
      clearInterval(simulationTimer);
      simulationTimer = null;
    }
  }
}

function nextTrack() {
  if (tracks.value.length === 0) return;
  trackIndex.value = (trackIndex.value + 1) % tracks.value.length;
  currentTime.value = 0;
  if (audioElement.value) {
    audioElement.value.currentTime = 0;
  }
}

function prevTrack() {
  if (tracks.value.length === 0) return;
  trackIndex.value = (trackIndex.value - 1 + tracks.value.length) % tracks.value.length;
  currentTime.value = 0;
  if (audioElement.value) {
    audioElement.value.currentTime = 0;
  }
}

function selectTrack(idx: number) {
  trackIndex.value = idx;
  currentTime.value = 0;
  if (audioElement.value) {
    audioElement.value.currentTime = 0;
  }
  isPlaying.value = true;
  playAudio();
}

function onVolumeChange(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10);
  audioStore.setVolume(val);
}

function seek(e: MouseEvent) {
  if (trackDuration.value === 0) return;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const pct = clickX / rect.width;
  const targetSecs = Math.floor(pct * trackDuration.value);
  
  currentTime.value = targetSecs;
  if (audioElement.value && !isUsingSimulation.value) {
    audioElement.value.currentTime = targetSecs;
  }
}

function formatTime(secs: number): string {
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  return `${mins}:${remSecs.toString().padStart(2, '0')}`;
}

// Estilos aleatorios para el ecualizador reactivo
function barStyle(index: number) {
  if (!isPlaying.value) return {};
  const randDelay = Math.random() * 0.8;
  const randHeight = 25 + Math.random() * 55;
  return {
    animationDelay: `${randDelay}s`,
    animationDuration: `${0.6 + Math.random() * 0.6}s`,
    height: `${randHeight}%`
  };
}

onUnmounted(() => {
  if (simulationTimer) clearInterval(simulationTimer);
});

// ---- Asociación de Reproducción de Archivo Abierto ----
function handleActiveOpenFile() {
  const file = osStore.activeOpenFile;
  if (file && file.name.toLowerCase().endsWith('.mp3')) {
    const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
    
    // Buscar la canción en el catálogo (incluyendo locales)
    const foundIndex = tracks.value.findIndex(t => t.title === cleanTitle);
    if (foundIndex !== -1) {
      trackIndex.value = foundIndex;
      isPlaying.value = true;
      
      nextTick(() => {
        if (audioElement.value) {
          audioElement.value.load(); // Forzar recarga del origen
          audioElement.value.volume = finalVolume.value; // Sincronizar volumen
        }
        playAudio();
      });
    }
    
    osStore.activeOpenFile = null; // Limpiar referencia una vez ejecutado
  }
}

onMounted(() => {
  handleActiveOpenFile();
});

watch(
  () => osStore.activeOpenFile,
  () => {
    handleActiveOpenFile();
  },
  { deep: true }
);
</script>

<style scoped>
.player-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  padding: 20px;
  box-sizing: border-box;
}

.player-container.v2-layout {
  padding: 0;
  align-items: stretch;
}

.player-card {
  width: 100%;
  max-width: 360px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 24px;
  box-shadow: var(--shadow-window);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* ── LAYOUT V2 (DOBLE COLUMNA ESTILO KDE BREEZE) ── */
.player-v2-grid {
  display: flex;
  width: 100%;
  height: 100%;
}

/* Sidebar de la lista de canciones */
.v2-sidebar {
  width: 280px;
  background: rgba(35, 38, 41, 0.95);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

:global(.light-theme) .v2-sidebar {
  background: rgba(239, 240, 241, 0.95);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-header-icon {
  width: 18px;
  height: 18px;
  color: var(--accent);
}

.sidebar-title {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-primary);
  margin: 0;
}

.track-list-scrollable {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Items de playlist en la barra lateral */
.playlist-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all var(--transition-fast) ease;
}

.playlist-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

:global(.light-theme) .playlist-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.playlist-item.item-active {
  background: rgba(61, 174, 233, 0.15);
  border-color: rgba(61, 174, 233, 0.3);
}

.playlist-item-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.track-number {
  font-size: 0.75rem;
  font-weight: bold;
  font-family: monospace;
  color: var(--text-secondary);
  opacity: 0.5;
  width: 14px;
  text-align: center;
}

.playlist-item.item-active .track-number {
  color: var(--accent);
  opacity: 1;
}

.playlist-item-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.playlist-item-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-item-artist {
  font-size: 0.7rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-item-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
}

.track-duration-lbl {
  font-size: 0.7rem;
  font-family: monospace;
  color: var(--text-secondary);
  opacity: 0.7;
}

/* Indicador animado mini */
.playing-indicator-micro {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  width: 12px;
  height: 10px;
}

.indicator-bar {
  width: 2px;
  background: var(--accent);
  border-radius: 1px;
  animation: play-micro-wave 0.8s ease-in-out infinite alternate;
}

.bar-1 { animation-delay: 0.1s; height: 100%; }
.bar-2 { animation-delay: 0.4s; height: 60%; }
.bar-3 { animation-delay: 0.2s; height: 80%; }

@keyframes play-micro-wave {
  0% { transform: scaleY(0.3); }
  100% { transform: scaleY(1); }
}

/* Área Principal del Reproductor Detallado */
.v2-main-player {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 30px;
  background: var(--bg-primary);
  position: relative;
  gap: 20px;
}

.v2-album-art-area {
  position: relative;
  width: 220px;
  height: 220px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.art-disc {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-primary));
  border: 4px solid var(--border-color);
  box-shadow: var(--shadow-window);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 2;
  transition: transform 0.5s ease;
}

.disc-vinyl {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent) 20%, var(--bg-secondary) 70%);
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid var(--border-color);
}

.disc-center-icon {
  width: 20px;
  height: 20px;
  color: #ffffff;
}

.disc-spinning {
  animation: spin 6s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Ondas ecualizadoras de fondo */
.wave-visualizer {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  pointer-events: none;
  z-index: 1;
}

.wave-bar {
  width: 4px;
  height: 12px;
  background: var(--accent);
  border-radius: 2px;
  opacity: 0.12;
  transition: all 0.3s ease;
}

.wave-active .wave-bar {
  opacity: 0.7;
  animation: wavePulse 1.2s ease-in-out infinite alternate;
}

@keyframes wavePulse {
  0% { transform: scaleY(1); }
  100% { transform: scaleY(2.2); }
}

.v2-track-info {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 100%;
}

.v2-track-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.v2-track-artist {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.v2-progress-section {
  width: 100%;
  max-width: 460px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-lbl {
  font-size: 0.7rem;
  font-family: monospace;
  color: var(--text-secondary);
  width: 36px;
  text-align: center;
}

.progress-bar-bg {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

:global(.light-theme) .progress-bar-bg {
  background: rgba(0, 0, 0, 0.08);
}

.progress-bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 4px;
}

/* Fila de controles multimedia y volumen */
.v2-controls-row {
  display: flex;
  width: 100%;
  max-width: 480px;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  gap: 15px;
}

.v2-left-spacer {
  width: 130px;
}

.v2-media-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ctrl-btn-side {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

:global(.light-theme) .ctrl-btn-side {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.08);
}

.ctrl-btn-side:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
  color: var(--accent);
}

.ctrl-icon-svg {
  width: 16px;
  height: 16px;
}

.ctrl-btn-play {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 12px rgba(61, 174, 233, 0.3);
}

.ctrl-btn-play:hover {
  transform: scale(1.08);
  background: var(--accent-hover);
}

.ctrl-icon-play-svg {
  width: 20px;
  height: 20px;
  fill: #ffffff;
}

/* Control de volumen integrado */
.v2-volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 130px;
  justify-content: flex-end;
}

.vol-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast) ease;
}

.vol-btn:hover {
  color: var(--accent);
}

.vol-icon-svg {
  width: 16px;
  height: 16px;
}

.vol-slider {
  -webkit-appearance: none;
  width: 70px;
  height: 4px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 2px;
  outline: none;
}

:global(.light-theme) .vol-slider {
  background: rgba(0, 0, 0, 0.12);
}

.vol-slider::-webkit-slider-value {
  background: var(--accent);
}

.vol-slider::-webkit-slider-runnable-track {
  height: 4px;
}

.vol-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  margin-top: -3px;
  transition: transform 0.15s ease;
}

.vol-slider::-webkit-slider-thumb:hover {
  transform: scale(1.3);
}

.vol-slider::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: none;
  transition: transform 0.15s ease;
}

.vol-slider::-moz-range-thumb:hover {
  transform: scale(1.3);
}

/* ── LAYOUT CLÁSICO DE UNA SOLA TARJETA ── */
.album-art-area {
  position: relative;
  width: 180px;
  height: 180px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.art-disc {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-primary));
  border: 4px solid var(--border-color);
  box-shadow: var(--shadow-subtle);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  transition: transform 0.5s ease;
}

.disc-vinyl {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent) 20%, var(--bg-secondary) 70%);
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid var(--border-color);
}

.disc-center-icon {
  width: 18px;
  height: 18px;
  color: #ffffff;
}

.disc-spinning {
  animation: spin 5s linear infinite;
}

/* ONDAS DE SONIDO REACTIVAS */
.wave-visualizer {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  pointer-events: none;
}

.wave-bar {
  width: 4px;
  height: 8px;
  background: var(--accent);
  border-radius: 2px;
  opacity: 0.15;
  transition: all 0.3s ease;
}

.wave-active .wave-bar {
  opacity: 0.8;
  animation: wavePulse 1s ease-in-out infinite alternate;
}

@keyframes wavePulse {
  0% { transform: scaleY(1); }
  100% { transform: scaleY(1.8); }
}

.track-info {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.track-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-primary);
}

.track-artist {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

/* PROGRESO DE REPRODUCCIÓN */
.progress-section {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-lbl {
  font-size: 0.7rem;
  font-family: monospace;
  color: var(--text-secondary);
  width: 32px;
}

.progress-bar-bg {
  flex: 1;
  height: 5px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--accent);
}

/* BOTONES MULTIMEDIA */
.media-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.ctrl-btn-side {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
}

.ctrl-btn-side:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
  color: var(--accent);
}

.ctrl-icon-svg {
  width: 18px;
  height: 18px;
}

.ctrl-btn-play {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ctrl-btn-play:hover {
  transform: scale(1.1);
  background: var(--accent-hover);
}

.ctrl-icon-play-svg {
  width: 22px;
  height: 22px;
  fill: #ffffff;
}
</style>
