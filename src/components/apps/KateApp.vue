<template>
  <div class="editor-container">
    <!-- BARRA LATERAL DE ARCHIVOS (ESTILO SERIO KDE PLASMA BREEZE) -->
    <aside class="editor-sidebar">
      <div class="sidebar-title">
        <FolderIcon class="sidebar-title-icon" />
        <span>PROYECTO: workspace</span>
      </div>
      
      <!-- Secciones de carpetas colapsables -->
      <div class="sidebar-sections">
        <!-- DOCUMENTOS -->
        <div class="folder-section">
          <button type="button" class="folder-header" @click="categories.Documentos = !categories.Documentos">
            <span class="folder-chevron">{{ categories.Documentos ? '▼' : '▶' }}</span>
            <FolderIcon class="folder-icon" />
            <span class="folder-name">Documentos</span>
            <span class="file-count">({{ documentFiles.length }})</span>
          </button>
          
          <div v-show="categories.Documentos" class="folder-content">
            <div v-if="documentFiles.length === 0" class="no-files">Sin archivos de código</div>
            <button
              v-for="file in documentFiles"
              :key="file.name"
              type="button"
              class="file-item"
              :class="{ 'file-item-active': currentFile && currentFile.name === file.name && currentFile.folder === 'Documentos' }"
              @click="selectFile(file.name, 'Documentos')"
            >
              <CodeIcon class="file-icon" :class="detectLanguage(file.name).color" />
              <span class="file-name-span">{{ file.name }}</span>
            </button>
          </div>
        </div>

        <!-- DESCARGAS -->
        <div class="folder-section">
          <button type="button" class="folder-header" @click="categories.Descargas = !categories.Descargas">
            <span class="folder-chevron">{{ categories.Descargas ? '▼' : '▶' }}</span>
            <FolderIcon class="folder-icon" />
            <span class="folder-name">Descargas</span>
            <span class="file-count">({{ downloadFiles.length }})</span>
          </button>
          
          <div v-show="categories.Descargas" class="folder-content">
            <div v-if="downloadFiles.length === 0" class="no-files">Sin archivos de código</div>
            <button
              v-for="file in downloadFiles"
              :key="file.name"
              type="button"
              class="file-item"
              :class="{ 'file-item-active': currentFile && currentFile.name === file.name && currentFile.folder === 'Descargas' }"
              @click="selectFile(file.name, 'Descargas')"
            >
              <CodeIcon class="file-icon" :class="detectLanguage(file.name).color" />
              <span class="file-name-span">{{ file.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- BOTÓN AGREGAR ARCHIVO -->
      <button type="button" class="new-file-btn" @click="showNewFileModal = true">
        <PlusIcon class="btn-icon" />
        <span>Nuevo Archivo</span>
      </button>
    </aside>

    <!-- VENTANA DEL EDITOR DE CÓDIGO -->
    <main class="editor-main">
      <div v-if="currentFile" class="editor-header">
        <div class="tab-title">
          <CodeIcon class="tab-icon" :class="detectLanguage(currentFile.name).color" />
          <span class="active-filename">{{ currentFile.name }}</span>
          <span class="folder-path-badge">{{ currentFile.folder }}/</span>
          <span 
            class="status-indicator" 
            :class="isModified ? 'status-modified' : 'status-saved'"
          >
            {{ isModified ? '• MODIFICADO' : '• GUARDADO' }}
          </span>
        </div>
        
        <div class="editor-controls">
          <!-- Control de Tamaño de Fuente (Breeze Style) -->
          <div class="font-size-control" title="Tamaño de Fuente">
            <button type="button" class="font-btn" @click="changeFontSize(-1)">A-</button>
            <span class="font-size-val">{{ fontSize }}px</span>
            <button type="button" class="font-btn" @click="changeFontSize(1)">A+</button>
          </div>

          <span class="language-badge">{{ detectLanguage(currentFile.name).badge }}</span>
          
          <!-- Botones de Acción -->
          <button type="button" class="header-btn run-btn" @click="runSimulation" title="Ejecutar Código en Host">
            <PlayIcon class="btn-icon" />
            <span>Ejecutar</span>
          </button>

          <button type="button" class="header-btn save-btn" @click="saveFile" title="Guardar Cambios (Ctrl+S)">
            <SaveIcon class="btn-icon" />
            <span>Guardar</span>
          </button>
        </div>
      </div>

      <!-- Cuerpo del Editor -->
      <div v-if="currentFile" class="editor-body">
        <!-- Números de Líneas -->
        <div ref="lineNumbersRef" class="line-numbers" :style="{ fontSize: fontSize + 'px' }">
          <span v-for="line in lineCount" :key="line">{{ line }}</span>
        </div>

        <!-- Área de Código Editable -->
        <div class="code-area-container">
          <textarea
            ref="textareaRef"
            class="code-textarea"
            v-model="editorContent"
            @scroll="syncScroll"
            @keydown="handleKeydown"
            :style="{ fontSize: fontSize + 'px' }"
            placeholder="// Escribe tu código aquí..."
            spellcheck="false"
          ></textarea>
        </div>
      </div>

      <!-- Pantalla de bienvenida si no hay archivos abiertos -->
      <div v-else class="welcome-screen">
        <div class="breeze-welcome-logo">KATE</div>
        <p class="breeze-welcome-subtitle">EDITOR DE CÓDIGO AVANZADO DE VUEOS</p>
        
        <div class="welcome-actions">
          <button type="button" class="welcome-btn" @click="showNewFileModal = true">
            <PlusIcon class="welcome-btn-icon" />
            <span>Crear Nuevo Archivo de Código</span>
          </button>
          <button type="button" class="welcome-btn" v-if="firstAvailableFile" @click="selectFile(firstAvailableFile.name, firstAvailableFile.folder)">
            <CodeIcon class="welcome-btn-icon" />
            <span>Abrir {{ firstAvailableFile.name }} ({{ firstAvailableFile.folder }})</span>
          </button>
        </div>

        <div class="system-specs">
          <div>DIRECTORIO ACTUAL: <span class="highlight">/workspace</span></div>
          <div>COMPILADOR DE SISTEMA: <span class="highlight breeze-blue">INTEGRACIÓN LOCAL CON HOST ACTIVE</span></div>
        </div>
      </div>
    </main>

    <!-- MODAL NUEVO ARCHIVO (ESTILO SERIO KDE BREEZE) -->
    <div v-if="showNewFileModal" class="modal-overlay" @click.self="showNewFileModal = false">
      <div class="breeze-modal">
        <div class="modal-header">
          <PlusIcon class="modal-title-icon" />
          <h3>CREAR NUEVO ARCHIVO</h3>
          <button type="button" class="close-btn" @click="showNewFileModal = false">
            <XIcon />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label for="new-filename">Nombre con extensión real (ej. index.html, api.py, kernel.go):</label>
            <input 
              id="new-filename"
              type="text" 
              class="breeze-input" 
              v-model="newFilename" 
              placeholder="ejemplo: script.js"
              @keyup.enter="createNewFile"
              autoFocus
            />
          </div>

          <div class="form-group">
            <label>Carpeta de Destino:</label>
            <div class="folder-selector">
              <button 
                type="button" 
                class="selector-tab" 
                :class="{ active: newFileFolder === 'Documentos' }"
                @click="newFileFolder = 'Documentos'"
              >
                Documentos
              </button>
              <button 
                type="button" 
                class="selector-tab" 
                :class="{ active: newFileFolder === 'Descargas' }"
                @click="newFileFolder = 'Descargas'"
              >
                Descargas
              </button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="modal-btn cancel" @click="showNewFileModal = false">Cancelar</button>
          <button type="button" class="modal-btn confirm" @click="createNewFile">Crear Archivo</button>
        </div>
      </div>
    </div>

    <!-- MODAL DE EJECUCIÓN (CONSOLA BREEZE KONSOLE - ABORTABLE) -->
    <div v-if="showTerminalModal" class="modal-overlay" @click.self="closeTerminalModal">
      <div class="breeze-terminal-modal">
        <div class="terminal-header">
          <TerminalIcon class="terminal-title-icon" />
          <span>BREEZE KONSOLE - {{ currentFile?.name }}</span>
          <button type="button" class="close-btn" @click="closeTerminalModal" title="Cerrar y Matar Proceso">
            <XIcon />
          </button>
        </div>
        
        <div class="terminal-body" ref="terminalBodyRef">
          <div v-for="(line, idx) in terminalLines" :key="idx" class="terminal-line" :class="line.type">
            {{ line.text }}
          </div>
          <div v-if="terminalRunning" class="terminal-cursor">█</div>
        </div>

        <div class="terminal-footer">
          <span class="terminal-status" :class="{ running: terminalRunning }">
            {{ terminalRunning ? '• PROCESO CORRIENDO EN HOST...' : '• EJECUCIÓN FINALIZADA' }}
          </span>
          <button type="button" class="terminal-close-btn" @click="closeTerminalModal" title="Cerrar y Matar Proceso">
            Cerrar Consola
          </button>
        </div>
      </div>
    </div>

    <!-- TOAST DE CONFIRMACIÓN BREEZE -->
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
import { 
  Folder as FolderIcon, 
  Code as CodeIcon, 
  Save as SaveIcon, 
  Plus as PlusIcon, 
  Play as PlayIcon,
  X as XIcon,
  Terminal as TerminalIcon
} from 'lucide-vue-next';

interface ActiveFile {
  name: string;
  folder: string;
}

const osStore = useOSStore();

// ---- State ----
const currentFile = ref<ActiveFile | null>(null);
const editorContent = ref('');
const originalContent = ref('');
const fontSize = ref(14);
const showNewFileModal = ref(false);
const newFilename = ref('');
const newFileFolder = ref<'Documentos' | 'Descargas'>('Documentos');
const toastMessage = ref('');

// UI collapsibles
const categories = ref({
  Documentos: true,
  Descargas: true
});

// Gutter and Sync refs
const lineNumbersRef = ref<HTMLElement | null>(null);
const textareaRef = ref<HTMLElement | null>(null);

// Terminal modal state
const showTerminalModal = ref(false);
const terminalRunning = ref(false);
const terminalLines = ref<{ text: string; type: 'info' | 'output' | 'error' | 'success' }[]>([]);
const terminalBodyRef = ref<HTMLElement | null>(null);

// ---- Computeds ----
// Filter non-binary editable files from the workspace folders in osStore
const documentFiles = computed(() => {
  return (osStore.fileSystem['Documentos'] || []).filter(
    (file) => file.type === 'file' && isTextEditable(file.name)
  );
});

const downloadFiles = computed(() => {
  return (osStore.fileSystem['Descargas'] || []).filter(
    (file) => file.type === 'file' && isTextEditable(file.name)
  );
});

const firstAvailableFile = computed(() => {
  if (documentFiles.value.length > 0) {
    return { name: documentFiles.value[0].name, folder: 'Documentos' };
  }
  if (downloadFiles.value.length > 0) {
    return { name: downloadFiles.value[0].name, folder: 'Descargas' };
  }
  return null;
});

const isModified = computed(() => {
  return editorContent.value !== originalContent.value;
});

const lineCount = computed(() => {
  if (!editorContent.value) return 1;
  return editorContent.value.split('\n').length;
});

// ---- Methods ----
function isTextEditable(filename: string): boolean {
  const nameLower = filename.toLowerCase();
  const ignoredExtensions = [
    '.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mp3', 
    '.pdf', '.iso', '.zip', '.tar', '.gz', '.rar', '.exe', '.dll', '.bin',
    '.docx', '.xlsx'
  ];
  return !ignoredExtensions.some(ext => nameLower.endsWith(ext));
}

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = '';
    }
  }, 2500);
}

function detectLanguage(filename: string): { lang: string; badge: string; color: string } {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js': return { lang: 'javascript', badge: 'JS', color: 'color-yellow' };
    case 'ts': return { lang: 'typescript', badge: 'TS', color: 'color-blue' };
    case 'html': return { lang: 'html', badge: 'HTML', color: 'color-orange' };
    case 'css': return { lang: 'css', badge: 'CSS', color: 'color-magenta' };
    case 'json': return { lang: 'json', badge: 'JSON', color: 'color-purple' };
    case 'py': return { lang: 'python', badge: 'Python', color: 'color-green' };
    case 'go': return { lang: 'go', badge: 'Go', color: 'color-cyan' };
    case 'sh': return { lang: 'bash', badge: 'Shell', color: 'color-lightgreen' };
    case 'md': return { lang: 'markdown', badge: 'Markdown', color: 'color-white' };
    case 'vue': return { lang: 'vue', badge: 'Vue', color: 'color-vue' };
    case 'txt': return { lang: 'text', badge: 'TXT', color: 'color-grey' };
    default: return { lang: 'text', badge: 'CODE', color: 'color-grey' };
  }
}

function selectFile(name: string, folder: string) {
  const folderFiles = osStore.fileSystem[folder] || [];
  const file = folderFiles.find(f => f.name === name);
  if (file) {
    currentFile.value = { name, folder };
    editorContent.value = file.content !== undefined ? file.content : (file.dataUrl || '');
    originalContent.value = editorContent.value;
    showToast(`Archivo abierto: ${name}`);
  }
}

function createNewFile() {
  const filename = newFilename.value.trim();
  if (!filename) {
    showToast('Nombre de archivo vacío.');
    return;
  }

  const folder = newFileFolder.value;
  const folderFiles = osStore.fileSystem[folder] || [];
  if (folderFiles.some(f => f.name.toLowerCase() === filename.toLowerCase())) {
    showToast(`"${filename}" ya existe en ${folder}`);
    return;
  }

  osStore.addFileToFolder(folder, {
    name: filename,
    type: 'file',
    size: '0 KB',
    content: ''
  });

  newFilename.value = '';
  showNewFileModal.value = false;

  selectFile(filename, folder);
  showToast(`Creado en workspace/${folder}/${filename}`);
}

function saveFile() {
  if (!currentFile.value) return;

  const sizeBytes = new Blob([editorContent.value]).size;
  const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
  const sizeStr = sizeBytes > 1024 * 1024 ? `${sizeMB} MB` : `${(sizeBytes / 1024).toFixed(1)} KB`;

  osStore.addFileToFolder(currentFile.value.folder, {
    name: currentFile.value.name,
    type: 'file',
    size: sizeStr,
    content: editorContent.value
  });

  originalContent.value = editorContent.value;
  showToast(`¡Archivo guardado con éxito!`);
}

// Synced scrolling between textarea and lines gutter
function syncScroll() {
  if (textareaRef.value && lineNumbersRef.value) {
    lineNumbersRef.value.scrollTop = textareaRef.value.scrollTop;
  }
}

// Keyboard shortcuts (Ctrl+S for save)
function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveFile();
  }
}

// Dynamic font size adjuster
function changeFontSize(direction: number) {
  const newSize = fontSize.value + direction;
  if (newSize >= 11 && newSize <= 28) {
    fontSize.value = newSize;
  }
}

// Real compilation/execution using host commands
async function runSimulation() {
  if (!currentFile.value) return;

  // Auto-guardar cambios antes de ejecutar
  if (isModified.value) {
    saveFile();
  }
  
  showTerminalModal.value = true;
  terminalRunning.value = true;
  terminalLines.value = [];

  const filename = currentFile.value.name;
  const folder = currentFile.value.folder;
  const langInfo = detectLanguage(filename);

  terminalLines.value.push({ text: `[system] Inicializando sandbox de ejecución real en el host...`, type: 'info' as const });
  terminalLines.value.push({ text: `[system] Directorio: /workspace/${folder}/${filename}`, type: 'info' as const });
  
  let commandName = '';
  switch (langInfo.lang) {
    case 'python':
      commandName = 'python3';
      break;
    case 'javascript':
      commandName = 'node';
      break;
    case 'bash':
      commandName = 'bash';
      break;
    case 'go':
      commandName = 'go run';
      break;
    default:
      commandName = 'exec';
      break;
  }

  terminalLines.value.push({ text: `[system] Ejecutando: ${commandName} "${filename}"...`, type: 'info' as const });
  terminalLines.value.push({ text: `--------------------------------------------------------`, type: 'info' as const });

  try {
    const res = await window.osAPI.runFile(folder, filename);
    
    if (res.stdout) {
      const stdoutLines = res.stdout.split('\n');
      stdoutLines.forEach(line => {
        if (line || stdoutLines.length === 1) {
          terminalLines.value.push({ text: line, type: 'output' as const });
        }
      });
    }

    if (res.stderr) {
      const stderrLines = res.stderr.split('\n');
      stderrLines.forEach(line => {
        if (line || stderrLines.length === 1) {
          terminalLines.value.push({ text: line, type: 'error' as const });
        }
      });
    }

    terminalLines.value.push({ text: `--------------------------------------------------------`, type: 'info' as const });
    if (res.code === 0) {
      terminalLines.value.push({ text: `[system] Proceso finalizado con código de salida: 0 (ÉXITO)`, type: 'success' as const });
    } else {
      terminalLines.value.push({ text: `[system] Proceso finalizado con código de salida: ${res.code} (ERROR)`, type: 'error' as const });
    }
  } catch (err: any) {
    terminalLines.value.push({ text: `[system] Error fatal al intentar ejecutar el archivo: ${err.message}`, type: 'error' as const });
  } finally {
    terminalRunning.value = false;
    
    // Auto scroll al final
    setTimeout(() => {
      if (terminalBodyRef.value) {
        terminalBodyRef.value.scrollTop = terminalBodyRef.value.scrollHeight;
      }
    }, 50);
  }
}

// Cierra la consola y mata el proceso colgado en el host de forma segura
function closeTerminalModal() {
  if (terminalRunning.value && currentFile.value) {
    window.osAPI.killFile(currentFile.value.folder, currentFile.value.name).catch(err => {
      console.error('[Kate] Error al abortar proceso en host:', err);
    });
    terminalRunning.value = false;
  }
  showTerminalModal.value = false;
}

// Open activeOpenFile (if requested by file manager)
function handleActiveOpenFile() {
  const file = osStore.activeOpenFile;
  if (file) {
    const folderFiles = osStore.fileSystem[file.folder] || [];
    const found = folderFiles.find(f => f.name === file.name);
    
    currentFile.value = {
      name: file.name,
      folder: file.folder
    };
    
    editorContent.value = found ? (found.content !== undefined ? found.content : (found.dataUrl || '')) : (file.dataUrl || '');
    originalContent.value = editorContent.value;
    
    osStore.activeOpenFile = null;
    showToast(`Archivo cargado: ${file.name}`);
  }
}

// ---- Lifecycle & Watchers ----
onMounted(() => {
  handleActiveOpenFile();
  
  if (!currentFile.value && firstAvailableFile.value) {
    selectFile(firstAvailableFile.value.name, firstAvailableFile.value.folder);
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
.editor-container {
  display: flex;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-family-base), sans-serif;
  overflow: hidden;
  user-select: none;
}

/* SIDEBAR STYLING - KDE BREEZE SOLID */
.editor-sidebar {
  width: 240px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 16px 8px;
  gap: 16px;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 10px;
  font-size: 0.72rem;
  font-weight: bold;
  color: var(--text-secondary);
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.sidebar-title-icon {
  width: 13px;
  height: 13px;
  color: var(--accent);
}

.sidebar-sections {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.folder-section {
  display: flex;
  flex-direction: column;
}

.folder-header {
  display: flex;
  align-items: center;
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.8rem;
  padding: 6px 8px;
  cursor: pointer;
  text-align: left;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
  font-weight: 600;
}

.folder-header:hover {
  background: var(--bg-hover);
}

.folder-chevron {
  font-size: 0.6rem;
  margin-right: 6px;
  color: var(--text-secondary);
  width: 10px;
}

.folder-icon {
  width: 14px;
  height: 14px;
  margin-right: 8px;
  color: var(--accent);
}

.folder-name {
  flex: 1;
}

.file-count {
  font-size: 0.7rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

.folder-content {
  display: flex;
  flex-direction: column;
  padding-left: 16px;
  margin-top: 4px;
  gap: 2px;
}

.no-files {
  font-size: 0.7rem;
  color: var(--text-secondary);
  padding: 4px 8px;
  font-style: italic;
  opacity: 0.6;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.76rem;
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  padding-left: 12px;
}

.file-item-active {
  background: var(--bg-active) !important;
  color: var(--accent) !important;
  font-weight: bold;
  border-left: 3px solid var(--accent);
}

.file-name-span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

/* Color schemes for languages */
.color-yellow { color: #e5a50a; }
.color-blue { color: var(--accent); }
.color-orange { color: #e65c00; }
.color-magenta { color: #d42dd4; }
.color-purple { color: #9c6c2e; }
.color-green { color: var(--success); }
.color-cyan { color: #1ab0d6; }
.color-lightgreen { color: #37a858; }
.color-white { color: var(--text-primary); }
.color-vue { color: #3fa775; }
.color-grey { color: var(--text-secondary); }

/* NEW FILE BUTTON - KDE STYLE */
.new-file-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.new-file-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.btn-icon {
  width: 14px;
  height: 14px;
}

/* MAIN AREA */
.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}

.editor-header {
  height: 48px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
}

.tab-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--text-primary);
}

.active-filename {
  font-weight: bold;
}

.folder-path-badge {
  color: var(--text-secondary);
  font-size: 0.72rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  margin-left: 4px;
}

.tab-icon {
  width: 14px;
  height: 14px;
}

.status-indicator {
  font-size: 0.65rem;
  font-weight: bold;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  margin-left: 6px;
}

.status-saved {
  color: #fff;
  background: var(--success);
}

.status-modified {
  color: #fff;
  background: var(--warning);
}

.editor-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Font size controller */
.font-size-control {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 2px;
}

.font-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.72rem;
  font-weight: bold;
  width: 24px;
  height: 20px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.font-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
}

.font-size-val {
  font-size: 0.72rem;
  font-weight: bold;
  color: var(--text-primary);
  padding: 0 6px;
  min-width: 32px;
  text-align: center;
}

.language-badge {
  font-size: 0.65rem;
  font-weight: bold;
  color: var(--accent);
  background: rgba(61, 174, 233, 0.1);
  border: 1px solid rgba(61, 174, 233, 0.2);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.header-btn {
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

.run-btn {
  background: rgba(39, 174, 96, 0.08);
  border: 1px solid var(--success);
  color: var(--success);
}

.run-btn:hover {
  background: rgba(39, 174, 96, 0.16);
}

.save-btn {
  background: var(--accent);
  border: 1px solid var(--accent);
  color: #ffffff !important;
}

.save-btn:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

/* EDITOR BODY AREA */
.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: var(--bg-primary);
}

.line-numbers {
  width: 48px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-right: 12px;
  padding-top: 16px;
  border-right: 1px solid var(--border-color);
  color: var(--text-disabled);
  line-height: 1.5;
  user-select: none;
  overflow: hidden;
  background: var(--bg-secondary);
}

.code-area-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.code-textarea {
  flex: 1;
  height: 100%;
  background: var(--bg-primary);
  border: none;
  outline: none;
  resize: none;
  padding: 16px;
  color: var(--text-primary);
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
  line-height: 1.5;
  caret-color: var(--accent);
  overflow-y: auto;
  scrollbar-width: thin;
}

/* WELCOME SCREEN */
.welcome-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  padding: 32px;
  text-align: center;
}

.breeze-welcome-logo {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.breeze-welcome-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
  letter-spacing: 1.5px;
  margin-bottom: 32px;
}

.welcome-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 320px;
  margin-bottom: 40px;
}

.welcome-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.welcome-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
  transform: translateY(-1px);
}

.welcome-btn-icon {
  width: 15px;
  height: 15px;
  color: var(--accent);
}

.system-specs {
  font-size: 0.7rem;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 6px;
  opacity: 0.8;
}

.highlight {
  color: var(--text-primary);
  font-weight: bold;
}

.breeze-blue {
  color: var(--accent);
}

/* BREEZE SOLID MODAL */
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
  width: 440px;
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
  color: #ffffff !important; /* Corregido para que no salga negro */
}

.modal-btn.confirm:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

/* BREEZE KONSOLE TERMINAL MODAL */
.breeze-terminal-modal {
  width: 580px;
  background: #1c1f22;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-popup);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Fira Code', monospace;
}

.terminal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-titlebar);
  color: var(--text-primary);
  font-size: 0.8rem;
  font-weight: bold;
}

.terminal-title-icon {
  width: 14px;
  height: 14px;
  color: var(--accent);
}

.terminal-header span {
  flex: 1;
}

.terminal-body {
  height: 280px;
  background: #141618;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.76rem;
  line-height: 1.4;
  scrollbar-width: thin;
}

.terminal-line {
  word-break: break-all;
  white-space: pre-wrap;
}

.terminal-line.info {
  color: var(--text-secondary);
  opacity: 0.7;
}

.terminal-line.output {
  color: #4ce5ff;
}

.terminal-line.success {
  color: var(--success);
}

.terminal-line.error {
  color: #ff3b3b;
}

.terminal-cursor {
  display: inline-block;
  color: var(--accent);
  animation: cursor-blink 0.8s infinite;
  font-size: 0.78rem;
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.terminal-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-titlebar);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.terminal-status {
  font-size: 0.65rem;
  font-weight: bold;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.terminal-status.running {
  color: var(--accent);
}

.terminal-close-btn {
  background: var(--accent);
  border: 1px solid var(--accent);
  color: #ffffff;
  padding: 6px 16px;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.72rem;
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.terminal-close-btn:hover {
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
  letter-spacing: 0.5px;
  z-index: 2000;
}

/* Animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
