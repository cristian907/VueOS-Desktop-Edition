import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { useOSStore } from '@/stores/osStore';

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  date: string;       // Formato: 'YYYY-MM-DD'
  title: string;
  description: string;
}

export const useProductivityStore = defineStore('productivity', () => {
  // ---- Inicializar datos del localStorage o usar arrays vacíos ----
  const savedData = localStorage.getItem('vueui-productivity');
  let initialNotes: Note[] = [
    {
      id: '1',
      title: 'Ideas del OS',
      content: 'Ideas del OS\n1. Optimizar los Toggles de interfaz.\n2. Conectar las aplicaciones a la persistencia local Pinia.\n3. Habilitar la personalización del Dock.',
      updatedAt: new Date().toISOString()
    }
  ];
  let initialEvents: CalendarEvent[] = [];

  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      if (parsed.notes) initialNotes = parsed.notes;
      if (parsed.events) initialEvents = parsed.events;
    } catch (e) {
      console.error('Error al parsear datos de productividad guardados:', e);
    }
  }

  // ---- Estados Reactivos ----
  const notes = ref<Note[]>(initialNotes);
  const activeNoteId = ref<string | null>(notes.value[0]?.id || null);
  const events = ref<CalendarEvent[]>(initialEvents);

  // ---- Watcher profundo para persistencia automática ----
  watch(
    [notes, events],
    () => {
      localStorage.setItem(
        'vueui-productivity',
        JSON.stringify({
          notes: notes.value,
          events: events.value
        })
      );
    },
    { deep: true }
  );

  // ---- Acciones de Notas ----
  function createNote() {
    const id = crypto.randomUUID();
    const newNote: Note = {
      id,
      title: 'Nota Nueva',
      content: '',
      updatedAt: new Date().toISOString()
    };
    notes.value.push(newNote);
    activeNoteId.value = id;

    // Guardar en la carpeta virtual y física de Documentos
    const osStore = useOSStore();
    const filename = `${newNote.title}-${id.slice(0, 4)}.txt`;
    osStore.addFileToFolder('Documentos', {
      name: filename,
      type: 'file',
      size: '0 KB',
      content: newNote.content
    });
  }

  function updateNote(id: string, content: string) {
    const note = notes.value.find((n) => n.id === id);
    if (note) {
      const oldTitle = note.title;
      note.content = content;
      note.updatedAt = new Date().toISOString();

      // Generar título dinámico en base al primer renglón del contenido
      const lines = content.split('\n');
      const firstLine = lines[0]?.trim();
      if (firstLine) {
        note.title = firstLine.slice(0, 20) + (firstLine.length > 20 ? '...' : '');
      } else {
        note.title = 'Nota Nueva';
      }

      // Sincronizar en Documentos
      const osStore = useOSStore();
      const oldFilename = `${oldTitle}-${id.slice(0, 4)}.txt`;
      const newFilename = `${note.title}-${id.slice(0, 4)}.txt`;

      if (oldFilename !== newFilename) {
        osStore.removeFileFromFolder('Documentos', oldFilename);
      }

      const docIndex = (osStore.fileSystem['Documentos'] || []).findIndex(f => f.name === newFilename);
      if (docIndex !== -1) {
        osStore.fileSystem['Documentos'][docIndex].content = content;
        osStore.fileSystem['Documentos'][docIndex].size = `${(content.length / 1024).toFixed(1)} KB`;
        
        // Escribir físico
        if (window.osAPI && window.osAPI.writeFile) {
          window.osAPI.writeFile('Documentos', newFilename, { content }).catch(err => console.error(err));
        }
      } else {
        osStore.addFileToFolder('Documentos', {
          name: newFilename,
          type: 'file',
          size: `${(content.length / 1024).toFixed(1)} KB`,
          content
        });
      }
    }
  }

  function deleteNote(id: string) {
    const index = notes.value.findIndex((n) => n.id === id);
    if (index === -1) return;

    const note = notes.value[index];
    const filename = `${note.title}-${id.slice(0, 4)}.txt`;
    notes.value.splice(index, 1);

    // Remover de la carpeta virtual y física
    const osStore = useOSStore();
    osStore.removeFileFromFolder('Documentos', filename);

    // Ajustar el foco de la nota activa al eliminarla
    if (activeNoteId.value === id) {
      if (notes.value.length > 0) {
        const nextActiveIndex = Math.max(0, index - 1);
        activeNoteId.value = notes.value[nextActiveIndex]?.id || null;
      } else {
        activeNoteId.value = null;
      }
    }
  }

  // ---- Acciones de Calendario ----
  function addEvent(date: string, title: string, description = '') {
    const id = crypto.randomUUID();
    const newEvent: CalendarEvent = {
      id,
      date,
      title: title.trim(),
      description: description.trim()
    };
    events.value.push(newEvent);
  }

  function deleteEvent(id: string) {
    events.value = events.value.filter((ev) => ev.id !== id);
  }

  function syncNotesFromFileSystem(files: { name: string; content?: string }[]) {
    const txtFiles = files.filter(f => f.name.endsWith('.txt'));
    if (txtFiles.length === 0) return;

    const newNotes: Note[] = txtFiles.map(file => {
      const parts = file.name.slice(0, -4).split('-');
      const idPart = parts.length > 1 ? parts[parts.length - 1] : '';
      const titlePart = parts.length > 1 ? parts.slice(0, -1).join('-') : file.name.slice(0, -4);
      
      return {
        id: idPart.length === 4 ? `${idPart}-virtual-id` : crypto.randomUUID(),
        title: titlePart || 'Nota Nueva',
        content: file.content || '',
        updatedAt: new Date().toISOString()
      };
    });

    notes.value = newNotes;
    if (newNotes.length > 0 && !newNotes.some(n => n.id === activeNoteId.value)) {
      activeNoteId.value = newNotes[0].id;
    }
  }

  return {
    notes,
    activeNoteId,
    events,
    createNote,
    updateNote,
    deleteNote,
    addEvent,
    deleteEvent,
    syncNotesFromFileSystem
  };
});
