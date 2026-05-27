<template>
  <button
    type="button"
    class="toggle-switch"
    :class="{ 'switch-active': modelValue }"
    @click="toggle"
    role="switch"
    :aria-checked="modelValue"
  >
    <span class="switch-handle"></span>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

function toggle() {
  emit('update:modelValue', !props.modelValue);
}
</script>

<style scoped>
.toggle-switch {
  width: 42px;
  height: 22px;
  background-color: var(--bg-primary); /* Fondo inactivo adaptado */
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  position: relative;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  outline: none;
  box-sizing: border-box; /* Asegurar box-sizing */
}

.toggle-switch:focus-visible {
  box-shadow: 0 0 0 2px rgba(61, 174, 233, 0.4);
  border-color: var(--accent);
}

.switch-active {
  background-color: var(--accent) !important; /* Acento Breeze */
  border-color: var(--accent) !important;
}

.switch-handle {
  width: 14px;
  height: 14px;
  background-color: var(--text-primary); /* Círculo hereda color de texto primario */
  border-radius: 50%;
  position: absolute;
  top: 3px; /* Alinear arriba explícitamente */
  left: 3px; /* Alinear izquierda explícitamente */
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.switch-active .switch-handle {
  transform: translateX(20px); /* 3px left + 20px shift = 23px. Con ancho 14px, 23px + 14px = 37px. Margen derecho = 42px - 37px = 5px. Perfectamente simétrico y seguro. */
  background-color: var(--bg-panel); /* Círculo cambia para contraste óptimo */
}
</style>
