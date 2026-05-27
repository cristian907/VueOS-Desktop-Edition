<template>
  <div class="terminal-app-container">
    <div ref="terminalRef" class="xterm-terminal-element"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useStoreStore } from '@/stores/storeStore';
import { useOSStore } from '@/stores/osStore';
import { useUserStore } from '@/stores/userStore';
import 'xterm/css/xterm.css';

// Referencia al contenedor DOM del terminal
const terminalRef = ref<HTMLDivElement | null>(null);

const storeStore = useStoreStore();
const osStore = useOSStore();
const userStore = useUserStore();

// Instancias globales del terminal
let term: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let kernelSocket: WebSocket | null = null;
let resizeObserver: ResizeObserver | null = null;

// Tiempo de inicio de la aplicación para calcular el Uptime
const appStartTime = Date.now();

// Prompt local del sistema
const prompt = `\x1b[36m[${userStore.username}@vue-os ~]$\x1b[0m `;

// Buffer de acumulación de caracteres para la línea de comando actual
let currentLine = '';

// Control interactivo de contraseña para comandos "sudo"
let isWaitingForPassword = false;
let passwordBuffer = '';
let passwordAttempts = 0;
let pendingAction = { type: '', app: '' };

/**
 * Calcula el tiempo transcurrido desde que se levantó la app en formato de minutos y segundos.
 */
function getUptime(): string {
  const diffSecs = Math.floor((Date.now() - appStartTime) / 1000);
  const mins = Math.floor(diffSecs / 60);
  const secs = diffSecs % 60;
  return `${mins}m ${secs}s`;
}

/**
 * Ejecuta la animación de descarga e instala la aplicación registrada.
 */
function executeInstall(targetApp: string): void {
  if (!term) return;
  const available = storeStore.availableApps.find((a) => a.id === targetApp);
  if (!available) {
    term.write(`\x1b[31mError: La aplicación "${targetApp}" no existe en la tienda o ya está instalada.\x1b[0m\r\n`);
    term.write(prompt);
    return;
  }

  term.write(`Descargando e instalando ${targetApp}...\r\n`);
  term.write('[          ] 0%');

  let percent = 0;
  const progressInterval = setInterval(() => {
    percent += 20;
    const bars = '#'.repeat(percent / 10);
    const spaces = ' '.repeat(10 - percent / 10);
    term?.write(`\r[${bars}${spaces}] ${percent}%`);

    if (percent >= 100) {
      clearInterval(progressInterval);
      storeStore.installApp(targetApp);
      term?.write(`\r\n\x1b[32mInstalación completada.\x1b[0m\r\n\r\n`);
      term?.write(prompt);
    }
  }, 200);
}

/**
 * Remueve la aplicación desinstalándola y cerrando sus marcos de renderizado asociados.
 */
function executeRemove(targetApp: string): void {
  if (!term) return;
  const isInstalled = storeStore.installedAppIds.includes(targetApp);
  if (!isInstalled) {
    term.write(`\x1b[31mError: La aplicación "${targetApp}" no está instalada o es un componente esencial del sistema.\x1b[0m\r\n`);
    term.write(prompt);
    return;
  }

  storeStore.uninstallApp(targetApp);
  term.write(`\x1b[31mDesinstalación completada: ${targetApp}\x1b[0m\r\n\r\n`);
  term.write(prompt);
}

/**
 * Valida la contraseña ingresada en el prompt interactivo de sudo.
 */
function handlePasswordSubmit(): void {
  if (!term) return;

  if (passwordBuffer === userStore.password) {
    isWaitingForPassword = false;
    passwordAttempts = 0;
    passwordBuffer = '';
    
    const action = pendingAction.type;
    const targetApp = pendingAction.app;

    if (action === 'install') {
      term.write('\r\n');
      executeInstall(targetApp);
    } else if (action === 'remove') {
      term.write('\r\n');
      executeRemove(targetApp);
    }
  } else {
    passwordAttempts++;
    passwordBuffer = '';

    if (passwordAttempts >= 3) {
      term.write(`\r\nsudo: 3 incorrect password attempts. Access denied.\r\n\r\n`);
      isWaitingForPassword = false;
      passwordAttempts = 0;
      term.write(prompt);
    } else {
      term.write(`\r\nsudo: incorrect password, please try again.\r\n[sudo] password for ${userStore.username}: `);
    }
  }
}

/**
 * Procesa los comandos ingresados por el usuario.
 * Discierne entre comandos emulados locales (clear, fastfetch, antpac)
 * y comandos reales que deben direccionarse a la Pseudo-Terminal (PTY) de Go.
 */
function processCommand(cmd: string): void {
  const trimmed = cmd.trim();
  if (trimmed === '') {
    // Si la línea está vacía, simplemente reescribimos el prompt
    term?.write(`\r\n${prompt}`);
    return;
  }

  const parts = trimmed.split(/\s+/);
  let hasSudo = false;
  let cmdIndex = 0;

  // Detectar anteposición del comando sudo
  if (parts[0] === 'sudo') {
    hasSudo = true;
    cmdIndex = 1;
  }

  const mainCommand = parts[cmdIndex];

  // --- Comando Emulado: clear ---
  if (mainCommand === 'clear') {
    term?.clear();
    term?.write(prompt);
    return;
  }

  // --- Comando Emulado: fastfetch ---
  if (mainCommand === 'fastfetch') {
    const uptime = getUptime();
    const installedCount = storeStore.installedAppIds.length;
    const ramVal = osStore.stats.ram_usage.toFixed(1);

    // Arte ASCII del logotipo de Vue y telemetría estructurada con estilos ANSI
    const output = [
      '\r\n',
      `\x1b[38;5;84m  ________    ________   \x1b[1;37mOS:\x1b[0m VueOS Linux`,
      `\x1b[38;5;84m  \\\\   __  \\\\  /  __   /   \x1b[1;37mHost:\x1b[0m Acer Nitro 5 AN515-45`,
      `\x1b[38;5;84m   \\\\  \\\\ \\\\  \\\\/  / /  /    \x1b[1;37mKernel:\x1b[0m Vue-Go-Daemon v1.0`,
      `\x1b[38;5;33m    \\\\  \\\\ \\\\    / /  /     \x1b[1;37mUptime:\x1b[0m ${uptime}`,
      `\x1b[38;5;33m     \\\\  \\\\/    \\\\/  /      \x1b[1;37mPackages:\x1b[0m ${installedCount} antpac`,
      `\x1b[38;5;33m      \\\\          /       \x1b[1;37mShell:\x1b[0m antor-shell`,
      `\x1b[38;5;33m       \\\\________/        \x1b[1;37mCPU:\x1b[0m AMD Ryzen 5 5800H`,
      `                          \x1b[1;37mGPU:\x1b[0m NVIDIA GeForce RTX 3060 Laptop GPU`,
      `                          \x1b[1;37mMemory:\x1b[0m ${ramVal}GB / 16GB`,
      '\r\n'
    ].join('\r\n');

    term?.write(output);
    term?.write(prompt);
    return;
  }

  // --- Comando Emulado: antpac (Package Manager) ---
  if (mainCommand === 'antpac') {
    const action = parts[cmdIndex + 1];
    const targetApp = parts[cmdIndex + 2];

    if (!action) {
      term?.write('\r\nUsage: antpac [install|remove|list]\r\n');
      term?.write(prompt);
      return;
    }

    if (action === 'list') {
      term?.write('\r\nAplicaciones disponibles para instalación en Discover:\r\n');
      const apps = storeStore.availableApps;
      if (apps.length === 0) {
        term?.write('\x1b[31mNo hay más aplicaciones disponibles en la tienda.\x1b[0m\r\n');
      } else {
        apps.forEach((app) => {
          term?.write(`\x1b[32m- ${app.name} (${app.id})\x1b[0m: ${app.description || ''} [${app.size || ''}]\r\n`);
        });
      }
      term?.write('\r\n');
      term?.write(prompt);
      return;
    }

    // Instalación o desinstalación requiere root (sudo)
    if (action === 'install' || action === 'remove') {
      if (!hasSudo) {
        term?.write(`\r\n\x1b[31mError: Este comando requiere privilegios de superusuario (root).\r\nPor favor, intente con: "sudo antpac ${action} ${targetApp || '<app_id>'}"\x1b[0m\r\n\r\n`);
        term?.write(prompt);
        return;
      }

      if (!targetApp) {
        term?.write(`\r\nError: Debes especificar el ID de la aplicación. Ej: sudo antpac ${action} elisaplayer\r\n\r\n`);
        term?.write(prompt);
        return;
      }

      // Activar solicitud de contraseña de sudo
      isWaitingForPassword = true;
      passwordBuffer = '';
      passwordAttempts = 0;
      pendingAction = { type: action, app: targetApp };
      term?.write(`\r\n[sudo] password for ${userStore.username}: `);
      return;
    }

    term?.write(`\r\nAcción inválida. Usage: antpac [install|remove|list]\r\n`);
    term?.write(prompt);
    return;
  }

  // --- Puente PTY: Envío directo de comandos crudos a Go ---
  if (kernelSocket && kernelSocket.readyState === WebSocket.OPEN) {
    // Saltamos línea para la respuesta de la terminal
    term?.write('\r\n');
    kernelSocket.send(
      JSON.stringify({
        type: 'pty_input',
        data: trimmed + '\n'
      })
    );
  } else {
    term?.write('\r\n\x1b[31mError: Desconectado del Kernel del Sistema de Operación.\x1b[0m\r\n');
    term?.write(prompt);
  }
}

onMounted(() => {
  if (!terminalRef.value) return;

  term = new Terminal({
    cursorBlink: true,
    fontFamily: 'Fira Code, monospace',
    fontSize: 13,
    letterSpacing: 0.5,
    theme: {
      background: '#232629',
      foreground: '#eff0f1',
      cursor: '#3daee9',
      black: '#232629',
      red: '#ed1515',
      green: '#27ae60',
      yellow: '#f67400',
      blue: '#1d99f3',
      magenta: '#9b59b6',
      cyan: '#3daee9',
      white: '#eff0f1',
      brightBlack: '#7f8c8d',
      brightRed: '#ff5555',
      brightGreen: '#2ecc71',
      brightYellow: '#f1c40f',
      brightBlue: '#3daee9',
      brightMagenta: '#9b59b6',
      brightCyan: '#1abc9c',
      brightWhite: '#ffffff'
    }
  });

  // 2. Acoplar plugin de ajuste dinámico de dimensiones (FitAddon)
  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  // 3. Montar y renderizar terminal
  term.open(terminalRef.value);
  fitAddon.fit();

  // 4. Escribir prompt base inicial
  term.write(prompt);

  // 5. Captura reactiva de teclado y control del buffer local / contraseña de sudo
  term.onData((data) => {
    if (!term) return;

    // Si la consola está capturando una contraseña de sudo
    if (isWaitingForPassword) {
      if (data === '\r') {
        handlePasswordSubmit();
      } else if (data === '\x7f' || data === '\b') {
        if (passwordBuffer.length > 0) {
          passwordBuffer = passwordBuffer.slice(0, -1);
        }
      } else if (data.charCodeAt(0) >= 32) {
        // Aislamiento completo de echo en pantalla (comportamiento real de Linux por seguridad)
        passwordBuffer += data;
      }
      return;
    }

    // Enter en flujo normal
    if (data === '\r') {
      processCommand(currentLine);
      currentLine = '';
    }
    // Backspace / Retroceso (soporta diferentes codificaciones de tecla)
    else if (data === '\x7f' || data === '\b') {
      if (currentLine.length > 0) {
        currentLine = currentLine.slice(0, -1);
        term.write('\b \b'); // Mueve el cursor a la izquierda, dibuja un espacio para borrar, y vuelve al sitio
      }
    }
    // Filtrar caracteres de escape complejos si no hay puente PTY enviando caracteres
    else if (data.charCodeAt(0) < 32 && data !== '\r' && data !== '\n' && data !== '\t') {
      // Ignorar otros códigos de control para evitar anomalías en el buffer local
    }
    // Caracteres imprimibles normales
    else {
      currentLine += data;
      term.write(data);
    }
  });

  // 6. Conexión WebSocket dedicada a la pseudo-terminal (PTY)
  // Usamos el query parameter type=terminal para que Go desactive el ticker de telemetría y aísle el canal
  kernelSocket = new WebSocket('ws://127.0.0.1:8080/ws?type=terminal');

  kernelSocket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      // Escribir salidas del puente PTY directamente en el lienzo de xterm.js
      if (msg.type === 'pty_output' && term) {
        term.write(msg.data);
      }
    } catch (err) {
      // Descartar mensajes no JSON (telemetría genérica filtrada o tránsitos)
    }
  };

  kernelSocket.onerror = (err) => {
    console.error('[Terminal PTY] Error en canal del Kernel:', err);
  };

  // 7. Redimensionado reactivo de la terminal a través de ResizeObserver
  resizeObserver = new ResizeObserver(() => {
    if (fitAddon) {
      fitAddon.fit();
    }
  });
  resizeObserver.observe(terminalRef.value);
});

onUnmounted(() => {
  // Limpieza de recursos y descriptores
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (kernelSocket) {
    kernelSocket.close();
    kernelSocket = null;
  }
  if (term) {
    term.dispose();
    term = null;
  }
});
</script>

<style scoped>
.terminal-app-container {
  width: 100%;
  height: 100%;
  background-color: #232629;
  padding: 12px;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  position: relative;
}

.xterm-terminal-element {
  width: 100%;
  height: 100%;
}

/* Custom scrollbar para la consola de xterm.js */
:deep(.xterm-viewport::-webkit-scrollbar) {
  width: 6px;
}

:deep(.xterm-viewport::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.xterm-viewport::-webkit-scrollbar-thumb) {
  background: rgba(61, 174, 233, 0.2);
  border-radius: 3px;
}

:deep(.xterm-viewport::-webkit-scrollbar-thumb:hover) {
  background: rgba(61, 174, 233, 0.5);
}
</style>
