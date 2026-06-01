<template>
  <Transition name="dialog-fade">
    <div v-if="show" class="save-dialog-overlay" @click.self="cancel">
      <div class="save-dialog-card">
        <!-- Barra de Título (KDE Breeze Style) -->
        <header class="dialog-header">
          <div class="header-left">
            <SaveIcon class="header-icon" />
            <h3>{{ title }}</h3>
          </div>
          <button type="button" class="close-btn" @click="cancel">×</button>
        </header>

        <!-- Barra de Navegación del Diálogo -->
        <div class="dialog-navbar">
          <button
            type="button"
            class="nav-btn"
            :disabled="currentPath === 'Inicio'"
            @click="goBack"
            title="Subir de nivel"
          >
            <ArrowLeftIcon class="nav-icon" />
          </button>
          
          <div class="dialog-breadcrumb">
            <span class="crumb" @click="navigateTo('Inicio')">Inicio</span>
            <span v-if="currentPath !== 'Inicio'" class="separator">/</span>
            <span v-if="currentPath !== 'Inicio'" class="crumb active">{{ currentPath }}</span>
          </div>
        </div>

        <!-- Cuerpo del Diálogo -->
        <div class="dialog-body">
          <!-- Sidebar con destinos del sistema -->
          <aside class="dialog-sidebar">
            <button
              v-for="dest in destinations"
              :key="dest.id"
              type="button"
              class="sidebar-btn"
              :class="{ active: currentPath === dest.id }"
              @click="navigateTo(dest.id)"
            >
              <component :is="dest.icon" class="sidebar-icon" />
              <span>{{ dest.label }}</span>
            </button>
          </aside>

          <!-- Listado de Archivos/Carpetas del directorio actual -->
          <main class="dialog-explorer-area" @contextmenu.prevent="handleContextMenu($event, null)">
            <div class="explorer-grid">
              <!-- Grid Items -->
              <div
                v-for="item in currentFiles"
                :key="item.name"
                class="grid-item"
                :class="{ 'item-dir': item.type === 'dir', 'item-file': item.type === 'file' }"
                @click="handleItemClick(item)"
                @dblclick="handleItemDblClick(item)"
                @contextmenu.prevent.stop="handleContextMenu($event, item)"
              >
                <div class="item-icon-wrapper">
                  <FolderIcon v-if="item.type === 'dir'" class="item-icon folder" />
                  <component :is="getFileIcon(item.name)" v-else class="item-icon file" />
                </div>
                <span class="item-name" :title="item.name">{{ item.name }}</span>
              </div>

              <!-- Empty state -->
              <div v-if="currentFiles.length === 0" class="empty-state">
                Carpeta vacía
              </div>
            </div>
          </main>
        </div>

        <!-- Footer / Configuración de Guardado -->
        <footer class="dialog-footer">
          <div class="save-form">
            <div class="form-row">
              <label for="save-dialog-filename">Nombre:</label>
              <input
                id="save-dialog-filename"
                type="text"
                class="breeze-input filename-input"
                v-model="filenameInput"
                placeholder="Nombre del archivo"
                @keyup.enter="confirmSave"
                ref="filenameInputRef"
              />
            </div>
            <div class="form-row">
              <label>Tipo:</label>
              <select class="breeze-select" disabled>
                <option>{{ filterLabel }}</option>
              </select>
            </div>
          </div>

          <div class="dialog-actions">
            <button type="button" class="breeze-btn cancel" @click="cancel">Cancelar</button>
            <button type="button" class="breeze-btn save" @click="confirmSave">Guardar</button>
          </div>
        </footer>

        <!-- ── MENÚ CONTEXTUAL EN DIÁLOGO (KDE BREEZE STYLE) ── -->
        <div
          v-if="contextMenu.show"
          class="dialog-context-menu"
          :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        >
          <!-- Si es click derecho sobre un item -->
          <template v-if="contextMenu.targetItem">
            <!-- Si es una carpeta -->
            <button
              v-if="contextMenu.targetItem.type === 'dir'"
              type="button"
              class="context-item item-danger"
              @click="deleteItem(contextMenu.targetItem)"
            >
              <TrashIcon class="context-icon" />
              <span>Eliminar Carpeta</span>
            </button>
            
            <!-- Si es un archivo -->
            <button
              v-else
              type="button"
              class="context-item item-danger"
              @click="deleteItem(contextMenu.targetItem)"
            >
              <TrashIcon class="context-icon" />
              <span>Eliminar Archivo</span>
            </button>
          </template>
          
          <!-- Si es click derecho en zona vacía -->
          <template v-else>
            <button type="button" class="context-item" @click="triggerNewFolder">
              <FolderPlusIcon class="context-icon" />
              <span>Nueva carpeta...</span>
            </button>
          </template>
        </div>

        <!-- ── MODAL INTERNO DE CREACIÓN DE CARPETA ── -->
        <div v-if="showNewFolderModal" class="inner-modal-overlay" @click.self="showNewFolderModal = false">
          <div class="inner-breeze-modal">
            <header class="inner-modal-header">
              <FolderPlusIcon class="inner-modal-title-icon" />
              <h3>CREAR NUEVA CARPETA</h3>
              <button type="button" class="inner-close-btn" @click="showNewFolderModal = false">×</button>
            </header>
            <main class="inner-modal-body">
              <div class="inner-form-group">
                <label for="inner-new-folder-name">Nombre de la carpeta:</label>
                <input 
                  id="inner-new-folder-name"
                  type="text" 
                  class="breeze-input" 
                  v-model="newFolderName" 
                  placeholder="Nueva Carpeta"
                  @keyup.enter="confirmCreateFolder"
                  autoFocus
                />
              </div>
            </main>
            <footer class="inner-modal-footer">
              <button type="button" class="inner-modal-btn cancel" @click="showNewFolderModal = false">Cancelar</button>
              <button type="button" class="inner-modal-btn confirm" @click="confirmCreateFolder">Crear</button>
            </footer>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useOSStore } from '@/stores/osStore';
import {
  Save as SaveIcon,
  ArrowLeft as ArrowLeftIcon,
  Home as HomeIcon,
  FileText as FileTextIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  Folder as FolderIcon,
  File as FileIcon,
  FolderPlus as FolderPlusIcon,
  Trash as TrashIcon
} from 'lucide-vue-next';

interface Props {
  show: boolean;
  defaultFilename: string;
  extension: string; // ej: '.png', '.md', '.txt'
  title?: string;
  filterLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'GUARDAR COMO',
  filterLabel: 'Todos los archivos (*)'
});

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'save', payload: { folder: string; filename: string }): void;
  (e: 'cancel'): void;
}>();

const osStore = useOSStore();
const currentPath = ref('Inicio');
const filenameInput = ref(props.defaultFilename);
const filenameInputRef = ref<HTMLInputElement | null>(null);

// Sidebar destinations
const destinations = [
  { id: 'Inicio', label: 'Inicio', icon: HomeIcon },
  { id: 'Documentos', label: 'Documentos', icon: FileTextIcon },
  { id: 'Imágenes', label: 'Imágenes', icon: ImageIcon },
  { id: 'Descargas', label: 'Descargas', icon: DownloadIcon }
];

// Inner context menu state
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  targetItem: null as { name: string; type: 'dir' | 'file' } | null
});

const showNewFolderModal = ref(false);
const newFolderName = ref('');

function handleContextMenu(e: MouseEvent, item: { name: string; type: 'dir' | 'file' } | null = null) {
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

function deleteItem(item: { name: string; type: 'dir' | 'file' }) {
  if (currentPath.value) {
    osStore.removeFileFromFolder(currentPath.value, item.name);
  }
}

function triggerNewFolder() {
  newFolderName.value = '';
  showNewFolderModal.value = true;
}

function confirmCreateFolder() {
  const name = newFolderName.value.trim();
  if (!name) return;

  const folderContent = osStore.fileSystem[currentPath.value] || [];
  if (folderContent.some(item => item.name.toLowerCase() === name.toLowerCase())) {
    alert('Ya existe una carpeta con ese nombre.');
    return;
  }

  // Crear carpeta física y virtualmente
  osStore.addFileToFolder(currentPath.value, {
    name,
    type: 'dir'
  });

  const fullKey = currentPath.value === 'Inicio' ? name : `${currentPath.value}/${name}`;
  if (!osStore.fileSystem[fullKey]) {
    osStore.fileSystem[fullKey] = [];
  }

  showNewFolderModal.value = false;
}

// Focus filename input on open
watch(() => props.show, (newVal) => {
  if (newVal) {
    filenameInput.value = props.defaultFilename;
    if (props.extension === '.png') {
      currentPath.value = 'Imágenes';
    } else if (props.extension === '.md' || props.extension === '.txt') {
      currentPath.value = 'Documentos';
    } else {
      currentPath.value = 'Inicio';
    }
    nextTick(() => {
      filenameInputRef.value?.focus();
      filenameInputRef.value?.select();
    });
  }
});

// Reactively get files from central virtual filesystem
const currentFiles = computed(() => {
  return osStore.fileSystem[currentPath.value] || [];
});

function navigateTo(pathId: string) {
  currentPath.value = pathId;
}

function goBack() {
  if (currentPath.value !== 'Inicio') {
    const parts = currentPath.value.split('/');
    if (parts.length <= 1) {
      currentPath.value = 'Inicio';
    } else {
      parts.pop();
      currentPath.value = parts.join('/');
    }
  }
}

function handleItemClick(item: any) {
  if (item.type === 'file') {
    filenameInput.value = item.name;
  }
}

function handleItemDblClick(item: any) {
  if (item.type === 'dir') {
    currentPath.value = currentPath.value === 'Inicio' ? item.name : `${currentPath.value}/${item.name}`;
  }
}

// Icon helper
function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'svg'].includes(ext || '')) return ImageIcon;
  if (['txt', 'md', 'doc', 'docx'].includes(ext || '')) return FileTextIcon;
  return FileIcon;
}

function cancel() {
  emit('update:show', false);
  emit('cancel');
}

function confirmSave() {
  let name = filenameInput.value.trim();
  if (!name) return;

  if (!name.toLowerCase().endsWith(props.extension.toLowerCase())) {
    name += props.extension;
  }

  let targetFolder = currentPath.value;
  if (targetFolder === 'Inicio') {
    if (props.extension === '.png') targetFolder = 'Imágenes';
    else if (props.extension === '.md') targetFolder = 'Documentos';
    else targetFolder = 'Documentos';
  }

  emit('save', { folder: targetFolder, filename: name });
  emit('update:show', false);
}
</script>

<style scoped>
.save-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.save-dialog-card {
  width: 650px;
  height: 480px;
  background: #232629;
  border: 1px solid #31363b;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: system-ui, -apple-system, sans-serif;
  color: #eff0f1;
  position: relative;
}

/* Header */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #1b1e20;
  border-bottom: 1px solid #31363b;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-icon {
  width: 18px;
  height: 18px;
  color: #3daee9;
}
.dialog-header h3 {
  margin: 0;
  font-size: 0.85rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.close-btn {
  background: transparent;
  border: none;
  color: #bdc3c7;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1;
}
.close-btn:hover {
  background: rgba(237, 21, 21, 0.1);
  color: #e74c3c;
}

/* Navbar */
.dialog-navbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #2a2e32;
  border-bottom: 1px solid #31363b;
}
.nav-btn {
  background: transparent;
  border: 1px solid #31363b;
  border-radius: 4px;
  color: #eff0f1;
  padding: 4px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-btn:hover:not(:disabled) {
  background: #31363b;
  border-color: #3daee9;
}
.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.nav-icon {
  width: 14px;
  height: 14px;
}
.dialog-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #bdc3c7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.crumb {
  cursor: pointer;
}
.crumb:hover {
  color: #3daee9;
  text-decoration: underline;
}
.crumb.active {
  color: #eff0f1;
  font-weight: bold;
  cursor: default;
}
.crumb.active:hover {
  text-decoration: none;
  color: #eff0f1;
}
.separator {
  color: #7f8c8d;
}

/* Body */
.dialog-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Sidebar */
.dialog-sidebar {
  width: 160px;
  background: #1b1e20;
  border-right: 1px solid #31363b;
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 4px;
  overflow-y: auto;
}
.sidebar-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #bdc3c7;
  font-family: inherit;
  font-size: 0.78rem;
  text-align: left;
  cursor: pointer;
  width: 100%;
}
.sidebar-btn:hover {
  background: rgba(255, 255, 255, 0.03);
  color: #eff0f1;
}
.sidebar-btn.active {
  background: rgba(61, 174, 233, 0.15) !important;
  color: #3daee9 !important;
  font-weight: bold;
}
.sidebar-icon {
  width: 14px;
  height: 14px;
}

/* Explorer Grid */
.dialog-explorer-area {
  flex: 1;
  background: #232629;
  overflow-y: auto;
  padding: 16px;
}
.explorer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 16px;
}
.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  user-select: none;
}
.grid-item:hover {
  background: rgba(255, 255, 255, 0.04);
}
.item-icon-wrapper {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.item-icon {
  width: 38px;
  height: 38px;
}
.item-icon.folder {
  color: #eff0f1;
}
.item-icon.file {
  color: #7f8c8d;
}
.item-name {
  font-size: 0.72rem;
  text-align: center;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 100%;
}
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  color: #7f8c8d;
  font-size: 0.78rem;
  font-style: italic;
  padding-top: 48px;
}

/* Footer / Formulario */
.dialog-footer {
  padding: 12px 16px;
  background: #1b1e20;
  border-top: 1px solid #31363b;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.save-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.form-row label {
  font-size: 0.75rem;
  color: #bdc3c7;
  width: 60px;
  font-weight: bold;
}
.breeze-input {
  flex: 1;
  background: #232629;
  border: 1px solid #31363b;
  border-radius: 4px;
  padding: 6px 10px;
  color: #eff0f1;
  font-size: 0.78rem;
  outline: none;
  font-family: inherit;
}
.breeze-input:focus {
  border-color: #3daee9;
}
.breeze-select {
  flex: 1;
  background: #232629;
  border: 1px solid #31363b;
  border-radius: 4px;
  padding: 6px 10px;
  color: #eff0f1;
  font-size: 0.78rem;
  outline: none;
  font-family: inherit;
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.breeze-btn {
  padding: 6px 16px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.15s ease;
}
.breeze-btn.cancel {
  background: transparent;
  border: 1px solid #31363b;
  color: #bdc3c7;
}
.breeze-btn.cancel:hover {
  background: #2a2e32;
  color: #eff0f1;
}
.breeze-btn.save {
  background: #3daee9;
  border: 1px solid #3daee9;
  color: #ffffff;
}
.breeze-btn.save:hover {
  background: #1d99f3;
  border-color: #1d99f3;
}

/* ── MENÚ CONTEXTUAL EN DIÁLOGO ── */
.dialog-context-menu {
  position: fixed;
  background: #1b1e20;
  border: 1px solid #31363b;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  padding: 4px 0;
  min-width: 150px;
  z-index: 10005;
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

.context-icon {
  width: 14px;
  height: 14px;
  opacity: 0.85;
}

/* ── INNER MODAL OVERLAY ── */
.inner-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10010;
}

.inner-breeze-modal {
  width: 320px;
  background: #232629;
  border: 1px solid #31363b;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.inner-modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid #31363b;
  background: #1b1e20;
}

.inner-modal-title-icon {
  width: 16px;
  height: 16px;
  color: #3daee9;
}

.inner-modal-header h3 {
  margin: 0;
  font-size: 0.8rem;
  font-weight: bold;
  flex: 1;
}

.inner-close-btn {
  background: transparent;
  border: none;
  color: #bdc3c7;
  cursor: pointer;
}

.inner-modal-body {
  padding: 16px;
}

.inner-form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.inner-form-group label {
  font-size: 0.72rem;
  color: #bdc3c7;
}

.inner-modal-footer {
  padding: 12px;
  border-top: 1px solid #31363b;
  background: #1b1e20;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.inner-modal-btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.74rem;
  font-weight: bold;
  cursor: pointer;
}

.inner-modal-btn.cancel {
  background: transparent;
  border: 1px solid #31363b;
  color: #bdc3c7;
}

.inner-modal-btn.cancel:hover {
  background: #2a2e32;
  color: #eff0f1;
}

.inner-modal-btn.confirm {
  background: #3daee9;
  border: 1px solid #3daee9;
  color: #ffffff;
}

.inner-modal-btn.confirm:hover {
  background: #1d99f3;
}

/* Animations */
.dialog-fade-enter-active, .dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}
.dialog-fade-enter-from, .dialog-fade-leave-to {
  opacity: 0;
}
</style>
