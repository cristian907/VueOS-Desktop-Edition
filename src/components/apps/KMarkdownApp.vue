<template>
  <div class="obsidian-container">
    <!-- PANEL LATERAL: NAVEGADOR DE NOTAS .MD -->
    <aside class="obsidian-sidebar" @contextmenu.prevent="handleEmptyAreaContextMenu">
      <div class="sidebar-title">
        <BookOpenIcon class="sidebar-title-icon" />
        <span>KMARKDOWN (MD)</span>
      </div>

      <div class="notes-list">
        <!-- DOCUMENTOS -->
        <div class="folder-section" @contextmenu.prevent.stop="handleFolderContextMenu($event, 'Documentos')">
          <button type="button" class="folder-header" @click="toggleFolder('Documentos')">
            <span class="folder-chevron">{{ openFolders.Documentos ? '▼' : '▶' }}</span>
            <FolderIcon class="folder-icon" />
            <span class="folder-name">Documentos</span>
          </button>
          
          <div v-show="openFolders.Documentos" class="folder-content">
            <div v-if="mdDocumentTreeNodes.length === 0" class="no-files">Sin notas .md</div>
            
            <template v-for="node in mdDocumentTreeNodes" :key="node.path">
              <!-- Si es una carpeta -->
              <button
                v-if="node.type === 'dir'"
                type="button"
                class="tree-folder-header"
                :style="{ paddingLeft: (node.level * 12 + 8) + 'px' }"
                @click="toggleFolder(node.path)"
                @contextmenu.prevent.stop="handleFolderContextMenu($event, node.path)"
              >
                <span class="folder-chevron">{{ node.isOpen ? '▼' : '▶' }}</span>
                <FolderIcon class="folder-icon" />
                <span class="folder-name">{{ node.name }}</span>
              </button>
              
              <!-- Si es una nota .md -->
              <button
                v-else
                type="button"
                class="note-item"
                :class="{ active: currentFile && currentFile.name === node.name && currentFile.folder === node.parentPath }"
                :style="{ paddingLeft: (node.level * 12 + 24) + 'px' }"
                @click="selectFile({ name: node.name, folder: node.parentPath })"
                @contextmenu.prevent.stop="handleItemContextMenu($event, node.name, node.parentPath)"
              >
                <FileTextIcon class="note-icon" />
                <span class="note-name">{{ node.name }}</span>
              </button>
            </template>
          </div>
        </div>

        <!-- DESCARGAS -->
        <div class="folder-section" @contextmenu.prevent.stop="handleFolderContextMenu($event, 'Descargas')">
          <button type="button" class="folder-header" @click="toggleFolder('Descargas')">
            <span class="folder-chevron">{{ openFolders.Descargas ? '▼' : '▶' }}</span>
            <FolderIcon class="folder-icon" />
            <span class="folder-name">Descargas</span>
          </button>
          
          <div v-show="openFolders.Descargas" class="folder-content">
            <div v-if="mdDownloadTreeNodes.length === 0" class="no-files">Sin notas .md</div>
            
            <template v-for="node in mdDownloadTreeNodes" :key="node.path">
              <!-- Si es una carpeta -->
              <button
                v-if="node.type === 'dir'"
                type="button"
                class="tree-folder-header"
                :style="{ paddingLeft: (node.level * 12 + 8) + 'px' }"
                @click="toggleFolder(node.path)"
                @contextmenu.prevent.stop="handleFolderContextMenu($event, node.path)"
              >
                <span class="folder-chevron">{{ node.isOpen ? '▼' : '▶' }}</span>
                <FolderIcon class="folder-icon" />
                <span class="folder-name">{{ node.name }}</span>
              </button>
              
              <!-- Si es una nota .md -->
              <button
                v-else
                type="button"
                class="note-item"
                :class="{ active: currentFile && currentFile.name === node.name && currentFile.folder === node.parentPath }"
                :style="{ paddingLeft: (node.level * 12 + 24) + 'px' }"
                @click="selectFile({ name: node.name, folder: node.parentPath })"
                @contextmenu.prevent.stop="handleItemContextMenu($event, node.name, node.parentPath)"
              >
                <FileTextIcon class="note-icon" />
                <span class="note-name">{{ node.name }}</span>
              </button>
            </template>
          </div>
        </div>
      </div>

      <button type="button" class="new-note-btn" @click="showSaveDialog = true">
        <PlusIcon class="btn-icon" />
        <span>Nueva Nota MD</span>
      </button>
    </aside>

    <!-- PANEL CENTRAL: EDITOR Y VISTA PREVIA DIVIDIDA -->
    <main class="obsidian-main">
      <header class="obsidian-header" v-if="currentFile">
        <div class="active-note-meta">
          <FileTextIcon class="active-note-icon" />
          <span class="active-note-title">{{ currentFile.name }}</span>
          <span class="active-note-path">{{ currentFile.folder }}/</span>
          <span 
            class="save-status" 
            :class="isModified ? 'status-modified' : 'status-saved'"
          >
            {{ isModified ? '• Modificado' : '• Guardado' }}
          </span>
        </div>

        <div class="header-actions">
          <button type="button" class="breeze-btn save-btn" @click="saveFile" title="Guardar Cambios (Ctrl+S)">
            <SaveIcon class="btn-icon" />
            <span>Guardar</span>
          </button>
        </div>
      </header>

      <!-- Pantalla dividida (Editor a la izquierda, Vista previa a la derecha) -->
      <div class="workspace-split" v-if="currentFile">
        <!-- LADO IZQUIERDO: EDITOR RAW -->
        <div class="editor-pane">
          <textarea
            ref="textareaRef"
            class="obsidian-textarea"
            v-model="editorContent"
            @keydown="handleKeydown"
            placeholder="# Mi Nota de Markdown&#10;&#10;Escribe tu contenido aquí..."
            spellcheck="false"
          ></textarea>
        </div>

        <!-- LADO DERECHO: VISTA PREVIA RENDERIZADA -->
        <div class="preview-pane">
          <div class="markdown-preview" v-html="parsedMarkdown"></div>
        </div>
      </div>

      <!-- Pantalla de bienvenida vacía -->
      <div v-else class="welcome-screen">
        <BookOpenIcon class="welcome-logo" />
        <h3>KMarkdown - Markdown Vault</h3>
        <p>Editor enriquecido estilo Obsidian con renderizado de Live Preview en tiempo real y persistencia física en tu host.</p>
        
        <div class="welcome-actions">
          <button type="button" class="welcome-btn" @click="showSaveDialog = true">
            Crear Nota Nueva (.md)
          </button>
          <button
            v-if="markdownFiles.length > 0"
            type="button"
            class="welcome-btn secondary"
            @click="selectFile(markdownFiles[0])"
          >
            Abrir "{{ markdownFiles[0].name }}"
          </button>
        </div>
      </div>
    </main>

    <!-- DIÁLOGO INTERACTIVO DE GUARDAR COMO (KDE BREEZE STYLE) -->
    <FileSaveDialog
      v-model:show="showSaveDialog"
      :default-filename="saveFilename"
      extension=".md"
      title="GUARDAR NOTA MARKDOWN"
      filter-label="Documentos Markdown (*.md)"
      @save="handleSaveDialog"
    />

    <!-- MODAL NUEVA CARPETA (ESTILO SERIO KDE BREEZE) -->
    <div v-if="showNewFolderModal" class="modal-overlay" @click.self="showNewFolderModal = false">
      <div class="breeze-modal">
        <div class="modal-header">
          <FolderPlusIcon class="modal-title-icon" />
          <h3>CREAR NUEVA CARPETA</h3>
          <button type="button" class="close-btn" @click="showNewFolderModal = false">
            <XIcon />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="new-folder-name-kmd">Nombre de la carpeta:</label>
            <input 
              id="new-folder-name-kmd"
              type="text" 
              class="breeze-input" 
              v-model="newFolderName" 
              placeholder="ejemplo: backend"
              @keyup.enter="createNewFolder"
              autoFocus
            />
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="modal-btn cancel" @click="showNewFolderModal = false">Cancelar</button>
          <button type="button" class="modal-btn confirm" @click="createNewFolder">Crear Carpeta</button>
        </div>
      </div>
    </div>

    <!-- ── MENÚ CONTEXTUAL (KDE BREEZE STYLE) ── -->
    <div
      v-if="contextMenu.show"
      class="breeze-context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <!-- Click derecho en nota -->
      <template v-if="contextMenu.targetFile">
        <button type="button" class="context-item" @click="openContextFile">
          <FileTextIcon class="context-icon" />
          <span>Abrir Nota</span>
        </button>
        <button type="button" class="context-item item-danger" @click="deleteContextFile">
          <TrashIcon class="context-icon" />
          <span>Eliminar Nota</span>
        </button>
      </template>

      <!-- Click derecho en vacío de barra lateral o carpeta -->
      <template v-else>
        <button type="button" class="context-item" @click="triggerNewFile">
          <PlusIcon class="context-icon" />
          <span>Nueva Nota MD...</span>
        </button>
        <button type="button" class="context-item" @click="triggerNewFolder">
          <FolderPlusIcon class="context-icon" />
          <span>Nueva Carpeta...</span>
        </button>
        <!-- Si es una subcarpeta y no es una raíz del sistema, permitir borrarla -->
        <button
          v-if="contextMenu.targetFolder && contextMenu.targetFolder !== 'Documentos' && contextMenu.targetFolder !== 'Descargas'"
          type="button"
          class="context-item item-danger"
          @click="deleteContextFolder"
        >
          <TrashIcon class="context-icon" />
          <span>Eliminar Carpeta</span>
        </button>
      </template>
    </div>

    <!-- TOAST DE NOTIFICACIÓN -->
    <Transition name="fade">
      <div v-if="toastMessage" class="breeze-toast">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useOSStore } from '@/stores/osStore';
import FileSaveDialog from '@/components/ui/FileSaveDialog.vue';
import {
  BookOpen as BookOpenIcon,
  FileText as FileTextIcon,
  Plus as PlusIcon,
  Save as SaveIcon,
  Folder as FolderIcon,
  FolderPlus as FolderPlusIcon,
  Trash as TrashIcon,
  X as XIcon
} from 'lucide-vue-next';

const osStore = useOSStore();

interface NoteFile {
  name: string;
  folder: string;
  content?: string;
  dataUrl?: string;
}

// --- STATE ---
const currentFile = ref<NoteFile | null>(null);
const editorContent = ref('');
const originalContent = ref('');
const showSaveDialog = ref(false);
const saveFilename = ref('nueva_nota');
const toastMessage = ref('');

const showNewFolderModal = ref(false);
const newFolderName = ref('');

const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  targetFile: null as string | null,
  targetFolder: null as string | null
});

// --- STATE AND TREE BUILDER ---
const openFolders = ref<Record<string, boolean>>({
  Documentos: true,
  Descargas: true
});

function toggleFolder(path: string) {
  openFolders.value[path] = !openFolders.value[path];
}

interface TreeNode {
  path: string;
  name: string;
  type: 'file' | 'dir';
  level: number;
  parentPath: string;
  isOpen?: boolean;
}

// Recursive Tree Node Builder for MD files and folders containing them
function buildTreeNodes(folderKey: string, level = 0): TreeNode[] {
  const nodes: TreeNode[] = [];
  const items = osStore.fileSystem[folderKey] || [];
  
  const sortedItems = [...items].sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === 'dir' ? -1 : 1;
  });

  for (const item of sortedItems) {
    const itemPath = folderKey === 'Inicio' ? item.name : `${folderKey}/${item.name}`;
    
    if (item.type === 'file' && !item.name.toLowerCase().endsWith('.md')) {
      continue;
    }
    
    const node: TreeNode = {
      path: itemPath,
      name: item.name,
      type: item.type,
      level,
      parentPath: folderKey,
      isOpen: item.type === 'dir' ? !!openFolders.value[itemPath] : undefined
    };
    
    nodes.push(node);
    
    if (item.type === 'dir' && openFolders.value[itemPath]) {
      nodes.push(...buildTreeNodes(itemPath, level + 1));
    }
  }
  
  return nodes;
}

const mdDocumentTreeNodes = computed(() => {
  return buildTreeNodes('Documentos', 0);
});

const mdDownloadTreeNodes = computed(() => {
  return buildTreeNodes('Descargas', 0);
});

// Obtiene de forma reactiva los archivos .md desde Pinia
const markdownFiles = computed(() => {
  const findFiles = (nodes: TreeNode[]) => {
    return nodes.filter(n => n.type === 'file').map(n => ({ name: n.name, folder: n.parentPath }));
  };
  return [...findFiles(mdDocumentTreeNodes.value), ...findFiles(mdDownloadTreeNodes.value)];
});

const isModified = computed(() => {
  return editorContent.value !== originalContent.value;
});

// --- PARSER DE MARKDOWN LIGERO INTELEGENTE (LIVE PREVIEW) ---
const parsedMarkdown = computed(() => {
  let text = editorContent.value;
  if (!text) {
    return '<p class="placeholder-text">Comienza a escribir Markdown en el panel de la izquierda para ver la vista previa aquí en tiempo real...</p>';
  }

  // Escapar HTML básico para evitar colisiones
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Parsear Negrita **texto**
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Parsear Cursiva *texto*
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Parsear Alertas tipo GitHub/Breeze: > [!NOTE] o > [!WARNING]
  text = text.replace(/^&gt;\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](.*)$/gm, (match, type, content) => {
    return `<div class="breeze-alert alert-${type.toLowerCase()}"><strong class="alert-title">${type}</strong><p>${content}</p></div>`;
  });

  // Parsear Citas bloque estándar: > texto
  text = text.replace(/^&gt;\s*(.*)$/gm, '<blockquote>$1</blockquote>');

  // Parsear Títulos: #, ##, ###
  text = text.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.*)$/gm, '<h1>$1</h1>');

  // Parsear Código en línea `código`
  text = text.replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');

  // Parsear Divisores: ---
  text = text.replace(/^---$/gm, '<hr class="preview-divider" />');

  // Parsear Listas: - item
  text = text.replace(/^\-\s*(.*)$/gm, '<li>$1</li>');

  // Separar en párrafos
  const blocks = text.split(/\n\n+/);
  const parsedBlocks = blocks.map(block => {
    const trimmed = block.trim();
    if (trimmed.startsWith('<h') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<div') || trimmed.startsWith('<li') || trimmed.startsWith('<hr')) {
      return block;
    }
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  });

  return parsedBlocks.join('');
});

function handleEmptyAreaContextMenu(e: MouseEvent) {
  contextMenu.value.x = e.clientX;
  contextMenu.value.y = e.clientY;
  contextMenu.value.targetFile = null;
  contextMenu.value.targetFolder = null;
  contextMenu.value.show = true;

  window.addEventListener('click', closeContextMenu);
}

function handleItemContextMenu(e: MouseEvent, filename: string, folder: string) {
  contextMenu.value.x = e.clientX;
  contextMenu.value.y = e.clientY;
  contextMenu.value.targetFile = filename;
  contextMenu.value.targetFolder = folder;
  contextMenu.value.show = true;

  window.addEventListener('click', closeContextMenu);
}

function handleFolderContextMenu(e: MouseEvent, folder: string) {
  contextMenu.value.x = e.clientX;
  contextMenu.value.y = e.clientY;
  contextMenu.value.targetFile = null;
  contextMenu.value.targetFolder = folder;
  contextMenu.value.show = true;

  window.addEventListener('click', closeContextMenu);
}

function closeContextMenu() {
  contextMenu.value.show = false;
  window.removeEventListener('click', closeContextMenu);
}

function openContextFile() {
  if (contextMenu.value.targetFile && contextMenu.value.targetFolder) {
    selectFile({ name: contextMenu.value.targetFile, folder: contextMenu.value.targetFolder });
  }
}

function deleteContextFile() {
  if (contextMenu.value.targetFile && contextMenu.value.targetFolder) {
    const filename = contextMenu.value.targetFile;
    const folder = contextMenu.value.targetFolder;
    
    osStore.removeFileFromFolder(folder, filename);
    showToast(`Eliminado: workspace/${folder}/${filename}`);
    
    if (currentFile.value && currentFile.value.name === filename && currentFile.value.folder === folder) {
      currentFile.value = null;
      editorContent.value = '';
      originalContent.value = '';
    }
  }
}

function deleteContextFolder() {
  if (contextMenu.value.targetFolder) {
    const folderPath = contextMenu.value.targetFolder;
    const lastSlash = folderPath.lastIndexOf('/');
    const parent = lastSlash !== -1 ? folderPath.slice(0, lastSlash) : 'Inicio';
    const folderName = lastSlash !== -1 ? folderPath.slice(lastSlash + 1) : folderPath;
    
    osStore.removeFileFromFolder(parent, folderName);
    showToast(`Carpeta eliminada: workspace/${folderPath}`);
    
    if (currentFile.value && (currentFile.value.folder === folderPath || currentFile.value.folder.startsWith(folderPath + '/'))) {
      currentFile.value = null;
      editorContent.value = '';
      originalContent.value = '';
    }
  }
}

function triggerNewFile() {
  showSaveDialog.value = true;
}

function triggerNewFolder() {
  newFolderName.value = '';
  showNewFolderModal.value = true;
}

function createNewFolder() {
  const name = newFolderName.value.trim();
  if (!name) {
    showToast('Nombre de carpeta vacío.');
    return;
  }

  const parent = contextMenu.value.targetFolder || 'Documentos';
  const folderFiles = osStore.fileSystem[parent] || [];
  if (folderFiles.some(f => f.name.toLowerCase() === name.toLowerCase())) {
    showToast(`"${name}" ya existe en ${parent}`);
    return;
  }

  osStore.addFileToFolder(parent, {
    name,
    type: 'dir'
  });

  const fullKey = `${parent}/${name}`;
  if (!osStore.fileSystem[fullKey]) {
    osStore.fileSystem[fullKey] = [];
  }

  newFolderName.value = '';
  showNewFolderModal.value = false;
  showToast(`Carpeta creada en workspace/${parent}/${name}`);
}

// --- METHODS ---
function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = '';
    }
  }, 2500);
}

function selectFile(file: NoteFile) {
  const folderContent = osStore.fileSystem[file.folder] || [];
  const found = folderContent.find(f => f.name === file.name);
  
  if (found) {
    currentFile.value = { ...file };
    editorContent.value = found.content !== undefined ? found.content : (found.dataUrl || '');
    originalContent.value = editorContent.value;
  }
}

function handleSaveDialog(payload: { folder: string; filename: string }) {
  const { folder, filename } = payload;
  const folderFiles = osStore.fileSystem[folder] || [];
  if (folderFiles.some(f => f.name.toLowerCase() === filename.toLowerCase())) {
    showToast(`"${filename}" ya existe en ${folder}`);
    return;
  }

  const newFile = {
    name: filename,
    type: 'file' as const,
    size: '0 KB',
    content: ''
  };

  osStore.addFileToFolder(folder, newFile);

  selectFile({ name: filename, folder });
  showToast(`Creada en: ${folder}/${filename}`);
  saveFilename.value = filename.replace('.md', '');
}

function saveFile() {
  if (!currentFile.value) return;

  const text = editorContent.value;
  const sizeBytes = new Blob([text]).size;
  const sizeStr = `${(sizeBytes / 1024).toFixed(1)} KB`;

  osStore.addFileToFolder(currentFile.value.folder, {
    name: currentFile.value.name,
    type: 'file',
    size: sizeStr,
    content: text
  });

  originalContent.value = text;
  showToast('¡Nota guardada en el Host!');
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveFile();
  }
}

// Abrir archivo solicitado por el gestor de archivos
function handleActiveOpenFile() {
  const file = osStore.activeOpenFile;
  if (file && file.name.toLowerCase().endsWith('.md')) {
    selectFile({ name: file.name, folder: file.folder });
    osStore.activeOpenFile = null;
  }
}

onMounted(() => {
  handleActiveOpenFile();
  if (!currentFile.value && markdownFiles.value.length > 0) {
    selectFile(markdownFiles.value[0]);
  }
});

watch(
  () => osStore.activeOpenFile,
  (newVal) => {
    if (newVal) {
      handleActiveOpenFile();
    }
  },
  { deep: true }
);
</script>

<style scoped>
.obsidian-container {
  display: flex;
  width: 100%;
  height: 100%;
  background: #16161a;
  color: #eff0f1;
  font-family: var(--font-family-base), sans-serif;
  overflow: hidden;
  user-select: none;
}

/* SIDEBAR ESTILO OBSIDIAN / BREEZE */
.obsidian-sidebar {
  width: 240px;
  background: #0f0f12;
  border-right: 1px solid #2a2b36;
  display: flex;
  flex-direction: column;
  padding: 16px 8px;
  gap: 16px;
  flex-shrink: 0;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 10px;
  font-size: 0.72rem;
  font-weight: bold;
  color: var(--accent);
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.sidebar-title-icon {
  width: 14px;
  height: 14px;
}

.notes-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.section-header {
  font-size: 0.65rem;
  font-weight: 700;
  color: #7f8c8d;
  text-transform: uppercase;
  padding: 4px 10px;
  letter-spacing: 0.5px;
}

.no-notes {
  font-size: 0.72rem;
  color: #6e7175;
  padding: 8px 10px;
  font-style: italic;
}

.note-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: #bdc3c7;
  font-family: inherit;
  font-size: 0.78rem;
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.note-item:hover {
  background: rgba(255, 255, 255, 0.03);
  color: #ffffff;
}

.note-item.active {
  background: rgba(61, 174, 233, 0.12) !important;
  color: var(--accent) !important;
  font-weight: bold;
  box-shadow: inset 3px 0 0 var(--accent);
}

.note-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: var(--accent);
}

/* ── FOLDER ACCORDION SECTIONS ── */
.folder-section {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
}

.folder-header, .tree-folder-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  background: transparent;
  border: none;
  color: #bdc3c7;
  font-family: inherit;
  font-size: 0.72rem;
  font-weight: bold;
  text-align: left;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast) ease;
}

.folder-header:hover, .tree-folder-header:hover {
  background: rgba(255, 255, 255, 0.03);
  color: #ffffff;
}

.folder-chevron {
  font-size: 0.6rem;
  width: 10px;
  color: #7f8c8d;
}

.folder-icon {
  width: 14px;
  height: 14px;
  color: #eff0f1;
}

.folder-name {
  flex: 1;
}

.file-count {
  font-size: 0.65rem;
  color: #7f8c8d;
}

.folder-content {
  display: flex;
  flex-direction: column;
  padding-left: 12px;
  gap: 2px;
  margin-top: 2px;
}

.no-files {
  font-size: 0.7rem;
  color: #7f8c8d;
  font-style: italic;
  padding: 4px 8px;
}

.note-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.note-name {
  font-size: 0.78rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-folder {
  font-size: 0.62rem;
  color: #7f8c8d;
}

.new-note-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2b36;
  border-radius: var(--radius-md);
  color: #ffffff;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.new-note-btn:hover {
  background: rgba(61, 174, 233, 0.1);
  border-color: var(--accent);
}

.btn-icon {
  width: 14px;
  height: 14px;
}

/* ÁREA DE CONTENIDO CENTRAL */
.obsidian-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #16161a;
  overflow: hidden;
}

.obsidian-header {
  height: 48px;
  background: #0f0f12;
  border-bottom: 1px solid #2a2b36;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  flex-shrink: 0;
}

.active-note-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
}

.active-note-icon {
  width: 15px;
  height: 15px;
  color: var(--accent);
}

.active-note-title {
  font-weight: bold;
}

.active-note-path {
  font-size: 0.7rem;
  color: #7f8c8d;
  background: rgba(255, 255, 255, 0.03);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.save-status {
  font-size: 0.65rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.status-saved {
  background: var(--success);
  color: white;
}

.status-modified {
  background: var(--warning);
  color: white;
}

.header-actions {
  display: flex;
  align-items: center;
}

.save-btn {
  background: var(--accent);
  border: 1px solid var(--accent);
  color: white;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.save-btn:hover {
  background: var(--accent-hover);
}

/* PANTALLA DIVIDIDA WORKSPACE */
.workspace-split {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-pane {
  flex: 1;
  border-right: 1px solid #2a2b36;
  display: flex;
  overflow: hidden;
}

.obsidian-textarea {
  flex: 1;
  height: 100%;
  background: #16161a;
  border: none;
  outline: none;
  resize: none;
  padding: 20px;
  color: #e2e4e9;
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  line-height: 1.6;
  caret-color: var(--accent);
  overflow-y: auto;
}

.preview-pane {
  flex: 1;
  background: #1a1a1e;
  overflow-y: auto;
  padding: 24px;
}

/* ESTILOS DE RENDERIZACIÓN DE VISTA PREVIA MD */
.markdown-preview {
  font-family: var(--font-family-base), sans-serif;
  line-height: 1.6;
  font-size: 0.85rem;
  color: #eff0f1;
}

.markdown-preview :deep(h1) {
  font-size: 1.6rem;
  font-weight: 800;
  margin-top: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid #2a2b36;
  padding-bottom: 8px;
  color: #ffffff;
}

.markdown-preview :deep(h2) {
  font-size: 1.25rem;
  font-weight: bold;
  margin-top: 24px;
  margin-bottom: 12px;
  color: #ffffff;
}

.markdown-preview :deep(h3) {
  font-size: 1.05rem;
  font-weight: bold;
  margin-top: 18px;
  margin-bottom: 8px;
  color: #ffffff;
}

.markdown-preview :deep(p) {
  margin-bottom: 14px;
}

.markdown-preview :deep(strong) {
  color: #ffffff;
}

.markdown-preview :deep(em) {
  color: #bdc3c7;
}

.markdown-preview :deep(blockquote) {
  margin: 16px 0;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-left: 4px solid var(--accent);
  color: #bdc3c7;
  font-style: italic;
}

.markdown-preview :deep(li) {
  margin-left: 20px;
  margin-bottom: 6px;
  list-style-type: disc;
}

.markdown-preview :deep(.inline-code) {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-family: monospace;
  font-size: 0.78rem;
  color: #e5a50a;
}

.markdown-preview :deep(.preview-divider) {
  border: none;
  border-top: 1px solid #2a2b36;
  margin: 24px 0;
}

/* Estilos para Alertas Breeze/GitHub */
.markdown-preview :deep(.breeze-alert) {
  margin: 16px 0;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.015);
}

.markdown-preview :deep(.breeze-alert .alert-title) {
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 4px;
}

.markdown-preview :deep(.breeze-alert p) {
  margin: 0;
  font-size: 0.8rem;
  color: #bdc3c7;
}

.markdown-preview :deep(.alert-note) {
  border-left: 4px solid var(--accent);
  border-color: var(--accent);
}
.markdown-preview :deep(.alert-note .alert-title) { color: var(--accent); }

.markdown-preview :deep(.alert-tip) {
  border-left: 4px solid var(--success);
  border-color: var(--success);
}
.markdown-preview :deep(.alert-tip .alert-title) { color: var(--success); }

.markdown-preview :deep(.alert-important) {
  border-left: 4px solid #9b59b6;
  border-color: #9b59b6;
}
.markdown-preview :deep(.alert-important .alert-title) { color: #9b59b6; }

.markdown-preview :deep(.alert-warning) {
  border-left: 4px solid var(--warning);
  border-color: var(--warning);
}
.markdown-preview :deep(.alert-warning .alert-title) { color: var(--warning); }

.markdown-preview :deep(.alert-caution) {
  border-left: 4px solid var(--danger);
  border-color: var(--danger);
}
.markdown-preview :deep(.alert-caution .alert-title) { color: var(--danger); }

.placeholder-text {
  color: #7f8c8d;
  font-style: italic;
  font-size: 0.82rem;
  text-align: center;
  padding-top: 100px;
}

/* PANTALLA DE BIENVENIDA VACÍA */
.welcome-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
  gap: 12px;
}

.welcome-logo {
  width: 64px;
  height: 64px;
  color: var(--accent);
  opacity: 0.8;
  margin-bottom: 8px;
}

.welcome-screen h3 {
  font-size: 1.3rem;
  font-weight: bold;
}

.welcome-screen p {
  font-size: 0.82rem;
  color: #bdc3c7;
  max-width: 440px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.welcome-actions {
  display: flex;
  gap: 12px;
}

.welcome-btn {
  padding: 10px 20px;
  background: var(--accent);
  border: 1px solid var(--accent);
  color: white;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.welcome-btn:hover {
  background: var(--accent-hover);
}

.welcome-btn.secondary {
  background: transparent;
  border-color: #2a2b36;
  color: #bdc3c7;
}

.welcome-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.02);
  color: white;
}

/* BREEZE SOLID MODAL OVERLAY */
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
  width: 420px;
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

.folder-selector {
  display: flex;
  gap: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  padding: 4px;
  border-radius: var(--radius-md);
}

.selector-tab {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.75rem;
  padding: 8px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  font-weight: bold;
}

.selector-tab.active {
  background: var(--bg-active);
  color: var(--accent);
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

/* BREEZE TOAST NOTIFICATION */
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
</style>
