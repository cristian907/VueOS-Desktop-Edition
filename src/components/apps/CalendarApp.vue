<template>
  <div class="calendar-app">
    <!-- PANEL PRINCIPAL (IZQUIERDO/CENTRO): CUADRÍCULA DE DÍAS -->
    <div class="calendar-main">
      <!-- Cabecera del Mes -->
      <header class="calendar-header">
        <h3 class="month-title">{{ formattedMonthYear }}</h3>
        <div class="header-nav">
          <button type="button" class="nav-arrow-btn" @click="prevMonth" title="Mes anterior">
            <ChevronLeftIcon class="arrow-icon" />
          </button>
          <button type="button" class="nav-arrow-btn" @click="nextMonth" title="Siguiente mes">
            <ChevronRightIcon class="arrow-icon" />
          </button>
        </div>
      </header>

      <!-- Días de la Semana (Etiquetas) -->
      <div class="weekdays-grid">
        <span v-for="day in WEEKDAYS" :key="day" class="weekday-lbl">{{ day }}</span>
      </div>

      <!-- Cuadrícula del Mes Real -->
      <div class="days-grid">
        <!-- Días de desborde del mes anterior -->
        <div
          v-for="blank in blankDays"
          :key="`blank-${blank}`"
          class="day-cell day-overflow"
        >
          <span class="day-num">{{ blank }}</span>
        </div>

        <!-- Días del mes activo -->
        <button
          v-for="day in daysInMonth"
          :key="`day-${day}`"
          type="button"
          class="day-cell"
          :class="{
            'day-today': isToday(day),
            'day-selected': isSelected(day)
          }"
          @click="selectDay(day)"
        >
          <span class="day-num">{{ day }}</span>
          
          <!-- Indicador de Eventos (Punto Cian) -->
          <div v-if="hasEvent(day)" class="event-indicator" aria-hidden="true"></div>
        </button>
      </div>
    </div>

    <!-- PANEL LATERAL DERECHO: DETALLES DE EVENTOS PARA EL DÍA SELECCIONADO -->
    <aside class="calendar-sidebar">
      <div class="sidebar-header">
        <CalendarIcon class="sidebar-icon" />
        <span class="sidebar-title">{{ formattedSelectedDate }}</span>
      </div>

      <!-- Listado de Eventos del Día -->
      <div class="events-list">
        <div v-if="selectedDayEvents.length === 0" class="empty-events">
          Sin eventos agendados para este día.
        </div>
        <div
          v-for="ev in selectedDayEvents"
          :key="ev.id"
          class="event-card"
        >
          <div class="event-card-body">
            <span class="event-card-title">{{ ev.title }}</span>
          </div>
          <button
            type="button"
            class="delete-event-btn"
            @click="deleteEvent(ev.id)"
            title="Eliminar evento"
          >
            ×
          </button>
        </div>
      </div>

      <!-- Formulario para agregar un nuevo evento -->
      <div class="add-event-form">
        <span class="form-title">Agregar Evento</span>
        <div class="form-row">
          <input
            v-model="newEventTitle"
            type="text"
            placeholder="Título del evento..."
            class="styled-input"
            spellcheck="false"
            @keydown.enter="addNewEvent"
          />
          <button type="button" class="add-btn" @click="addNewEvent">
            +
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useProductivityStore } from '@/stores/productivityStore';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Calendar as CalendarIcon
} from 'lucide-vue-next';

const productivityStore = useProductivityStore();

// Constantes
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ---- Estados de Fecha ----
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth()); // 0-indexed (Ene = 0)
const selectedDay = ref<number>(new Date().getDate());

// Formatear Mes y Año para la Cabecera
const formattedMonthYear = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value, 1);
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
});

// Formatear Fecha Seleccionada para el Sidebar
const formattedSelectedDate = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value, selectedDay.value);
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
});

// Obtener formato estándar 'YYYY-MM-DD' para los eventos en el store
function getIsoDate(day: number): string {
  const mm = String(currentMonth.value + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${currentYear.value}-${mm}-${dd}`;
}

// ---- Generación de Días del Mes ----
const daysInMonth = computed(() => {
  const totalDays = new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
  return Array.from({ length: totalDays }, (_, i) => i + 1);
});

// Días de desborde del mes anterior para alinear la cuadrícula (blank days)
const blankDays = computed(() => {
  const firstDayIndex = new Date(currentYear.value, currentMonth.value, 1).getDay(); // 0 (Dom) a 6 (Sáb)
  if (firstDayIndex === 0) return [];
  
  // Obtener los últimos días del mes anterior
  const prevMonthTotalDays = new Date(currentYear.value, currentMonth.value, 0).getDate();
  const overflowDays = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    overflowDays.push(prevMonthTotalDays - i);
  }
  return overflowDays;
});

// ---- Lógica de Eventos ----
const selectedDayEvents = computed(() => {
  const isoStr = getIsoDate(selectedDay.value);
  return productivityStore.events.filter((ev) => ev.date === isoStr);
});

function hasEvent(day: number): boolean {
  const isoStr = getIsoDate(day);
  return productivityStore.events.some((ev) => ev.date === isoStr);
}

const newEventTitle = ref('');

function addNewEvent() {
  const title = newEventTitle.value.trim();
  if (!title) return;

  const isoStr = getIsoDate(selectedDay.value);
  productivityStore.addEvent(isoStr, title);
  newEventTitle.value = '';
}

function deleteEvent(id: string) {
  productivityStore.deleteEvent(id);
}

// ---- Navegación del Calendario ----
function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
  selectedDay.value = 1;
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
  selectedDay.value = 1;
}

function selectDay(day: number) {
  selectedDay.value = day;
}

function isToday(day: number): boolean {
  const today = new Date();
  return (
    today.getDate() === day &&
    today.getMonth() === currentMonth.value &&
    today.getFullYear() === currentYear.value
  );
}

function isSelected(day: number): boolean {
  return selectedDay.value === day;
}
</script>

<style scoped>
.calendar-app {
  display: flex;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-family-base);
  overflow: hidden;
  user-select: none;
}

/* Panel Principal (Calendario) */
.calendar-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 16px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.month-title {
  font-size: 1.15rem;
  font-weight: 700;
  text-transform: capitalize;
  color: var(--text-primary);
}

.header-nav {
  display: flex;
  gap: 6px;
}

.nav-arrow-btn {
  background: var(--bg-secondary);
  border: var(--glass-border);
  border-radius: 6px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.nav-arrow-btn:hover {
  background: var(--neon-cyan);
  color: #11111b;
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}

.arrow-icon {
  width: 16px;
  height: 16px;
}

/* Grid de etiquetas de días */
.weekdays-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  text-align: center;
}

.weekday-lbl {
  font-size: 0.75rem;
  font-weight: bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Grid de celdas del mes */
.days-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 6px;
}

.day-cell {
  background: var(--glass-bg);
  border: var(--glass-border);
  border-radius: 8px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.day-cell:hover:not(.day-overflow) {
  border-color: var(--neon-cyan);
  background: rgba(255, 255, 255, 0.04);
}

.day-num {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* Celdas desbordadas (mes anterior) */
.day-overflow {
  background: transparent;
  border-color: transparent;
  cursor: default;
  opacity: 0.25;
}

.day-overflow .day-num {
  color: var(--text-secondary);
}

/* Día de hoy */
.day-today {
  border-color: var(--neon-magenta) !important;
}

.day-today .day-num {
  color: var(--neon-magenta);
  font-weight: bold;
}

/* Día seleccionado */
.day-selected {
  border-color: var(--neon-cyan) !important;
  background: rgba(0, 243, 255, 0.04) !important;
  box-shadow: var(--glow-cyan);
}

.day-selected .day-num {
  color: var(--neon-cyan);
  font-weight: bold;
}

/* Indicador de Eventos (Punto Cian) */
.event-indicator {
  position: absolute;
  bottom: 8px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}

.day-selected .event-indicator {
  background-color: var(--neon-cyan);
}

/* Panel Lateral Derecho */
.calendar-sidebar {
  width: 250px;
  background: var(--bg-secondary);
  border-left: var(--glass-border);
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 16px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: var(--glass-border);
}

.sidebar-icon {
  width: 16px;
  height: 16px;
  color: var(--neon-cyan);
}

.sidebar-title {
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--text-primary);
}

/* Listado de eventos */
.events-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.empty-events {
  font-size: 0.78rem;
  color: var(--text-secondary);
  text-align: center;
  padding: 24px 0;
  line-height: 1.4;
}

.event-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--glass-bg);
  border: var(--glass-border);
  border-radius: 8px;
  padding: 8px 12px;
  gap: 10px;
  transition: border-color 0.2s;
}

.event-card:hover {
  border-color: rgba(0, 243, 255, 0.2);
}

.event-card-title {
  font-size: 0.8rem;
  color: var(--text-primary);
  word-break: break-word;
  line-height: 1.3;
}

.delete-event-btn {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1;
  padding: 0 2px;
  transition: color 0.2s;
}

.delete-event-btn:hover {
  color: #f43f5e;
}

/* Formulario */
.add-event-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: var(--glass-border);
}

.form-title {
  font-size: 0.75rem;
  font-weight: bold;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.form-row {
  display: flex;
  gap: 8px;
}

.styled-input {
  flex: 1;
  background: var(--bg-primary);
  border: var(--glass-border);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.78rem;
  outline: none;
  transition: all 0.2s;
}

.styled-input:focus {
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}

.add-btn {
  background: var(--bg-primary);
  border: var(--glass-border);
  border-radius: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}

.add-btn:hover {
  background: var(--neon-cyan);
  color: #11111b;
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}
</style>
