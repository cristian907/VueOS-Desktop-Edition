<template>
  <div class="boot-overlay">
    <div class="terminal-container" ref="terminalRef">
      <!-- ASCII Art de Cabecera -->
      <pre class="ascii-logo">
 __      __            ____   _____ 
 \ \    / /           / __ \ / ____|
  \ \  / /   _  ___  | |  | | (___  
   \ \/ / | | |/ _ \ | |  | |\___ \ 
    \  /| |_| |  __/ | |__| |____) |
     \/  \__,_|\___|  \____/|_____/ 
  [ Kernel version: 6.8.0-31-generic-vueos ]
      </pre>

      <!-- Logs del Kernel -->
      <div class="log-lines">
        <div 
          v-for="(line, idx) in visibleLines" 
          :key="idx" 
          class="log-line"
          :class="{
            'ok-line': line.includes('[  OK  ]'),
            'info-line': line.includes('info') || line.includes('version'),
            'warning-line': line.includes('warning') || line.includes('Link is Down')
          }"
        >
          <span v-if="line.includes('[  OK  ]')" class="tag-ok">[  OK  ]</span>
          <span v-else-if="line.includes('[ INFO ]')" class="tag-info">[ INFO ]</span>
          <span v-else-if="line.includes('[ WARN ]')" class="tag-warn">[ WARN ]</span>
          <span class="line-text">{{ line.includes('[  OK  ]') || line.includes('[ INFO ]') || line.includes('[ WARN ]') ? line.slice(8) : line }}</span>
        </div>
        <!-- Cursor parpadeante -->
        <span class="cursor">_</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';

const terminalRef = ref<HTMLDivElement | null>(null);
const visibleLines = ref<string[]>([]);

const allBootLines = [
  "[    0.000000] Booting Linux kernel...",
  "[    0.000000] Linux version 6.8.0-31-generic-vueos (gcc version 13.2.0)",
  "[    0.000000] CPU0: AMD Ryzen 7 5800H @ 3.20GHz",
  "[    0.010243] ACPI: Core revision 20230628",
  "[    0.048201] ram: 16384 MB physical memory detected",
  "[    0.120932] ACPI: BIOS GT Physical RAM Map initialized",
  "[    0.203194] usbcore: registered new interface driver hub",
  "[    0.280112] PCI: Probing PCI hardware (bus 00)",
  "[    0.340918] vgaarb: setting primary card to PCI:0000:01:00.0",
  "[    0.412093] SCSI subsystem initialized",
  "[    0.500293] libata version 3.00 loaded.",
  "[    0.620193] EXT4-fs (sda1): mounted filesystem with ordered data mode. Opts: (null).",
  "[    0.730248] input: Power Button as /devices/LNXSYSTM:00/LNXPWRBN:00/input/input0",
  "[    0.803294] usbcore: registered new interface driver usb-storage",
  "[    0.892011] iwlwifi 0000:00:14.3: loaded firmware version 64.664.1",
  "[    0.952093] r8169 0000:02:00.0 eth0: Link is Down (cable disconnected)",
  "[    1.092102] systemd[1]: systemd 255.4-1ubuntu8 running in system mode (+PAM +AUDIT +SELINUX +APPARMOR)",
  "[    1.150293] systemd[1]: Detected architecture x86-64.",
  "[  OK  ] Created slice System Slice.",
  "[  OK  ] Starting Journal Service...",
  "[  OK  ] Started Journal Service.",
  "[  OK  ] Load Kernel Modules.",
  "[  OK  ] Create Static Device Nodes in /dev.",
  "[  OK  ] Starting VueOS Kernel Daemon...",
  "[  OK  ] Started LSB: Daemon VueOS Real-Hardware API.",
  "[  OK  ] Mounted /workspace.",
  "[  OK  ] Mounted /sys/kernel/security.",
  "[  OK  ] Started D-Bus System Message Bus.",
  "[  OK  ] Started Network Manager.",
  "[  OK  ] Reached target Network.",
  "[  OK  ] Reached target Local File Systems.",
  "[  OK  ] Reached target System Initialization.",
  "[  OK  ] Started CUPS Scheduler.",
  "[  OK  ] Started Accounts Service.",
  "[  OK  ] Started User Login Management.",
  "[  OK  ] Reached target Multi-User System.",
  "[  OK  ] Reached target Graphical Interface.",
  "[  OK  ] Starting VueOS SDDM Display Manager...",
  "[  OK  ] Initializing Kate Desktop Environment...",
  "[  OK  ] Welcome to VueOS Linux!"
];

onMounted(() => {
  let index = 0;

  function addNextLine() {
    if (index < allBootLines.length) {
      visibleLines.value.push(allBootLines[index]);
      index++;

      // Autoscroll
      nextTick(() => {
        if (terminalRef.value) {
          terminalRef.value.scrollTop = terminalRef.value.scrollHeight;
        }
      });

      // Calcular retardo aleatorio simulado (más rápido para líneas generales,
      // ligeramente más lento para inicializaciones de servicios/systemd)
      const currentLine = allBootLines[index - 1];
      let delay = Math.random() * 80 + 30; // 30ms a 110ms base
      if (currentLine.includes('[  OK  ]')) {
        delay = Math.random() * 120 + 40; // 40ms a 160ms para servicios
      }

      setTimeout(addNextLine, delay);
    }
  }

  addNextLine();
});
</script>

<style scoped>
.boot-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: #000000;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  z-index: 9999999;
  overflow: hidden;
  user-select: none;
  padding: 30px;
  box-sizing: border-box;
}

.terminal-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  font-family: 'Fira Code', 'Courier New', Courier, monospace;
  font-size: 0.85rem;
  line-height: 1.4;
  color: #eff0f1;
  text-align: left;
  /* Scrollbar oculta o estilizada al estilo terminal retro */
  scrollbar-width: thin;
  scrollbar-color: #3b3f43 #000000;
}

.terminal-container::-webkit-scrollbar {
  width: 6px;
}
.terminal-container::-webkit-scrollbar-track {
  background: #000000;
}
.terminal-container::-webkit-scrollbar-thumb {
  background: #3b3f43;
  border-radius: 3px;
}

.ascii-logo {
  color: #3daee9; /* Breeze Blue */
  margin: 0 0 24px 0;
  font-weight: bold;
  line-height: 1.25;
}

.log-lines {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.log-line {
  word-break: break-all;
}

.tag-ok {
  color: #2ecc71; /* Verde */
  font-weight: bold;
  margin-right: 8px;
}

.tag-info {
  color: #3daee9; /* Azul */
  font-weight: bold;
  margin-right: 8px;
}

.tag-warn {
  color: #f1c40f; /* Amarillo */
  font-weight: bold;
  margin-right: 8px;
}

.ok-line .line-text {
  color: #eff0f1;
}

.warning-line {
  color: #e74c3c; /* Rojo suave o naranja */
}

.cursor {
  display: inline-block;
  background-color: #eff0f1;
  width: 8px;
  height: 15px;
  animation: blink 0.8s infinite;
  margin-left: 4px;
  vertical-align: middle;
}

@keyframes blink {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
</style>
