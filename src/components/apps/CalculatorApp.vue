<template>
  <div class="calculator-app">
    <!-- Pantalla Superior de Resultados -->
    <div class="calc-screen" aria-live="polite">
      <div class="calc-history">{{ historyText }}</div>
      <div class="calc-current">{{ currentDisplay }}</div>
    </div>

    <!-- Botonera Integrada (CSS Grid) -->
    <div class="calc-keypad">
      <!-- Fila 1: Modificadores y Operadores Especiales -->
      <button type="button" class="btn btn-special" @click="clear">C</button>
      <button type="button" class="btn btn-special" @click="toggleSign">±</button>
      <button type="button" class="btn btn-special" @click="percent">%</button>
      <button type="button" class="btn btn-operator" @click="setOperator('/')">/</button>

      <!-- Fila 2: 7, 8, 9 y Operador Multiplicación -->
      <button type="button" class="btn btn-num" @click="appendNumber('7')">7</button>
      <button type="button" class="btn btn-num" @click="appendNumber('8')">8</button>
      <button type="button" class="btn btn-num" @click="appendNumber('9')">9</button>
      <button type="button" class="btn btn-operator" @click="setOperator('*')">*</button>

      <!-- Fila 3: 4, 5, 6 y Operador Resta -->
      <button type="button" class="btn btn-num" @click="appendNumber('4')">4</button>
      <button type="button" class="btn btn-num" @click="appendNumber('5')">5</button>
      <button type="button" class="btn btn-num" @click="appendNumber('6')">6</button>
      <button type="button" class="btn btn-operator" @click="setOperator('-')">-</button>

      <!-- Fila 4: 1, 2, 3 y Operador Suma -->
      <button type="button" class="btn btn-num" @click="appendNumber('1')">1</button>
      <button type="button" class="btn btn-num" @click="appendNumber('2')">2</button>
      <button type="button" class="btn btn-num" @click="appendNumber('3')">3</button>
      <button type="button" class="btn btn-operator" @click="setOperator('+')">+</button>

      <!-- Fila 5: 0, decimal, y botón de resultado final -->
      <button type="button" class="btn btn-num btn-zero" @click="appendNumber('0')">0</button>
      <button type="button" class="btn btn-num" @click="appendDecimal">.</button>
      <button type="button" class="btn btn-equals" @click="calculateResult">=</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// ---- Estados Reactivos de la Operación ----
const currentInput = ref('0');
const previousInput = ref('');
const activeOperator = ref('');
const isNewOperation = ref(true);

// Texto de historial superior
const historyText = computed(() => {
  if (!activeOperator.value) return '';
  return `${previousInput.value} ${activeOperator.value}`;
});

// Pantalla principal
const currentDisplay = computed(() => {
  return currentInput.value;
});

// ---- Acciones de la Botonera ----
function clear() {
  currentInput.value = '0';
  previousInput.value = '';
  activeOperator.value = '';
  isNewOperation.value = true;
}

function appendNumber(num: string) {
  if (isNewOperation.value || currentInput.value === '0') {
    currentInput.value = num;
    isNewOperation.value = false;
  } else {
    currentInput.value += num;
  }
}

function appendDecimal() {
  if (isNewOperation.value) {
    currentInput.value = '0.';
    isNewOperation.value = false;
    return;
  }
  if (!currentInput.value.includes('.')) {
    currentInput.value += '.';
  }
}

function toggleSign() {
  if (currentInput.value !== '0') {
    if (currentInput.value.startsWith('-')) {
      currentInput.value = currentInput.value.slice(1);
    } else {
      currentInput.value = '-' + currentInput.value;
    }
  }
}

function percent() {
  const val = parseFloat(currentInput.value);
  if (!isNaN(val)) {
    currentInput.value = String(val / 100);
  }
}

function setOperator(op: string) {
  if (activeOperator.value && !isNewOperation.value) {
    calculateResult();
  }
  previousInput.value = currentInput.value;
  activeOperator.value = op;
  isNewOperation.value = true;
}

function calculateResult() {
  if (!activeOperator.value || isNewOperation.value) return;

  const val1 = parseFloat(previousInput.value);
  const val2 = parseFloat(currentInput.value);
  const op = activeOperator.value;

  if (!isNaN(val1) && !isNaN(val2)) {
    let result = 0;
    switch (op) {
      case '+':
        result = val1 + val2;
        break;
      case '-':
        result = val1 - val2;
        break;
      case '*':
        result = val1 * val2;
        break;
      case '/':
        result = val2 !== 0 ? val1 / val2 : 0;
        break;
    }
    // Formatear y limitar decimales a 8 dígitos para evitar desbordes visuales
    currentInput.value = String(Math.round(result * 100000000) / 100000000);
    activeOperator.value = '';
    previousInput.value = '';
    isNewOperation.value = true;
  }
}
</script>

<style scoped>
.calculator-app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-family-base);
  padding: 16px;
  gap: 16px;
  user-select: none;
}

/* Pantalla Superior */
.calc-screen {
  background-color: var(--bg-secondary);
  border: var(--glass-border);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  height: 100px;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.4);
}

.calc-history {
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--text-secondary);
  min-height: 1.2rem;
  letter-spacing: 0.5px;
}

.calc-current {
  font-family: 'Courier New', Courier, monospace;
  font-size: 2.2rem;
  font-weight: bold;
  color: var(--text-primary);
  overflow-x: auto;
  width: 100%;
  text-align: right;
  white-space: nowrap;
}

/* Botonera */
.calc-keypad {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(5, 1fr);
  gap: 10px;
}

/* Estilos de botones estándar */
.btn {
  border-radius: 10px;
  font-size: 1.15rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

/* Botones Numéricos */
.btn-num {
  background: var(--glass-bg);
  border: var(--glass-border);
  color: var(--text-primary);
}

.btn-num:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--text-primary);
  transform: translateY(-1px);
}

/* Modificadores Especiales (Fila superior) */
.btn-special {
  background: rgba(255, 255, 255, 0.02);
  border: var(--glass-border);
  color: var(--text-secondary);
}

.btn-special:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}

/* Operadores Matemáticos */
.btn-operator {
  background: var(--bg-secondary);
  border: var(--glass-border);
  color: var(--neon-cyan); /* Acento Cyan Neón */
}

.btn-operator:hover {
  background: var(--neon-cyan);
  color: #11111b;
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
  transform: translateY(-1px);
}

/* Botón de Igual */
.btn-equals {
  background: var(--neon-magenta); /* Acento Magenta Neón */
  border: 1px solid var(--neon-magenta);
  color: #ffffff;
  grid-column: span 1;
}

.btn-equals:hover {
  background: var(--neon-magenta);
  box-shadow: var(--glow-magenta);
  transform: translateY(-1px);
}

.btn-zero {
  grid-column: span 2;
  justify-content: flex-start;
  padding-left: 28px;
}

.btn:active {
  transform: translateY(1px) scale(0.98) !important;
}
</style>
