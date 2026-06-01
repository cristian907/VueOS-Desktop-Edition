<template>
  <div class="paint-container">
    <!-- PANEL DE CONTROL LATERAL (ESTILO BREEZE DARK) -->
    <aside class="paint-toolbar">
      <div class="toolbar-section">
        <h4 class="section-title">Herramientas</h4>
        <div class="tools-grid">
          <button
            v-for="t in tools"
            :key="t.id"
            type="button"
            class="tool-btn"
            :class="{ active: currentTool === t.id }"
            @click="setTool(t.id)"
            :title="t.name"
          >
            <component :is="t.icon" class="tool-icon" />
          </button>
        </div>
      </div>

      <div class="toolbar-section">
        <h4 class="section-title">Grosor: {{ strokeWidth }}px</h4>
        <div class="slider-container">
          <input
            type="range"
            min="1"
            max="40"
            v-model.number="strokeWidth"
            class="breeze-slider"
          />
        </div>
      </div>

      <div class="toolbar-section flex-grow">
        <h4 class="section-title">Paleta de Colores</h4>
        <div class="palette-grid">
          <button
            v-for="color in presetColors"
            :key="color"
            type="button"
            class="color-swatch"
            :class="{ active: currentColor === color }"
            :style="{ backgroundColor: color }"
            @click="currentColor = color"
            :title="color"
          ></button>
        </div>
        <div class="custom-color-picker">
          <label for="paint-color-picker" class="picker-label">Color Personalizado:</label>
          <div class="picker-row">
            <input
              id="paint-color-picker"
              type="color"
              v-model="currentColor"
              class="breeze-color-input"
            />
            <span class="color-hex-val">{{ currentColor.toUpperCase() }}</span>
          </div>
        </div>
      </div>

      <!-- ACCIONES DEL LIENZO -->
      <div class="toolbar-section actions-section">
        <button type="button" class="action-btn clear-btn" @click="clearCanvas" title="Limpiar Lienzo">
          <TrashIcon class="action-icon" />
          <span>Limpiar</span>
        </button>
        <button type="button" class="action-btn save-btn" @click="showSaveDialog = true" title="Guardar Dibujo">
          <SaveIcon class="action-icon" />
          <span>Guardar en OS</span>
        </button>
      </div>
    </aside>

    <!-- ÁREA CENTRAL DE DIBUJO -->
    <main class="paint-canvas-area">
      <div class="canvas-wrapper">
        <canvas
          ref="canvasRef"
          class="paint-canvas"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
        ></canvas>
      </div>
    </main>

    <!-- DIÁLOGO INTERACTIVO DE GUARDAR COMO (KDE BREEZE STYLE) -->
    <FileSaveDialog
      v-model:show="showSaveDialog"
      :default-filename="saveFilename"
      extension=".png"
      title="GUARDAR DIBUJO"
      filter-label="Imágenes PNG (*.png)"
      @save="handleSaveDialog"
    />

    <!-- TOAST DE NOTIFICACIÓN -->
    <Transition name="fade">
      <div v-if="toastMessage" class="breeze-toast">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useOSStore } from '@/stores/osStore';
import FileSaveDialog from '@/components/ui/FileSaveDialog.vue';
import {
  Pencil as PencilIcon,
  Eraser as EraserIcon,
  Square as SquareIcon,
  Circle as CircleIcon,
  Slash as LineIcon,
  Trash2 as TrashIcon,
  Save as SaveIcon,
  X as XIcon
} from 'lucide-vue-next';

const osStore = useOSStore();

// --- STATE ---
const canvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);
const isDrawing = ref(false);
const currentTool = ref<'pencil' | 'eraser' | 'line' | 'rect' | 'circle'>('pencil');
const strokeWidth = ref(5);
const currentColor = ref('#3daee9'); // Breeze Blue por defecto
const showSaveDialog = ref(false);
const saveFilename = ref('dibujo_breeze');
const toastMessage = ref('');

// Coordenadas de inicio para trazo continuo o formas
const startX = ref(0);
const startY = ref(0);
// Backup del canvas para previsualizar formas
const canvasBackup = ref<ImageData | null>(null);

// Herramientas soportadas
const tools = [
  { id: 'pencil', name: 'Lápiz de Trazo Libre', icon: PencilIcon },
  { id: 'eraser', name: 'Borrador', icon: EraserIcon },
  { id: 'line', name: 'Línea Recta', icon: LineIcon },
  { id: 'rect', name: 'Rectángulo', icon: SquareIcon },
  { id: 'circle', name: 'Círculo', icon: CircleIcon },
] as const;

// Colores prestablecidos (Paleta Breeze Dark + Neón de VueOS)
const presetColors = [
  '#ffffff', '#eff0f1', '#bdc3c7', '#7f8c8d', '#232629', '#1b1e20',
  '#3daee9', '#2ecc71', '#27ae60', '#f1c40f', '#f67400', '#e74c3c',
  '#d42dd4', '#9b59b6', '#00f3ff', '#ff00ff', '#3fa775', '#a8375c'
];

// --- METHODS ---
function setTool(toolId: typeof currentTool.value) {
  currentTool.value = toolId;
}

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = '';
    }
  }, 2500);
}

// Inicialización y reajuste del tamaño del canvas
function initCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const parent = canvas.parentElement;
  if (!parent) return;

  // Ajustar dimensiones del canvas para que coincida exactamente con su contenedor
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight;

  // Rellenar fondo de color blanco por defecto
  const c = canvas.getContext('2d', { willReadFrequently: true });
  if (c) {
    ctx.value = c;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    
    // Relleno blanco inicial
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function clearCanvas() {
  const canvas = canvasRef.value;
  const c = ctx.value;
  if (canvas && c) {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, canvas.width, canvas.height);
    showToast('Lienzo limpio');
  }
}

// --- DRAWING LOGIC ---
function startDrawing(e: MouseEvent) {
  const canvas = canvasRef.value;
  const c = ctx.value;
  if (!canvas || !c) return;

  isDrawing.value = true;
  const rect = canvas.getBoundingClientRect();
  startX.value = e.clientX - rect.left;
  startY.value = e.clientY - rect.top;

  c.beginPath();
  c.lineWidth = strokeWidth.value;
  c.strokeStyle = currentTool.value === 'eraser' ? '#ffffff' : currentColor.value;
  c.fillStyle = currentTool.value === 'eraser' ? '#ffffff' : currentColor.value;

  if (currentTool.value === 'pencil' || currentTool.value === 'eraser') {
    c.moveTo(startX.value, startY.value);
    c.lineTo(startX.value, startY.value);
    c.stroke();
  } else {
    // Tomar backup para previsualizar formas vectoriales
    canvasBackup.value = c.getImageData(0, 0, canvas.width, canvas.height);
  }
}

function draw(e: MouseEvent) {
  if (!isDrawing.value) return;
  const canvas = canvasRef.value;
  const c = ctx.value;
  if (!canvas || !c) return;

  const rect = canvas.getBoundingClientRect();
  const curX = e.clientX - rect.left;
  const curY = e.clientY - rect.top;

  if (currentTool.value === 'pencil' || currentTool.value === 'eraser') {
    c.lineTo(curX, curY);
    c.stroke();
  } else if (canvasBackup.value) {
    // Restaurar el estado inicial antes de dibujar la previsualización temporal
    c.putImageData(canvasBackup.value, 0, 0);
    c.lineWidth = strokeWidth.value;
    c.strokeStyle = currentColor.value;

    if (currentTool.value === 'line') {
      c.beginPath();
      c.moveTo(startX.value, startY.value);
      c.lineTo(curX, curY);
      c.stroke();
    } else if (currentTool.value === 'rect') {
      c.beginPath();
      const w = curX - startX.value;
      const h = curY - startY.value;
      c.strokeRect(startX.value, startY.value, w, h);
    } else if (currentTool.value === 'circle') {
      c.beginPath();
      const radius = Math.sqrt(Math.pow(curX - startX.value, 2) + Math.pow(curY - startY.value, 2));
      c.arc(startX.value, startY.value, radius, 0, 2 * Math.PI);
      c.stroke();
    }
  }
}

function stopDrawing() {
  if (!isDrawing.value) return;
  isDrawing.value = false;
  canvasBackup.value = null;
}

// --- SAVE IMAGE INTEGRATION ---
async function handleSaveDialog(payload: { folder: string; filename: string }) {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const { folder, filename } = payload;
  const dataUrl = canvas.toDataURL('image/png');

  try {
    // Invocar el handler de archivos nativo por medio del bridge IPC
    await window.osAPI.writeFile(folder, filename, { dataUrl });
    
    // Actualizar el store de archivos virtuales del sistema operativo para que el Explorador lo renderice inmediatamente
    osStore.addFileToFolder(folder, {
      name: filename,
      type: 'file',
      size: `${Math.round((dataUrl.length * 0.75) / 1024)} KB`,
      dataUrl
    });

    showToast(`Guardado con éxito en: ${folder}/${filename}`);
    saveFilename.value = filename.replace('.png', ''); // Sincronizar para la próxima
  } catch (err: any) {
    showToast(`Error al guardar en disco: ${err.message}`);
  }
}

// Manejador del cambio de tamaño de la ventana del simulador
let resizeObserver: ResizeObserver | null = null;
onMounted(() => {
  nextTick(() => {
    initCanvas();
    
    // Escuchar el tamaño del contenedor del canvas de forma reactiva
    const parent = canvasRef.value?.parentElement;
    if (parent) {
      resizeObserver = new ResizeObserver(() => {
        // En lugar de reiniciar, copiamos el contenido viejo
        const canvas = canvasRef.value;
        const c = ctx.value;
        if (canvas && c) {
          const tempImageData = c.getImageData(0, 0, canvas.width, canvas.height);
          const oldW = canvas.width;
          const oldH = canvas.height;
          
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
          
          c.fillStyle = '#ffffff';
          c.fillRect(0, 0, canvas.width, canvas.height);
          c.lineCap = 'round';
          c.lineJoin = 'round';
          
          c.putImageData(tempImageData, 0, 0);
        }
      });
      resizeObserver.observe(parent);
    }
  });
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<style scoped>
.paint-container {
  display: flex;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-family-base), sans-serif;
  overflow: hidden;
  user-select: none;
}

/* BARRA LATERAL (BREEZE DARK) */
.paint-toolbar {
  width: 250px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 20px;
  flex-shrink: 0;
}

.toolbar-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.flex-grow {
  flex: 1;
  overflow-y: auto;
}

.section-title {
  font-size: 0.72rem;
  font-weight: bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 4px;
}

/* Herramientas grid */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.tool-btn {
  height: 48px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast) ease;
}

.tool-btn:hover {
  border-color: var(--border-hover);
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tool-btn.active {
  background: var(--bg-active) !important;
  border-color: var(--accent) !important;
  color: var(--accent) !important;
  box-shadow: 0 0 8px rgba(61, 174, 233, 0.2);
}

.tool-icon {
  width: 18px;
  height: 18px;
}

/* Rango Slider */
.slider-container {
  padding: 4px 0;
}

.breeze-slider {
  width: 100%;
  accent-color: var(--accent);
  background: var(--bg-primary);
  height: 6px;
  border-radius: var(--radius-sm);
  outline: none;
}

/* Paleta Grid */
.palette-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 5px;
  margin-bottom: 12px;
}

.color-swatch {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: transform 0.15s ease, border-color var(--transition-fast);
}

.color-swatch:hover {
  transform: scale(1.15);
  z-index: 2;
  border-color: #ffffff;
}

.color-swatch.active {
  transform: scale(1.15);
  border: 2px solid var(--accent);
  box-shadow: 0 0 6px var(--accent);
}

/* Selector Color */
.custom-color-picker {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  padding: 8px;
  border-radius: var(--radius-md);
}

.picker-label {
  font-size: 0.68rem;
  color: var(--text-secondary);
}

.picker-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.breeze-color-input {
  width: 36px;
  height: 26px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.color-hex-val {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--text-primary);
}

/* Acciones sección */
.actions-section {
  border-top: 1px solid var(--border-color);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-icon {
  width: 14px;
  height: 14px;
}

.clear-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.clear-btn:hover {
  background: rgba(237, 21, 21, 0.1);
  border-color: var(--danger);
  color: var(--danger);
}

.save-btn {
  background: var(--accent);
  border: 1px solid var(--accent);
  color: #ffffff;
}

.save-btn:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

/* ÁREA DE LIENZO */
.paint-canvas-area {
  flex: 1;
  background: #08080a;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  background: #ffffff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-window), 0 0 20px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.paint-canvas {
  display: block;
  cursor: crosshair;
  background: transparent;
}

/* MODAL DE GUARDAR */
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.breeze-modal {
  width: 400px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-popup);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-titlebar);
}

.modal-title-icon {
  width: 18px;
  height: 18px;
  color: var(--accent);
}

.modal-header h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--text-primary);
  flex: 1;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.close-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.breeze-input {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 10px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.8rem;
  outline: none;
  transition: all var(--transition-fast);
}

.breeze-input:focus {
  border-color: var(--accent);
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: var(--bg-titlebar);
}

.modal-btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.modal-btn.cancel {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.modal-btn.cancel:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-btn.confirm {
  background: var(--accent);
  border: 1px solid var(--accent);
  color: #ffffff !important;
}

.modal-btn.confirm:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

/* TOAST */
.breeze-toast {
  position: absolute;
  bottom: 24px;
  right: 24px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 12px 20px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-popup);
  font-size: 0.78rem;
  font-weight: bold;
  z-index: 2000;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
