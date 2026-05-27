<template>
  <div class="office-container">
    <!-- ── CASO 1: HUB INICIAL (DASHBOARD MICROSOFT 365) ── -->
    <div v-if="activeMode === 'hub'" class="office-hub-view">
      <!-- Sidebar de Navegación Izquierdo (Estilo M365) -->
      <aside class="hub-sidebar">
        <div class="sidebar-top">
          <!-- Logo de Microsoft Office 365 en SVG -->
          <div class="office-logo-container">
            <svg class="office-logo-svg" viewBox="0 0 24 24">
              <path fill="#f25f22" d="M1 5l10-3v20L1 19z" />
              <path fill="#00a1f1" d="M13 2l10 3v7h-10z" />
              <path fill="#7fba00" d="M13 12h10v7l-10 3z" />
            </svg>
            <span class="office-brand-name">Office 365</span>
          </div>

          <div class="sidebar-divider"></div>

          <button
            class="sidebar-tab"
            :class="{ 'sidebar-tab-active': sidebarTab === 'inicio' }"
            @click="sidebarTab = 'inicio'"
          >
            <HomeIcon class="sidebar-icon" />
            <span>Inicio</span>
          </button>

          <button
            class="sidebar-tab"
            :class="{ 'sidebar-tab-active': sidebarTab === 'abrir' }"
            @click="sidebarTab = 'abrir'"
          >
            <FolderOpenIcon class="sidebar-icon" />
            <span>Examinar documentos</span>
          </button>

          <button
            class="sidebar-tab"
            :class="{ 'sidebar-tab-active': sidebarTab === 'plantillas' }"
            @click="sidebarTab = 'plantillas'"
          >
            <LayoutTemplateIcon class="sidebar-icon" />
            <span>Plantillas</span>
          </button>
        </div>

        <div class="sidebar-bottom">
          <span class="nubes-header">Almacenamiento</span>
          <div class="nube-empty">OneDrive conectado</div>
        </div>
      </aside>

      <!-- Panel de Contenido Principal -->
      <main class="hub-main-content">
        <!-- PESTAÑA: INICIO -->
        <section v-if="sidebarTab === 'inicio'" class="hub-section">
          <!-- Cabecera de bienvenida -->
          <header class="hub-welcome-header">
            <h2>Buenos días, {{ userStore.username }}</h2>
            <p>Crea un nuevo documento o continúa trabajando en los archivos guardados recientemente.</p>
          </header>

          <!-- Lanzadores de Nuevos Archivos (Estilo Office Cards) -->
          <div class="launchers-grid">
            <!-- DOCX Card -->
            <button class="launch-card card-docx" @click="launchNewDoc('docx')">
              <div class="icon-circle icon-circle-docx">
                <FileTextIcon class="card-icon" />
              </div>
              <div class="card-text">
                <span class="card-label">Documento</span>
                <span class="card-sublabel">Word (DOCX)</span>
              </div>
            </button>

            <!-- XLSX Card -->
            <button class="launch-card card-xlsx" @click="launchNewDoc('xlsx')">
              <div class="icon-circle icon-circle-xlsx">
                <TableIcon class="card-icon" />
              </div>
              <div class="card-text">
                <span class="card-label">Libro</span>
                <span class="card-sublabel">Excel (XLSX)</span>
              </div>
            </button>

            <!-- PPTX Card (Simulada) -->
            <button class="launch-card card-pptx" @click="launchNewDoc('docx')">
              <div class="icon-circle icon-circle-pptx">
                <TvIcon class="card-icon" />
              </div>
              <div class="card-text">
                <span class="card-label">Presentación</span>
                <span class="card-sublabel">PowerPoint (PPTX)</span>
              </div>
            </button>

            <!-- PDF Card -->
            <button class="launch-card card-pdf" @click="launchNewDoc('pdf')">
              <div class="icon-circle icon-circle-pdf">
                <BookOpenIcon class="card-icon" />
              </div>
              <div class="card-text">
                <span class="card-label">Documento PDF</span>
                <span class="card-sublabel">Adobe PDF (Visor)</span>
              </div>
            </button>
          </div>

          <!-- Archivos Recientes -->
          <div class="recent-files-area">
            <h3 class="recent-title">Documentos guardados recientemente</h3>
            <div class="recent-table-wrapper">
              <table class="recent-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Ubicación</th>
                    <th>Tamaño</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="file in documentFiles"
                    :key="file.name"
                    class="recent-row"
                    @dblclick="openExistingFile(file)"
                    title="Doble clic para abrir"
                  >
                    <td class="file-name-cell">
                      <FileTextIcon v-if="file.name.endsWith('.docx')" class="table-file-icon icon-docx" />
                      <TableIcon v-else-if="file.name.endsWith('.xlsx')" class="table-file-icon icon-xlsx" />
                      <BookOpenIcon v-else class="table-file-icon icon-pdf" />
                      <span class="filename-span">{{ file.name }}</span>
                    </td>
                    <td class="file-path-cell">Documentos / OneDrive</td>
                    <td class="file-size-cell">{{ file.size || '12 KB' }}</td>
                    <td class="file-type-cell">
                      <span
                        class="format-tag"
                        :class="{
                          'tag-docx': file.name.endsWith('.docx'),
                          'tag-xlsx': file.name.endsWith('.xlsx'),
                          'tag-pdf': file.name.endsWith('.pdf')
                        }"
                      >
                        {{ file.name.split('.').pop()?.toUpperCase() }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="documentFiles.length === 0">
                    <td colspan="4" class="table-empty-state">
                      Ningún documento disponible. Comienza creando un documento arriba.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- PESTAÑA: ABRIR ARCHIVO LOCAL -->
        <section v-else-if="sidebarTab === 'abrir'" class="hub-section">
          <header class="hub-welcome-header">
            <h2>Examinar documentos locales</h2>
            <p>Selecciona un archivo del disco virtual para reanudar su edición o lectura.</p>
          </header>
          
          <div class="local-explorer-grid">
            <button
              v-for="file in documentFiles"
              :key="file.name"
              class="explorer-file-card"
              @click="openExistingFile(file)"
            >
              <FileTextIcon v-if="file.name.endsWith('.docx')" class="explorer-file-icon icon-docx" />
              <TableIcon v-else-if="file.name.endsWith('.xlsx')" class="explorer-file-icon icon-xlsx" />
              <BookOpenIcon v-else class="explorer-file-icon icon-pdf" />
              <span class="explorer-filename" :title="file.name">{{ file.name }}</span>
              <span class="explorer-filesize">{{ file.size || '10 KB' }}</span>
            </button>
            <div v-if="documentFiles.length === 0" class="empty-explorer-state">
              No hay documentos compatibles en la carpeta de Documentos.
            </div>
          </div>
        </section>

        <!-- PESTAÑA: PLANTILLAS -->
        <section v-else-if="sidebarTab === 'plantillas'" class="hub-section">
          <header class="hub-welcome-header">
            <h2>Plantillas destacadas</h2>
            <p>Comienza rápidamente a trabajar a partir de modelos preconfigurados.</p>
          </header>
          
          <div class="templates-grid">
            <div class="template-card" @click="loadTemplate('docx', 'Informe del Sistema')">
              <FileTextIcon class="template-icon icon-docx" />
              <h4>Informe de Sistema</h4>
              <span>Estructura formal para reportes técnicos</span>
            </div>
            <div class="template-card" @click="loadTemplate('xlsx', 'Presupuesto de Red')">
              <TableIcon class="template-icon icon-xlsx" />
              <h4>Presupuesto de Red</h4>
              <span>Hoja de cálculo con fórmulas de cálculo</span>
            </div>
          </div>
        </section>
      </main>
    </div>

    <!-- ── CASO 2: EDITOR DOCX (MICROSOFT WORD) ── -->
    <div v-else-if="activeMode === 'docx'" class="office-editor-view">
      <!-- Word Bar Principal -->
      <div class="editor-top-bar word-theme-bar">
        <button class="top-bar-back-btn" @click="backToHub" title="Volver a Office 365">
          <ArrowLeftIcon class="top-bar-back-icon" />
        </button>
        <span class="top-bar-doc-title">{{ fileNameInput }} - Word</span>
      </div>

      <!-- Ribbon Bar Estilo Microsoft Word -->
      <header class="editor-ribbon">
        <div class="ribbon-group font-family-group">
          <select class="ribbon-select" title="Fuente" disabled>
            <option>Calibri</option>
            <option>Arial</option>
            <option>Georgia</option>
          </select>
        </div>

        <div class="ribbon-divider"></div>

        <div class="ribbon-group font-size-group">
          <span class="ribbon-label">Tamaño:</span>
          <select class="ribbon-select" v-model="selectedFontSize" @change="applyFontSize" title="Tamaño de fuente">
            <option value="1">10 pt</option>
            <option value="2">12 pt</option>
            <option value="3">14 pt</option>
            <option value="4">16 pt</option>
            <option value="5">20 pt</option>
            <option value="6">28 pt</option>
            <option value="7">36 pt</option>
          </select>
        </div>

        <div class="ribbon-divider"></div>

        <div class="ribbon-group">
          <button class="ribbon-btn" @click="formatDoc('bold')" title="Negrita (Ctrl+B)">
            <BoldIcon class="ribbon-icon font-weight-bold-icon" />
          </button>
          <button class="ribbon-btn" @click="formatDoc('italic')" title="Cursiva (Ctrl+I)">
            <ItalicIcon class="ribbon-icon font-italic-icon" />
          </button>
          <button class="ribbon-btn" @click="formatDoc('underline')" title="Subrayado (Ctrl+U)">
            <UnderlineIcon class="ribbon-icon font-underline-icon" />
          </button>
        </div>

        <div class="ribbon-divider"></div>

        <div class="ribbon-group">
          <button class="ribbon-btn" @click="formatDoc('justifyLeft')" title="Alinear a la izquierda">
            <AlignLeftIcon class="ribbon-icon" />
          </button>
          <button class="ribbon-btn" @click="formatDoc('justifyCenter')" title="Centrar">
            <AlignCenterIcon class="ribbon-icon" />
          </button>
          <button class="ribbon-btn" @click="formatDoc('justifyRight')" title="Alinear a la derecha">
            <AlignRightIcon class="ribbon-icon" />
          </button>
          <button class="ribbon-btn" @click="formatDoc('justifyFull')" title="Justificar">
            <AlignJustifyIcon class="ribbon-icon" />
          </button>
        </div>

        <!-- Acciones de Guardar -->
        <div class="ribbon-actions">
          <input
            v-model="fileNameInput"
            type="text"
            class="ribbon-filename-input"
            placeholder="documento.docx"
            spellcheck="false"
          />
          <button class="ribbon-save-btn word-theme-btn" @click="saveDocxFile">
            <SaveIcon class="save-icon" />
            Guardar
          </button>
        </div>
      </header>

      <!-- Espacio de trabajo papel Word -->
      <div class="editor-workspace">
        <div class="paper-wrapper">
          <div
            ref="docxEditorRef"
            class="virtual-paper"
            contenteditable="true"
            spellcheck="false"
            role="textbox"
            aria-multiline="true"
            aria-label="Documento de texto de Word"
          ></div>
        </div>
      </div>
    </div>

    <!-- ── CASO 3: EDITOR XLSX (MICROSOFT EXCEL) ── -->
    <div v-else-if="activeMode === 'xlsx'" class="office-editor-view">
      <!-- Excel Bar Principal -->
      <div class="editor-top-bar excel-theme-bar">
        <button class="top-bar-back-btn" @click="backToHub" title="Volver a Office 365">
          <ArrowLeftIcon class="top-bar-back-icon" />
        </button>
        <span class="top-bar-doc-title">{{ fileNameInput }} - Excel</span>
      </div>

      <!-- Ribbon Bar Estilo Microsoft Excel -->
      <header class="editor-ribbon">
        <!-- Paleta de Relleno Profesional de Excel (Colores Pasteles Oficiales) -->
        <div class="ribbon-group color-picker-group">
          <span class="color-picker-label"><PaintbrushIcon class="brush-icon" /> Relleno:</span>
          <button
            v-for="color in fillColors"
            :key="color.class"
            class="color-dot"
            :class="[color.class, { 'active-color': activeFillColorClass === color.class }]"
            @click="applyCellColor(color.class)"
            :title="color.label"
          ></button>
        </div>

        <div class="ribbon-divider"></div>

        <!-- Herramientas básicas de organización -->
        <div class="ribbon-group">
          <button class="ribbon-btn excel-ribbon-btn" @click="clearSelectedCell" title="Limpiar contenido de celda">
            Limpiar celda
          </button>
          <button class="ribbon-btn excel-ribbon-btn" @click="sumActiveColumn" title="Calcular Sumatoria de columna activa">
            ∑ Autosuma
          </button>
        </div>

        <!-- Acciones de Guardar -->
        <div class="ribbon-actions">
          <input
            v-model="fileNameInput"
            type="text"
            class="ribbon-filename-input"
            placeholder="planilla.xlsx"
            spellcheck="false"
          />
          <button class="ribbon-save-btn excel-theme-btn" @click="saveXlsxFile">
            <SaveIcon class="save-icon" />
            Guardar
          </button>
        </div>
      </header>

      <!-- Cuadrícula de Hoja de Cálculo Interactiva de Excel -->
      <div class="spreadsheet-workspace">
        <div class="xlsx-sheet-card">
          <div class="sheet-table-wrapper">
            <table class="xlsx-table">
              <thead>
                <tr>
                  <th class="col-header corner-header"></th>
                  <th v-for="col in xlsxCols" :key="col" class="col-header">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in xlsxRows" :key="row">
                  <td class="row-header">{{ row }}</td>
                  <td
                    v-for="col in xlsxCols"
                    :key="col"
                    class="xlsx-cell"
                    :class="getCellBgClass(row, col)"
                    @click="focusCell(row, col)"
                  >
                    <input
                      type="text"
                      class="cell-input"
                      v-model="xlsxGrid[`${col}${row}`].value"
                      @focus="focusCell(row, col)"
                      spellcheck="false"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ── CASO 4: VISOR PDF ADOBE ACROBAT ── -->
    <div v-else-if="activeMode === 'pdf'" class="office-editor-view">
      <!-- PDF Bar Principal -->
      <div class="editor-top-bar pdf-theme-bar">
        <button class="top-bar-back-btn" @click="backToHub" title="Volver a Office 365">
          <ArrowLeftIcon class="top-bar-back-icon" />
        </button>
        <span class="top-bar-doc-title">{{ fileNameInput }} - Visor PDF</span>
      </div>

      <div class="pdf-workspace">
        <div class="pdf-hologram-sheet">
          <BookOpenIcon class="pdf-deco-icon" />
          <h2 class="pdf-doc-title">{{ pdfTitle }}</h2>
          <div class="pdf-divider"></div>
          
          <div class="pdf-content-blocks">
            <template v-if="pdfBody">
              <p class="pdf-body-text">{{ pdfBody }}</p>
            </template>
            <template v-else>
              <h3>Capítulo 1.0: Arquitectura del Entorno</h3>
              <p>El entorno de escritorio está estructurado sobre bases desacopladas coordinando un backend liviano escrito en Go nativo y un frontend robusto reactivo en Vue 3 y Pinia para simulaciones de hardware en tiempo real.</p>
              
              <h3>Capítulo 2.0: Telemetría y Monitoreo de Recursos</h3>
              <p>Las llamadas de monitoreo se enlazan vía WebSockets con telemetría que actualiza variables críticas de CPU y Memoria cada segundo para su posterior graficación e inspección en el Monitor de Recursos.</p>

              <h3>Capítulo 3.0: Persistencia Física Segura</h3>
              <p>Todos los documentos y archivos generados (documentos de Word, planillas de Excel) se escriben directamente al disco físico del equipo anfitrión a través de la API expuesta por el puente IPC de Electron en el workspace del proyecto.</p>
            </template>
          </div>
          
          <span class="pdf-watermark">CONFIDENCIAL • EXCLUSIVO PARA DESARROLLO DE VUEOS</span>
        </div>
      </div>
    </div>

    <!-- Mensaje Toast de Guardado Rápido -->
    <div class="save-toast" :class="{ 'toast-visible': saveMessage }">
      {{ saveMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue';
import { useOSStore } from '@/stores/osStore';
import { useUserStore } from '@/stores/userStore';
import {
  Home as HomeIcon,
  FolderOpen as FolderOpenIcon,
  LayoutTemplate as LayoutTemplateIcon,
  Plus as PlusIcon,
  FileText as FileTextIcon,
  Table as TableIcon,
  Tv as TvIcon,
  BookOpen as BookOpenIcon,
  ArrowLeft as ArrowLeftIcon,
  Save as SaveIcon,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  AlignLeft as AlignLeftIcon,
  AlignCenter as AlignCenterIcon,
  AlignRight as AlignRightIcon,
  AlignJustify as AlignJustifyIcon,
  Paintbrush as PaintbrushIcon
} from 'lucide-vue-next';

const osStore = useOSStore();
const userStore = useUserStore();

// Modos principales: 'hub', 'docx', 'xlsx', 'pdf'
const activeMode = ref<'hub' | 'docx' | 'xlsx' | 'pdf'>('hub');
const sidebarTab = ref<'inicio' | 'abrir' | 'plantillas'>('inicio');

// inputs de archivos
const fileNameInput = ref('');
const saveMessage = ref('');
const activeFileRef = ref<string | null>(null);

// ---- Editores Refs ----
const docxEditorRef = ref<HTMLDivElement | null>(null);

const selectedFontSize = ref('3');
function applyFontSize() {
  document.execCommand('fontSize', false, selectedFontSize.value);
  docxEditorRef.value?.focus();
}

const pdfTitle = ref('MANUAL DE KERNEL Y SEGURIDAD VIRTUAL');
const pdfBody = ref('');

// ---- Paleta de Colores de Excel (Colores Pasteles Corporativos) ----
const activeFillColorClass = ref('bg-transparent');
const fillColors = [
  { class: 'bg-transparent', label: 'Sin relleno' },
  { class: 'bg-excel-yellow', label: 'Amarillo suave' },
  { class: 'bg-excel-green', label: 'Verde suave' },
  { class: 'bg-excel-blue', label: 'Azul suave' },
  { class: 'bg-excel-orange', label: 'Naranja suave' }
];

// ---- Grilla de XLSX ----
const xlsxCols = ['A', 'B', 'C', 'D', 'E'];
const xlsxRows = [1, 2, 3, 4, 5, 6, 7, 8];

interface CellState {
  value: string;
  bgClass: string;
}

// Inicializador reactivo de celdas XLSX
const xlsxGrid = ref<Record<string, CellState>>({});
function initEmptyGrid() {
  xlsxGrid.value = {};
  for (const r of xlsxRows) {
    for (const c of xlsxCols) {
      xlsxGrid.value[`${c}${r}`] = { value: '', bgClass: 'bg-transparent' };
    }
  }
}
initEmptyGrid();

const activeCellKey = ref<string | null>(null);

function focusCell(row: number, col: string) {
  activeCellKey.value = `${col}${row}`;
  const cell = xlsxGrid.value[activeCellKey.value];
  activeFillColorClass.value = cell ? cell.bgClass : 'bg-transparent';
}

// Retorna la clase de color de fondo de una celda específica
function getCellBgClass(row: number, col: string): string {
  const cell = xlsxGrid.value[`${col}${row}`];
  return cell ? cell.bgClass : 'bg-transparent';
}

function applyCellColor(bgClass: string) {
  if (activeCellKey.value && xlsxGrid.value[activeCellKey.value]) {
    xlsxGrid.value[activeCellKey.value].bgClass = bgClass;
    activeFillColorClass.value = bgClass;
  }
}

function clearSelectedCell() {
  if (activeCellKey.value && xlsxGrid.value[activeCellKey.value]) {
    xlsxGrid.value[activeCellKey.value].value = '';
    xlsxGrid.value[activeCellKey.value].bgClass = 'bg-transparent';
    activeFillColorClass.value = 'bg-transparent';
  }
}

function sumActiveColumn() {
  if (!activeCellKey.value) return;
  const col = activeCellKey.value.charAt(0);
  let total = 0;
  
  for (const r of xlsxRows) {
    const val = parseFloat(xlsxGrid.value[`${col}${r}`].value);
    if (!isNaN(val)) total += val;
  }

  // Guardar sumatoria en la celda activa seleccionada
  xlsxGrid.value[activeCellKey.value].value = total.toString();
}

// Filtro de archivos con extensión ofimática guardados en Documentos
const documentFiles = computed(() => {
  const docs = osStore.fileSystem['Documentos'] || [];
  return docs.filter(f => f.name.endsWith('.docx') || f.name.endsWith('.xlsx') || f.name.endsWith('.pdf'));
});

// ---- Lanzadores y Creación ----
function launchNewDoc(mode: 'docx' | 'xlsx' | 'pdf') {
  activeMode.value = mode;
  activeFileRef.value = null;

  if (mode === 'docx') {
    fileNameInput.value = `documento-${Date.now().toString().slice(-4)}.docx`;
    nextTick(() => {
      if (docxEditorRef.value) {
        docxEditorRef.value.innerHTML = `
          <h1 style="text-align: center;">Proyecto Final: Sistemas de Operación</h1>
          <p>Este es el procesador de texto de <strong>Word</strong> para el sistema de escritorio. El editor soporta atajos de teclado y barras de herramientas dinámicas.</p>
          <p>Puedes escribir y formatear el contenido de tu documento en tiempo real y guardarlo de forma física.</p>
        `;
      }
    });
  } else if (mode === 'xlsx') {
    fileNameInput.value = `planilla-${Date.now().toString().slice(-4)}.xlsx`;
    initEmptyGrid();
  } else if (mode === 'pdf') {
    fileNameInput.value = `documento-${Date.now().toString().slice(-4)}.pdf`;
    pdfTitle.value = 'NUEVO DOCUMENTO PDF';
    pdfBody.value = '';
  }
}

function backToHub() {
  activeMode.value = 'hub';
  activeFileRef.value = null;
}

// ---- execCommand de formato DOCX ----
function formatDoc(command: string) {
  document.execCommand(command, false);
  docxEditorRef.value?.focus();
}

// ---- Persistencia: Guardar Archivos en Pinia ----
function saveDocxFile() {
  if (!docxEditorRef.value) return;
  const contentHtml = docxEditorRef.value.innerHTML;
  let filename = fileNameInput.value.trim();
  if (!filename.endsWith('.docx')) filename += '.docx';

  osStore.addFileToFolder('Documentos', {
    name: filename,
    type: 'file',
    size: `${Math.round(contentHtml.length / 1024) || 1} KB`,
    dataUrl: contentHtml
  });

  triggerToast('¡Documento guardado en Documentos!');
}

function saveXlsxFile() {
  const contentJson = JSON.stringify(xlsxGrid.value);
  let filename = fileNameInput.value.trim();
  if (!filename.endsWith('.xlsx')) filename += '.xlsx';

  osStore.addFileToFolder('Documentos', {
    name: filename,
    type: 'file',
    size: '12 KB',
    dataUrl: contentJson
  });

  triggerToast('¡Libro de cálculo guardado en Documentos!');
}

// ---- Apertura de Archivos Existentes ----
function openExistingFile(file: { name: string; dataUrl?: string }) {
  if (file.name.endsWith('.docx')) {
    activeMode.value = 'docx';
    fileNameInput.value = file.name;
    activeFileRef.value = file.name;
    nextTick(() => {
      if (docxEditorRef.value) {
        docxEditorRef.value.innerHTML = file.dataUrl || '<p></p>';
      }
    });
  } else if (file.name.endsWith('.xlsx')) {
    activeMode.value = 'xlsx';
    fileNameInput.value = file.name;
    activeFileRef.value = file.name;
    if (file.dataUrl) {
      try {
        xlsxGrid.value = JSON.parse(file.dataUrl);
      } catch (err) {
        initEmptyGrid();
      }
    } else {
      initEmptyGrid();
    }
  } else if (file.name.endsWith('.pdf')) {
    activeMode.value = 'pdf';
    fileNameInput.value = file.name;
    activeFileRef.value = file.name;
    pdfTitle.value = file.name.replace(/\.[^/.]+$/, "").toUpperCase();
    pdfBody.value = file.dataUrl || '';
  }
}

// ---- Cargar Plantillas preestablecidas ----
function loadTemplate(type: 'docx' | 'xlsx', name: string) {
  if (type === 'docx') {
    activeMode.value = 'docx';
    fileNameInput.value = 'Informe del Sistema.docx';
    nextTick(() => {
      if (docxEditorRef.value) {
        docxEditorRef.value.innerHTML = `
          <h1 style="text-align: center; color: #0f6cbd;">INFORME DEL SISTEMA OPERATIVO</h1>
          <p>Estado general del equipo: <strong>OPERATIVO</strong></p>
          <p>Frecuencia de CPU base: <strong>3.80 GHz</strong></p>
          <p>Todo el software de simulación e interfaces se encuentran cargados de forma óptima.</p>
        `;
      }
    });
  } else if (type === 'xlsx') {
    activeMode.value = 'xlsx';
    fileNameInput.value = 'Presupuesto de Red.xlsx';
    initEmptyGrid();
    xlsxGrid.value['A1'].value = 'Cables';
    xlsxGrid.value['B1'].value = '150';
    xlsxGrid.value['A2'].value = 'Routers';
    xlsxGrid.value['B2'].value = '350';
    xlsxGrid.value['A3'].value = 'Total';
  }
}

function triggerToast(msg: string) {
  saveMessage.value = msg;
  setTimeout(() => {
    saveMessage.value = '';
  }, 2500);
}

// ---- Asociación de Archivos Abiertos ----
function handleActiveOpenFile() {
  const file = osStore.activeOpenFile;
  if (file && (file.name.endsWith('.docx') || file.name.endsWith('.xlsx') || file.name.endsWith('.pdf'))) {
    openExistingFile(file);
    osStore.activeOpenFile = null;
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
.office-container {
  display: flex;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-family-base);
  overflow: hidden;
  position: relative;
}

/* ── ESTILOS DEL HUB INICIAL (MICROSOFT 365) ── */
.office-hub-view {
  display: flex;
  width: 100%;
  height: 100%;
}

.hub-sidebar {
  width: 230px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 12px;
  user-select: none;
  flex-shrink: 0;
}

.sidebar-top {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.office-logo-container {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 12px 8px;
}

.office-logo-svg {
  width: 24px;
  height: 24px;
}

.office-brand-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #eff0f1;
}

.sidebar-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 12px;
}

.sidebar-tab {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.sidebar-tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sidebar-tab-active {
  background: var(--bg-active) !important;
  color: var(--accent) !important;
  box-shadow: inset 3px 0 0 0 var(--accent);
}

.sidebar-icon {
  width: 16px;
  height: 16px;
}

.sidebar-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 16px;
}

.nubes-header {
  font-size: 0.7rem;
  font-weight: bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding: 0 8px;
  display: block;
}

.nube-empty {
  font-size: 0.75rem;
  color: var(--text-secondary);
  padding: 4px 8px;
  opacity: 0.7;
}

/* Panel de Contenido Principal del Hub */
.hub-main-content {
  flex: 1;
  padding: 32px 40px;
  overflow-y: auto;
  background: var(--bg-primary);
}

.hub-section {
  display: flex;
  flex-direction: column;
  gap: 28px;
  height: 100%;
}

.hub-welcome-header h2 {
  font-size: 1.35rem;
  font-weight: 700;
  color: #eff0f1;
  margin-bottom: 4px;
}

.hub-welcome-header p {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Rejilla de Lanzadores */
.launchers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.launch-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  outline: none;
  text-align: left;
}

.launch-card:hover {
  border-color: var(--accent);
  background: var(--bg-hover);
  transform: translateY(-2px);
}

.icon-circle {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-circle-docx { background: rgba(15, 110, 189, 0.15); color: #0f6cbd; }
.icon-circle-xlsx { background: rgba(16, 124, 65, 0.15); color: #107c41; }
.icon-circle-pptx { background: rgba(209, 62, 27, 0.15); color: #d13e1b; }
.icon-circle-pdf { background: rgba(196, 38, 46, 0.15); color: #c4262e; }

.card-icon {
  width: 18px;
  height: 18px;
}

.card-text {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 0.82rem;
  font-weight: bold;
  color: #eff0f1;
}

.card-sublabel {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

/* Tabla de Archivos Recientes */
.recent-files-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recent-table-wrapper {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.recent-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.8rem;
}

.recent-table th {
  background: rgba(2, 6, 23, 0.25);
  padding: 10px 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid var(--border-color);
}

.recent-table td {
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
  color: #eff0f1;
}

.recent-row {
  cursor: pointer;
  transition: background var(--transition-fast) ease;
}

.recent-row:hover {
  background: var(--bg-hover);
}

.table-file-icon {
  width: 14px;
  height: 14px;
  margin-right: 10px;
  display: inline-block;
  vertical-align: middle;
}

.icon-docx { color: #0f6cbd; }
.icon-xlsx { color: #107c41; }
.icon-pdf { color: #c4262e; }

.filename-span {
  font-weight: 600;
}

.format-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: bold;
}

.tag-docx { background: rgba(15, 110, 189, 0.12); color: #0f6cbd; border: 1px solid rgba(15, 110, 189, 0.2); }
.tag-xlsx { background: rgba(16, 124, 65, 0.12); color: #107c41; border: 1px solid rgba(16, 124, 65, 0.2); }
.tag-pdf { background: rgba(196, 38, 46, 0.12); color: #c4262e; border: 1px solid rgba(196, 38, 46, 0.2); }

.table-empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 24px 0;
  opacity: 0.7;
}

/* Examinar local */
.local-explorer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 16px;
}

.explorer-file-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.explorer-file-card:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
  transform: translateY(-1px);
}

.explorer-file-icon {
  width: 24px;
  height: 24px;
}

.explorer-filename {
  font-size: 0.75rem;
  color: #eff0f1;
  font-weight: 600;
  text-align: center;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.explorer-filesize {
  font-size: 0.65rem;
  color: var(--text-secondary);
}

.empty-explorer-state {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--text-secondary);
  padding: 40px 0;
  opacity: 0.7;
}

/* Plantillas */
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.template-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 20px;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.template-card:hover {
  border-color: var(--accent);
  background: var(--bg-hover);
}

.template-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 12px;
}

.template-card h4 {
  font-size: 0.88rem;
  font-weight: 700;
  color: #eff0f1;
  margin-bottom: 4px;
}

.template-card span {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* ── ESTILOS DEL EDITOR CORE ── */
.office-editor-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
}

/* Cabeceras de Editor estilo Office */
.editor-top-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 38px;
  padding: 0 16px;
  color: #ffffff;
  user-select: none;
}

.word-theme-bar { background: #0f6cbd; }
.excel-theme-bar { background: #107c41; }
.pdf-theme-bar { background: #c4262e; }

.top-bar-back-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  transition: background var(--transition-fast) ease;
}

.top-bar-back-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.top-bar-back-icon {
  width: 14px;
  height: 14px;
}

.top-bar-doc-title {
  font-size: 0.82rem;
  font-weight: 600;
}

/* Ribbon de Herramientas */
.editor-ribbon {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  padding: 0 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  user-select: none;
  flex-shrink: 0;
}

.ribbon-select {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  padding: 4px 8px;
  font-size: 0.75rem;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.2s ease;
}

.ribbon-select:focus,
.ribbon-select:hover {
  border-color: var(--accent);
}

.ribbon-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-right: 4px;
}

.ribbon-group {
  display: flex;
  gap: 4px;
  align-items: center;
}

.ribbon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  font-size: 0.75rem;
}

.ribbon-btn:hover {
  background: var(--bg-hover);
  color: var(--accent);
  border-color: var(--border-color);
}

.ribbon-icon {
  width: 15px;
  height: 15px;
}

.ribbon-divider {
  width: 1px;
  height: 18px;
  background: var(--border-color);
}

.ribbon-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ribbon-filename-input {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 8px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.78rem;
  outline: none;
  width: 160px;
}

.ribbon-filename-input:focus {
  border-color: var(--accent);
}

.ribbon-save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.word-theme-btn {
  background: rgba(15, 110, 189, 0.15);
  border-color: rgba(15, 110, 189, 0.3);
  color: #0f6cbd;
}
.word-theme-btn:hover {
  background: #0f6cbd;
  color: #ffffff;
}

.excel-theme-btn {
  background: rgba(16, 124, 65, 0.15);
  border-color: rgba(16, 124, 65, 0.3);
  color: #107c41;
}
.excel-theme-btn:hover {
  background: #107c41;
  color: #ffffff;
}

.excel-ribbon-btn {
  font-weight: 600;
  padding: 0 8px;
  height: 28px;
  width: auto;
}

.save-icon {
  width: 13px;
  height: 13px;
}

/* ---- WORD WORKSPACE ---- */
.editor-workspace {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #2b2b2b;
  display: flex;
  justify-content: center;
}

.paper-wrapper {
  width: 100%;
  max-width: 760px;
  min-height: 100%;
}

.virtual-paper {
  width: 100%;
  min-height: 750px;
  background: #ffffff;
  color: #201f1e;
  padding: 60px 50px;
  border-radius: 2px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
  outline: none;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 0.95rem;
  line-height: 1.5;
  text-align: left;
}

/* ---- EXCEL WORKSPACE ---- */
.spreadsheet-workspace {
  flex: 1;
  padding: 16px;
  background: #2b2b2b;
  overflow: auto;
}

.xlsx-sheet-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  width: 100%;
}

.sheet-table-wrapper {
  overflow-x: auto;
  width: 100%;
}

.xlsx-table {
  width: 100%;
  border-collapse: collapse;
}

.col-header,
.row-header {
  background: #252525;
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  color: rgba(255, 255, 255, 0.4);
  font-family: var(--font-family-base);
  font-size: 0.72rem;
  font-weight: bold;
  height: 26px;
  user-select: none;
  text-align: center;
}

.corner-header,
.row-header {
  width: 40px;
  max-width: 40px;
}

.xlsx-cell {
  height: 26px;
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  position: relative;
  transition: background-color var(--transition-fast) ease;
}

.cell-input {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-family: monospace;
  font-size: 0.78rem;
  padding: 0 6px;
}

/* Paleta de colores profesionales Excel */
.color-picker-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-picker-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.brush-icon {
  width: 12px;
  height: 12px;
}

.color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 0.15s ease;
}

.color-dot:hover {
  transform: scale(1.15);
}

.active-color {
  border-color: #ffffff !important;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);
}

/* Estilos de celdas coloridas Excel */
.bg-transparent { background-color: transparent; }
.bg-excel-yellow { background-color: #fff2cc; }
.bg-excel-green { background-color: #e2efda; }
.bg-excel-blue { background-color: #ddebf7; }
.bg-excel-orange { background-color: #fce4d6; }

.xlsx-cell.bg-excel-yellow .cell-input { color: #3c3c3c; font-weight: 600; }
.xlsx-cell.bg-excel-green .cell-input { color: #3c3c3c; font-weight: 600; }
.xlsx-cell.bg-excel-blue .cell-input { color: #3c3c3c; font-weight: 600; }
.xlsx-cell.bg-excel-orange .cell-input { color: #3c3c3c; font-weight: 600; }

/* ---- PDF WORKSPACE ---- */
.pdf-workspace {
  flex: 1;
  padding: 24px;
  background: #2b2b2b;
  display: flex;
  justify-content: center;
  overflow-y: auto;
}

.pdf-hologram-sheet {
  width: 100%;
  max-width: 680px;
  background: #ffffff;
  color: #201f1e;
  border: 1px solid #dcdcdc;
  border-radius: 2px;
  padding: 40px 30px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
  text-align: left;
}

.pdf-deco-icon {
  width: 32px;
  height: 32px;
  color: #c4262e;
  margin-bottom: 12px;
}

.pdf-doc-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #201f1e;
}

.pdf-divider {
  width: 100%;
  height: 1px;
  background: #dcdcdc;
  margin: 14px 0 20px 0;
}

.pdf-content-blocks h3 {
  font-size: 0.88rem;
  color: #c4262e;
  margin-top: 16px;
  margin-bottom: 6px;
}

.pdf-content-blocks p {
  font-size: 0.8rem;
  line-height: 1.5;
  color: #4a4a4a;
  margin-bottom: 12px;
}

.pdf-body-text {
  font-size: 0.8rem;
  line-height: 1.5;
  color: #4a4a4a;
  white-space: pre-wrap;
  background: #fdfdfd;
  border: 1px dashed #dcdcdc;
  border-radius: 4px;
  padding: 12px;
}

.pdf-watermark {
  display: block;
  text-align: center;
  font-family: monospace;
  font-size: 0.65rem;
  font-weight: bold;
  color: rgba(196, 38, 46, 0.25);
  margin-top: 40px;
  letter-spacing: 1px;
}

/* ---- GENERAL SAVING TOAST ---- */
.save-toast {
  position: absolute;
  top: 48px;
  left: 50%;
  transform: translateX(-50%);
  background: #107c41;
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 6px 16px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 1000;
}

.toast-visible {
  opacity: 1;
  transform: translateX(-50%) translateY(4px);
}
</style>
