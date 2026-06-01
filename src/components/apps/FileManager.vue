<template>
  <div class="explorer-container">
    <!-- Barra superior de navegación / dirección -->
    <header class="explorer-header">
      <div class="nav-controls">
        <button
          class="nav-btn"
          :disabled="currentPath === 'Inicio'"
          @click="goBack"
          title="Subir de nivel"
        >
          <ArrowLeftIcon class="control-icon" />
        </button>
      </div>

      <!-- Barra de ruta / migas de pan -->
      <div class="breadcrumb-bar" role="navigation" aria-label="Ruta de archivos">
        <span class="root-crumb">Sistema</span>
        <span class="crumb-separator">/</span>
        <span
          class="crumb-link"
          :class="{ 'active-crumb': currentPath === 'Inicio' }"
          @click="currentPath = 'Inicio'"
        >
          Inicio
        </span>
        <template v-if="currentPath !== 'Inicio'">
          <span class="crumb-separator">/</span>
          <span class="crumb-link active-crumb">{{ currentPath }}</span>
        </template>
      </div>

      <!-- Control de Acciones y Operaciones de Archivos -->
      <div class="action-controls">
        <button
          class="action-btn btn-danger"
          :disabled="!selectedItemName"
          @click="deleteSelectedItem"
          title="Eliminar elemento"
        >
          <TrashIcon class="action-icon" />
          <span>Eliminar</span>
        </button>
        <button
          class="action-btn btn-accent"
          :disabled="!selectedItemName"
          @click="showMoveModal = true"
          title="Mover elemento"
        >
          <MoveIcon class="action-icon" />
          <span>Mover</span>
        </button>
      </div>
    </header>

    <div class="explorer-body">
      <!-- Sidebar izquierdo (GNOME Nautilus Style) -->
      <aside class="explorer-sidebar">
        <button
          v-for="dest in destinations"
          :key="dest.id"
          class="sidebar-dest-btn"
          :class="{ 'active-dest': currentPath === dest.id }"
          @click="currentPath = dest.id"
        >
          <component :is="dest.icon" class="dest-icon" />
          <span class="dest-text">{{ dest.label }}</span>
        </button>
      </aside>

      <!-- Panel principal (Grid de archivos) -->
      <main class="explorer-main-view" @contextmenu.prevent="handleEmptyAreaContextMenu">
        <div class="files-grid">
          <div
            v-for="item in currentFiles"
            :key="item.name"
            class="grid-item"
            :class="{ 'item-dir': item.type === 'dir', 'item-file': item.type === 'file' }"
            @dblclick="handleItemAction(item)"
            @click="selectedItemName = item.name"
            @contextmenu.prevent.stop="handleItemContextMenu($event, item)"
            :aria-selected="selectedItemName === item.name"
            role="button"
            tabindex="0"
          >
            <!-- Icono según tipo de archivo -->
            <div class="item-icon-wrapper">
              <FolderIcon v-if="item.type === 'dir'" class="item-icon folder-icon" />
              <component :is="getFileIcon(item.name)" v-else class="item-icon file-icon" />
            </div>

            <!-- Nombre y detalles -->
            <span class="item-name" :title="item.name">{{ item.name }}</span>
            <span v-if="item.size" class="item-size">{{ item.size }}</span>
          </div>

          <!-- Carpeta vacía fallback -->
          <div v-if="currentFiles.length === 0" class="empty-folder-state">
            Carpeta vacía
          </div>
        </div>
      </main>
    </div>

    <!-- Barra de estado inferior -->
    <footer class="explorer-footer">
      <span>{{ currentFiles.length }} elementos en esta carpeta</span>
      <span v-if="selectedItemName" class="selection-status">Seleccionado: {{ selectedItemName }}</span>
    </footer>

    <!-- ── MODAL OVERLAY: VISOR DE ARCHIVOS KATE / BREEZE ── -->
    <Transition name="preview-fade">
      <div v-if="activePreviewFile" class="preview-modal-overlay" @click.self="activePreviewFile = null">
        <div class="preview-modal-card">
          <!-- Header del Visor -->
          <header class="preview-header">
            <div class="preview-title-meta">
              <component :is="getFileIcon(activePreviewFile.name)" class="preview-header-icon" />
              <div>
                <h3 class="preview-filename">{{ activePreviewFile.name }}</h3>
                <span class="preview-filesize">Tamaño: {{ activePreviewFile.size || 'Desconocido' }}</span>
              </div>
            </div>
            <button class="preview-close-btn" @click="activePreviewFile = null" title="Cerrar visor">×</button>
          </header>

          <!-- Cuerpo del Visor según el tipo de archivo -->
          <main class="preview-body">
            <!-- Caso 1: Imágenes (.png, .jpg, .jpeg) -->
            <div v-if="isImageFile(activePreviewFile.name)" class="preview-image-container">
              <!-- Render de Fotos Reales de la Webcam -->
              <div v-if="activePreviewFile.dataUrl" class="real-media-frame">
                <img :src="activePreviewFile.dataUrl" alt="Foto capturada" class="real-media-element" />
              </div>

              <!-- Vectoriales Breeze por Defecto -->
              <div v-else class="breeze-canvas-frame">
                <div v-if="activePreviewFile.name === 'breeze-abstract.jpg'" class="breeze-pic breeze-abstract-pic">
                  <div class="breeze-circle c1"></div>
                  <div class="breeze-circle c2"></div>
                  <div class="breeze-circle c3"></div>
                </div>
                <div v-else-if="activePreviewFile.name === 'breeze-mountain.jpg'" class="breeze-pic breeze-mountain-pic">
                  <div class="mountain-peak p1"></div>
                  <div class="mountain-peak p2"></div>
                </div>
                <div v-else class="breeze-pic generic-pic">
                  <ImageIcon class="generic-pic-icon" />
                  <span>Vista Previa de Imagen</span>
                </div>
              </div>
            </div>

            <!-- Caso 1b: Videos Reales Grabados (.mp4 / .webm) -->
            <div v-else-if="isVideoFile(activePreviewFile.name)" class="preview-video-container">
              <div v-if="activePreviewFile.dataUrl" class="real-media-frame">
                <video controls autoplay :src="activePreviewFile.dataUrl" class="real-media-element"></video>
              </div>
              <div v-else class="breeze-pic generic-pic">
                <VideoIcon class="generic-pic-icon" />
                <span>Vista Previa de Video</span>
              </div>
            </div>

            <!-- Caso 2: Texto o JSON (.txt, .json) -->
            <div v-else-if="isTextFile(activePreviewFile.name)" class="preview-text-container">
              <pre class="preview-code-block"><code>{{ getMockTextContent(activePreviewFile.name) }}</code></pre>
            </div>

            <!-- Caso 3: Documento (.pdf o .docx) -->
            <div v-else-if="isDocFile(activePreviewFile.name)" class="preview-doc-container">
              <div class="hologram-document">
                <BookOpenIcon class="doc-holo-icon" />
                <h4>{{ activePreviewFile.name === 'proyecto-sistemas.pdf' ? 'PROYECTO: SISTEMAS DE OPERACIÓN' : 'ARQUITECTURA DE VUEUI' }}</h4>
                <div class="doc-holo-lines">
                  <p v-for="i in 4" :key="i" class="holo-text-line"></p>
                </div>
                <span class="holo-doc-badge">DOCUMENTO ENCRIPTADO HOLOGRÁFICO</span>
              </div>
            </div>

            <!-- Caso 4: Archivos binarios / ISO (.iso) -->
            <div v-else class="preview-binary-container">
              <div class="binary-card">
                <FileIcon class="binary-icon" />
                <h4>Imagen de Disco ISO del Sistema</h4>
                <div class="binary-hash-box">
                  <span class="hash-label">MD5:</span>
                  <span class="hash-value">5d41402abc4b2a76b9719d911017c592</span>
                </div>
                <button class="verify-btn" @click="simulateIsoVerification">Verificar Firma Digital</button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Transition>

    <!-- ── MODAL OVERLAY: MOVER ARCHIVO ── -->
    <Transition name="preview-fade">
      <div v-if="showMoveModal" class="preview-modal-overlay" @click.self="showMoveModal = false">
        <div class="move-modal-card">
          <header class="preview-header">
            <div class="preview-title-meta">
              <MoveIcon class="preview-header-icon" />
              <div>
                <h3 class="preview-filename">Mover elemento</h3>
                <span class="preview-filesize">Destino para: {{ selectedItemName }}</span>
              </div>
            </div>
            <button class="preview-close-btn" @click="showMoveModal = false">×</button>
          </header>
          <main class="move-modal-body">
            <p class="move-instruction">Elige la carpeta de destino para <strong>{{ selectedItemName }}</strong>:</p>
            <div class="move-destinations-list">
              <button
                v-for="dest in destinations"
                :key="dest.id"
                class="move-dest-row"
                :disabled="dest.id === currentPath"
                @click="moveSelectedItem(dest.id)"
              >
                <component :is="dest.icon" class="move-dest-icon" />
                <span>{{ dest.label }}</span>
              </button>
            </div>
          </main>
        </div>
      </div>
    </Transition>

    <!-- ── MODAL: NUEVA CARPETA (KDE BREEZE STYLE) ── -->
    <div v-if="showNewFolderModal" class="preview-modal-overlay" @click.self="showNewFolderModal = false">
      <div class="breeze-modal">
        <header class="modal-header">
          <FolderPlusIcon class="modal-title-icon" />
          <h3>CREAR NUEVA CARPETA</h3>
          <button type="button" class="close-btn" @click="showNewFolderModal = false">×</button>
        </header>
        <main class="modal-body">
          <div class="form-group">
            <label for="new-folder-name">Nombre de la carpeta:</label>
            <input 
              id="new-folder-name"
              type="text" 
              class="breeze-input" 
              v-model="newFolderName" 
              placeholder="Nueva Carpeta"
              @keyup.enter="confirmCreateFolder"
              autoFocus
            />
          </div>
        </main>
        <footer class="modal-footer">
          <button type="button" class="modal-btn cancel" @click="showNewFolderModal = false">Cancelar</button>
          <button type="button" class="modal-btn confirm" @click="confirmCreateFolder">Crear</button>
        </footer>
      </div>
    </div>

    <!-- ── MODAL: NUEVO ARCHIVO (KDE BREEZE STYLE) ── -->
    <div v-if="showNewFileModal" class="preview-modal-overlay" @click.self="showNewFileModal = false">
      <div class="breeze-modal">
        <header class="modal-header">
          <FilePlusIcon class="modal-title-icon" />
          <h3>CREAR NUEVO ARCHIVO</h3>
          <button type="button" class="close-btn" @click="showNewFileModal = false">×</button>
        </header>
        <main class="modal-body">
          <div class="form-group">
            <label for="new-file-name">Nombre del archivo (se creará como .txt si no tiene extensión):</label>
            <input 
              id="new-file-name"
              type="text" 
              class="breeze-input" 
              v-model="newFileName" 
              placeholder="nuevo_archivo"
              @keyup.enter="confirmCreateFile"
              autoFocus
            />
          </div>
        </main>
        <footer class="modal-footer">
          <button type="button" class="modal-btn cancel" @click="showNewFileModal = false">Cancelar</button>
          <button type="button" class="modal-btn confirm" @click="confirmCreateFile">Crear</button>
        </footer>
      </div>
    </div>

    <!-- ── MENÚ CONTEXTUAL (KDE BREEZE STYLE) ── -->
    <div
      v-if="contextMenu.show"
      class="breeze-context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <!-- Click derecho en elemento -->
      <template v-if="contextMenu.targetItem">
        <button type="button" class="context-item" @click="openContextItem">
          <component :is="contextMenu.targetItem.type === 'dir' ? FolderIcon : FileIcon" class="context-icon" />
          <span>Abrir</span>
        </button>
        <button type="button" class="context-item" @click="moveContextItem">
          <MoveIcon class="context-icon" />
          <span>Mover</span>
        </button>
        <button type="button" class="context-item item-danger" @click="deleteContextItem">
          <TrashIcon class="context-icon" />
          <span>Eliminar</span>
        </button>
      </template>

      <!-- Click derecho en área vacía -->
      <template v-else>
        <button type="button" class="context-item" @click="triggerNewFolder">
          <FolderPlusIcon class="context-icon" />
          <span>Nueva carpeta...</span>
        </button>
        <button type="button" class="context-item" @click="triggerNewFile">
          <FilePlusIcon class="context-icon" />
          <span>Nuevo archivo...</span>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useOSStore } from '@/stores/osStore';
import { SYSTEM_APPS } from '@/registry/apps';
import { useProductivityStore } from '@/stores/productivityStore';
import {
  Folder as FolderIcon,
  File as FileIcon,
  FileText as FileTextIcon,
  Image as ImageIcon,
  ArrowLeft as ArrowLeftIcon,
  Home as HomeIcon,
  Download as DownloadIcon,
  BookOpen as BookOpenIcon,
  Video as VideoIcon,
  FolderPlus as FolderPlusIcon,
  FilePlus as FilePlusIcon,
  Trash as TrashIcon,
  Move as MoveIcon
} from 'lucide-vue-next';

const osStore = useOSStore();

// Menú contextual state
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  targetItem: null as any
});

function handleEmptyAreaContextMenu(e: MouseEvent) {
  contextMenu.value.x = e.clientX;
  contextMenu.value.y = e.clientY;
  contextMenu.value.targetItem = null;
  contextMenu.value.show = true;
  
  window.addEventListener('click', closeContextMenu);
}

function handleItemContextMenu(e: MouseEvent, item: any) {
  selectedItemName.value = item.name;
  contextMenu.value.x = e.clientX;
  contextMenu.value.y = e.clientY;
  contextMenu.value.targetItem = item;
  contextMenu.value.show = true;
  
  window.addEventListener('click', closeContextMenu);
}

function closeContextMenu() {
  contextMenu.value.show = false;
  window.removeEventListener('click', closeContextMenu);
}

function openContextItem() {
  if (contextMenu.value.targetItem) {
    handleItemAction(contextMenu.value.targetItem);
  }
}

function moveContextItem() {
  if (contextMenu.value.targetItem) {
    selectedItemName.value = contextMenu.value.targetItem.name;
    showMoveModal.value = true;
  }
}

function deleteContextItem() {
  if (contextMenu.value.targetItem) {
    selectedItemName.value = contextMenu.value.targetItem.name;
    deleteSelectedItem();
  }
}

// Ruta interna actual
const currentPath = ref('Inicio');
const selectedItemName = ref<string | null>(null);

// Modal para mover archivos
const showMoveModal = ref(false);

// Modales para creación de archivos y carpetas
const showNewFolderModal = ref(false);
const showNewFileModal = ref(false);
const newFolderName = ref('');
const newFileName = ref('');

// Archivo actualmente en vista previa
const activePreviewFile = ref<FileItem | null>(null);

// Destinos rápidos del sidebar
const destinations = [
  { id: 'Inicio', label: 'Inicio', icon: HomeIcon },
  { id: 'Descargas', label: 'Descargas', icon: DownloadIcon },
  { id: 'Documentos', label: 'Documentos', icon: BookOpenIcon },
  { id: 'Imágenes', label: 'Imágenes', icon: ImageIcon }
];

interface FileItem {
  name: string;
  type: 'dir' | 'file';
  size?: string;
  dataUrl?: string;
}

// Computado de archivos de la ruta actual extraídos reactivamente del Pinia store unificado
const currentFiles = computed(() => {
  return osStore.fileSystem[currentPath.value] || [];
});

// Selector de iconos según la extensión del archivo
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'txt':
    case 'json':
      return FileTextIcon;
    case 'png':
    case 'jpg':
    case 'jpeg':
      return ImageIcon;
    case 'mp4':
    case 'webm':
      return VideoIcon;
    default:
      return FileIcon;
  }
}

function isImageFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['png', 'jpg', 'jpeg'].includes(ext || '');
}

function isVideoFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['mp4', 'webm'].includes(ext || '');
}

function isTextFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['txt', 'json'].includes(ext || '');
}

function isDocFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['pdf', 'docx'].includes(ext || '');
}

function getMockTextContent(filename: string): string {
  if (filename === 'bitacora-desarrollo.txt') {
    return `[2026-05-22 22:45] - Inicialización del Kernel VueOS completada con éxito.
[2026-05-22 22:50] - daemon de Go escuchando en ws://127.0.0.1:8080.
[2026-05-22 23:00] - Compilación del frontend Vue 3 exitosa (1792 módulos).
[2026-05-22 23:05] - Commited all core assets to Git repository.
[2026-05-22 23:10] - Cargada la telemetría en tiempo real en SystemMonitor.`;
  }
  if (filename === 'config.json') {
    return `{
  "system": {
    "name": "VueOS",
    "version": "2.0.0-KDE",
    "kernel": "Go-Daemon-1.4.0",
    "gui": "Vue3-CompositionAPI"
  },
  "display": {
    "theme": "Breeze-Dark",
    "resolution": "1920x1080",
    "animations": true
  }
}`;
  }
  return '// Sin vista previa de texto disponible.';
}

function simulateIsoVerification() {
  alert('Iniciando verificación holográfica del sector boot... \nFirma digital de VueOS verificada: 100% CORRECTO.');
}

// Retroceder de nivel
function goBack() {
  if (currentPath.value !== 'Inicio') {
    currentPath.value = 'Inicio';
    selectedItemName.value = null;
  }
}

// Acciones sobre archivos / doble click - Abre en el programa correspondiente
function handleItemAction(item: FileItem) {
  selectedItemName.value = null;
  if (item.type === 'dir') {
    // Entrar a la carpeta
    currentPath.value = item.name;
  } else {
    const nameLower = item.name.toLowerCase();
    
    if (nameLower.endsWith('.txt')) {
      // 1. Caso: Editor de Notas
      const notesApp = SYSTEM_APPS.find(app => app.id === 'notes');
      if (notesApp) {
        const productivityStore = useProductivityStore();
        const cleanName = item.name.slice(0, -4);
        const parts = cleanName.split('-');
        const idPart = parts.length > 1 ? parts[parts.length - 1] : '';
        const titlePart = parts.length > 1 ? parts.slice(0, -1).join('-') : cleanName;
        
        let note = productivityStore.notes.find(n => n.id === `${idPart}-virtual-id`);
        if (!note) {
          note = productivityStore.notes.find(n => n.title === titlePart);
        }
        
        if (!note) {
          const newId = idPart.length === 4 ? `${idPart}-virtual-id` : crypto.randomUUID();
          note = {
            id: newId,
            title: titlePart || 'Nota',
            content: item.content || '',
            updatedAt: new Date().toISOString()
          };
          productivityStore.notes.push(note);
        }
        
        productivityStore.activeNoteId = note.id;
        osStore.openWindow(notesApp);
      }
    } else if (nameLower.endsWith('.docx') || nameLower.endsWith('.xlsx') || nameLower.endsWith('.pdf')) {
      // 2. Caso: Suite de Oficina (DOCX, XLSX o PDF)
      const officeApp = SYSTEM_APPS.find(app => app.id === 'office');
      if (officeApp) {
        osStore.activeOpenFile = {
          name: item.name,
          folder: currentPath.value,
          dataUrl: item.dataUrl || item.content
        };
        osStore.openWindow(officeApp);
      }
    } else if (
      nameLower.endsWith('.js') ||
      nameLower.endsWith('.ts') ||
      nameLower.endsWith('.html') ||
      nameLower.endsWith('.css') ||
      nameLower.endsWith('.json') ||
      nameLower.endsWith('.py') ||
      nameLower.endsWith('.go') ||
      nameLower.endsWith('.sh') ||
      nameLower.endsWith('.md') ||
      nameLower.endsWith('.vue') ||
      nameLower.endsWith('.c') ||
      nameLower.endsWith('.cpp') ||
      nameLower.endsWith('.h') ||
      nameLower.endsWith('.hpp') ||
      nameLower.endsWith('.xml') ||
      nameLower.endsWith('.yaml') ||
      nameLower.endsWith('.yml') ||
      nameLower.endsWith('.rs') ||
      nameLower.endsWith('.java') ||
      nameLower.endsWith('.kt') ||
      nameLower.endsWith('.cs') ||
      nameLower.endsWith('.sql')
    ) {
      // 2.5 Caso: Kate (KateApp)
      const kateApp = SYSTEM_APPS.find(app => app.id === 'kate');
      if (kateApp) {
        osStore.activeOpenFile = {
          name: item.name,
          folder: currentPath.value,
          dataUrl: item.dataUrl || item.content
        };
        osStore.openWindow(kateApp);
      }
    } else if (nameLower.endsWith('.mp3')) {
      // 3. Caso: Elisa Player
      const playerApp = SYSTEM_APPS.find(app => app.id === 'elisaplayer');
      if (playerApp) {
        osStore.activeOpenFile = {
          name: item.name,
          folder: currentPath.value,
          dataUrl: item.dataUrl
        };
        osStore.openWindow(playerApp);
      }
    } else {
      // Fallback: abrir barra lateral de vista previa
      activePreviewFile.value = item;
    }
  }
}

// ---- OPERACIONES DE ARCHIVOS ----

function triggerNewFolder() {
  newFolderName.value = '';
  showNewFolderModal.value = true;
}

function confirmCreateFolder() {
  const name = newFolderName.value.trim();
  if (!name) return;

  const folderContent = osStore.fileSystem[currentPath.value] || [];
  if (folderContent.some(item => item.name.toLowerCase() === name.toLowerCase())) {
    alert('Ya existe un elemento con ese nombre.');
    return;
  }

  osStore.addFileToFolder(currentPath.value, {
    name,
    type: 'dir'
  });

  if (!osStore.fileSystem[name]) {
    osStore.fileSystem[name] = [];
  }

  showNewFolderModal.value = false;
}

function triggerNewFile() {
  newFileName.value = '';
  showNewFileModal.value = true;
}

function confirmCreateFile() {
  const name = newFileName.value.trim();
  if (!name) return;
  let cleanName = name;
  if (!cleanName.includes('.')) cleanName += '.txt';

  const folderContent = osStore.fileSystem[currentPath.value] || [];
  if (folderContent.some(item => item.name.toLowerCase() === cleanName.toLowerCase())) {
    alert('Ya existe un archivo con ese nombre.');
    return;
  }

  osStore.addFileToFolder(currentPath.value, {
    name: cleanName,
    type: 'file',
    size: '1 KB',
    dataUrl: 'data:text/plain;base64,QmllbnZlbmlkbyBhIFZ1ZU9TIQ=='
  });

  showNewFileModal.value = false;
}

// Elimina el archivo o carpeta seleccionada
function deleteSelectedItem() {
  if (!selectedItemName.value) return;
  const name = selectedItemName.value;
  if (!confirm(`¿Estás seguro de que deseas eliminar "${name}"?`)) return;

  osStore.removeFileFromFolder(currentPath.value, name);

  selectedItemName.value = null;
}

// Mueve el archivo seleccionado a otra carpeta principal
function moveSelectedItem(targetFolder: string) {
  if (!selectedItemName.value) return;
  const name = selectedItemName.value;

  if (targetFolder === currentPath.value) {
    alert('El elemento ya se encuentra en esa carpeta.');
    return;
  }

  const sourceContent = osStore.fileSystem[currentPath.value] || [];
  const itemToMove = sourceContent.find(item => item.name === name);

  if (!itemToMove) return;

  const destContent = osStore.fileSystem[targetFolder] || [];
  if (destContent.some(item => item.name.toLowerCase() === name.toLowerCase())) {
    alert(`Ya existe un elemento llamado "${name}" en la carpeta "${targetFolder}".`);
    return;
  }

  // Eliminar de origen
  osStore.removeFileFromFolder(currentPath.value, name);

  // Añadir a destino
  osStore.addFileToFolder(targetFolder, itemToMove);

  selectedItemName.value = null;
  showMoveModal.value = false;
}
</script>

<style scoped>
.explorer-container {
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

/* Barra Superior Navegación */
.explorer-header {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 48px;
  padding: 0 16px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

/* Controles de Acción Superior */
.action-controls {
  margin-left: auto;
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 6px 12px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--border-hover);
  color: var(--accent);
}

.action-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-danger:hover:not(:disabled) {
  background: rgba(237, 21, 21, 0.15) !important;
  border-color: var(--danger) !important;
  color: var(--danger) !important;
}

.btn-accent:hover:not(:disabled) {
  background: var(--bg-active) !important;
  border-color: var(--accent) !important;
  color: var(--accent) !important;
}

.action-icon {
  width: 14px;
}

.move-modal-card {
  width: 100%;
  max-width: 360px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: var(--shadow-popup);
  overflow: hidden;
}

.move-modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.move-instruction {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.move-destinations-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.move-dest-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.move-dest-row:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--accent);
  color: var(--accent);
}

.move-dest-row:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.move-dest-icon {
  width: 16px;
  height: 16px;
}

.nav-controls {
  display: flex;
  align-items: center;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--accent);
  color: var(--accent);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.control-icon {
  width: 16px;
  height: 16px;
}

/* Migas de Pan / Breadcrumbs */
.breadcrumb-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.root-crumb {
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
}

.crumb-separator {
  color: rgba(255, 255, 255, 0.2);
}

.crumb-link {
  color: rgba(255, 255, 255, 0.65);
  cursor: pointer;
  font-weight: 500;
  transition: color 0.2s ease;
}

.crumb-link:hover {
  color: var(--accent);
}

.active-crumb {
  color: var(--accent);
  font-weight: 600;
}

/* Cuerpo Principal */
.explorer-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar KDE Dolphin Style */
.explorer-sidebar {
  width: 170px;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 16px 8px;
  gap: 4px;
}

.sidebar-dest-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sidebar-dest-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.active-dest {
  background: var(--bg-active) !important;
  color: var(--accent) !important;
  border-color: rgba(61, 174, 233, 0.2) !important;
}

.dest-icon {
  width: 16px;
  height: 16px;
}

/* Vista principal de Archivos */
.explorer-main-view {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 20px;
}

/* Item de la Rejilla */
.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 6px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.grid-item:hover {
  background: var(--bg-hover);
  border-color: rgba(61, 174, 233, 0.15);
}

.grid-item:focus,
.grid-item[aria-selected="true"] {
  background: var(--bg-active);
  border-color: var(--accent);
}

.item-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
}

.item-icon {
  width: 38px;
  height: 38px;
  transition: transform 0.2s ease;
}

.grid-item:hover .item-icon {
  transform: scale(1.05);
}

.folder-icon {
  color: var(--accent);
}

.file-icon {
  color: var(--text-secondary);
}

.item-name {
  font-size: 0.8rem;
  color: var(--text-primary);
  text-align: center;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.grid-item[aria-selected="true"] .item-name {
  color: var(--accent);
  font-weight: 500;
}

.item-size {
  font-size: 0.7rem;
  color: var(--text-disabled);
}

.empty-folder-state {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--text-disabled);
  font-size: 0.85rem;
  padding: 40px 0;
}

/* Footer Barra de Estado */
.explorer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 28px;
  padding: 0 16px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.selection-status {
  color: var(--accent);
}

/* ── MODAL OVERLAY: VISOR DE ARCHIVOS KATE / BREEZE ── */
.preview-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(27, 30, 32, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 1000;
}

.preview-modal-card {
  width: 100%;
  max-width: 580px;
  height: 80%;
  max-height: 420px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: var(--shadow-popup);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: var(--bg-titlebar);
  border-bottom: 1px solid var(--border-color);
}

.preview-title-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-header-icon {
  width: 24px;
  height: 24px;
  color: var(--accent);
}

.preview-filename {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-filesize {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.preview-close-btn {
  background: transparent;
  border: none;
  font-size: 1.6rem;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s ease;
}

.preview-close-btn:hover {
  color: #f43f5e;
}

.preview-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: rgba(10, 15, 30, 0.2);
}

/* Contenedores por tipo de archivo */
.preview-image-container,
.preview-video-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.real-media-frame {
  width: 100%;
  max-width: 480px;
  height: 260px;
  background: #020617;
  border: 1px solid rgba(34, 211, 238, 0.25);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.real-media-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.breeze-canvas-frame {
  width: 100%;
  max-width: 480px;
  height: 260px;
  background: var(--bg-primary);
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Dibujos Breeze simulados */
.breeze-pic {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* Escena de Fondos Breeze */
.breeze-abstract-pic {
  background: linear-gradient(to bottom, #1b1e20 0%, #2a2e32 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.breeze-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent) 30%, transparent 70%);
  opacity: 0.6;
}

.breeze-mountain-pic {
  background: linear-gradient(to bottom, #2a2e32 0%, #1b1e20 100%);
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.mountain-peak {
  width: 120px;
  height: 120px;
  background: #31363b;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  border-top: 2px solid var(--accent);
  opacity: 0.8;
}

.p1 { transform: translateX(30px); }
.p2 { transform: translateX(-30px); opacity: 0.5; height: 90px; }

/* Genéricos y otros */
.generic-pic {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-secondary);
}

.generic-pic-icon {
  width: 48px;
  height: 48px;
  color: var(--accent);
}

/* Visor de Texto */
.preview-text-container {
  width: 100%;
  height: 100%;
}

.preview-code-block {
  width: 100%;
  height: 100%;
  min-height: 260px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 16px;
  overflow: auto;
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-primary);
  line-height: 1.5;
  text-align: left;
}

/* Visor Documento */
.preview-doc-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hologram-document {
  width: 100%;
  max-width: 400px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 24px;
  text-align: center;
  box-shadow: var(--shadow-subtle);
}

.doc-holo-icon {
  width: 40px;
  height: 40px;
  color: var(--accent);
  margin-bottom: 12px;
}

.hologram-document h4 {
  font-size: 0.95rem;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.doc-holo-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.holo-text-line {
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
}

.holo-text-line:nth-child(even) {
  width: 70%;
  margin: 0 auto;
}

.holo-doc-badge {
  font-size: 0.7rem;
  font-weight: bold;
  color: var(--accent);
  letter-spacing: 0.5px;
}

/* Visor Binario / ISO */
.preview-binary-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.binary-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 24px;
  text-align: center;
  max-width: 380px;
  box-shadow: var(--shadow-subtle);
}

.binary-icon {
  width: 44px;
  height: 44px;
  color: var(--accent);
  margin-bottom: 14px;
}

.binary-card h4 {
  font-size: 1rem;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.binary-hash-box {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px 12px;
  display: flex;
  gap: 8px;
  font-family: monospace;
  font-size: 0.75rem;
  margin-bottom: 20px;
}

.hash-label {
  color: var(--text-secondary);
}

.hash-value {
  color: var(--accent);
}

.verify-btn {
  padding: 8px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.verify-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
  color: var(--accent);
}

/* Transiciones */
.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.25s ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}

.preview-fade-enter-active .preview-modal-card {
  animation: pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes pop-in {
  from {
    transform: scale(0.95) translateY(10px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
/* BREEZE SOLID MODAL */
.breeze-modal {
  width: 420px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-popup);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
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
  font-size: 1.2rem;
  line-height: 1;
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

/* ── MENÚ CONTEXTUAL (KDE BREEZE STYLE) ── */
.breeze-context-menu {
  position: fixed;
  background: #232629;
  border: 1px solid #31363b;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  padding: 4px 0;
  min-width: 150px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
}

.context-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: #eff0f1;
  font-family: inherit;
  font-size: 0.76rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.context-item:hover {
  background: #3daee9;
  color: #ffffff;
}

.context-item.item-danger:hover {
  background: #da4453;
  color: #ffffff;
}

.context-icon {
  width: 14px;
  height: 14px;
  opacity: 0.85;
}
</style>
