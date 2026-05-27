# 🖥️ AntorOS Desktop Edition

Un simulador y emulador de Sistema Operativo de escritorio avanzado, elegante y responsivo, desarrollado con **Vue 3**, **TypeScript**, **Electron 29** y un daemon de telemetría de hardware en **Go**. 

Inspirado en la estética limpia de entornos modernos como KDE Plasma, AntorOS combina la interactividad de una aplicación web moderna con la potencia de integraciones nativas con el sistema host.

---

## ✨ Características Destacadas

### 🌐 Navegador Web Avanzado (Multi-pestaña)
*   **Pestañas Múltiples:** Abre, navega y gestiona varias pestañas en tiempo real.
*   **Menú Contextual Avanzado:** Soporte completo para clic derecho (abrir enlaces en nueva pestaña, ir atrás, ir adelante, recargar, copiar URL).
*   **Gestor de Descargas Nivel de Sistema:** Descarga archivos (canciones, imágenes, documentos) directamente en la carpeta de usuario `workspace/Descargas`.
*   **Persistencia de Sesión:** Descargas optimizadas e interceptadas a nivel de Electron que heredan de manera segura las cookies y la sesión del Webview para evitar descargas corruptas o vacías.

### 📊 Daemon de Telemetría en Go (Real-time)
*   Servicio independiente escrito en **Go** (`daemon/main.go`) que monitoriza en tiempo real el uso de CPU, RAM, almacenamiento, información del sistema y tiempo de actividad.
*   Comunicación bidireccional ultrarrápida mediante **WebSockets** (Puerto 8080) hacia el Shell de AntorOS.

### 🎵 Reproductor de Música (Elisa Player)
*   Reproductor multimedia integrado con soporte para listas de reproducción y archivos MP3 (`public/music/`).
*   Controles avanzados de reproducción (reproducir, pausar, siguiente, anterior, volumen, barra de progreso interactiva).
*   Visualizador gráfico y diseño elegante adaptado al sistema de temas de la interfaz.

### 📁 Administrador de Archivos (File Manager)
*   Navegación completa por el sistema de archivos del usuario simulado dentro de la carpeta `workspace/`.
*   Soporte para carpetas personalizadas: **Descargas**, **Documentos**, **Imágenes**.
*   Previsualización e interactividad con archivos de texto, scripts y código.

### ⚙️ Centro de Ajustes Integrado
*   **Apariencia:** Cambia de fondos de pantalla de alta definición en tiempo real y temas del sistema.
*   **Audio:** Ajuste y control de volumen maestro y efectos.
*   **Información del Sistema:** Visor con especificaciones del hardware recopiladas por el Daemon de Go.
*   **Seguridad y Usuario:** Configuración del perfil de usuario y contraseña de bloqueo de pantalla.

### 🛠️ Otras Aplicaciones y Utilidades
*   **System Monitor:** Gráficas en tiempo real de consumo de hardware.
*   **Kate:** Editor de código avanzado con resaltado y simulación de ejecución en el host.
*   **Terminal App:** Consola interactiva con comandos integrados de sistema.
*   **Discover:** Centro de software y tienda de aplicaciones para instalar/desinstalar complementos en caliente.
*   **Office & Notas:** Herramientas de productividad y anotaciones con persistencia local.

---

## 🛠️ Arquitectura y Tecnologías

### Frontend (Desktop Shell)
*   **Core:** Vue 3 (Composition API) + TypeScript
*   **Vite:** Compilador y empaquetador ultrarrápido.
*   **Pinia:** Gestión de estado global (OS, Audio, Store, Config).
*   **Estilos:** CSS puro altamente refinado, con variables CSS dinámicas para soporte de temas (Luz/Oscuro), transparencias (glassmorphism) y micro-animaciones premium.

### Backend & Integración Nativa
*   **Electron 29:** Proporciona la ventana nativa de escritorio, precarga de scripts (`preload.ts`), comunicación IPC segura y control de eventos de descarga e intercepción de red.
*   **Go (Golang):** Daemon nativo de telemetría de hardware que expone un servidor WebSocket de bajo consumo.

---

## 🚀 Requisitos e Instalación

### Requisitos Previos
Asegúrate de tener instalados los siguientes componentes en tu sistema host:
*   [Node.js](https://nodejs.org/) (Versión 18 o superior)
*   [pnpm](https://pnpm.io/) (Recomendado para la gestión de dependencias)
*   [Go (Golang)](https://go.dev/) (Para ejecutar el daemon de telemetría)

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/TU-USUARIO/VueOS_Desktop.git
cd VueOS_Desktop
```

### Paso 2: Instalar Dependencias del Frontend
```bash
pnpm install
```

### Paso 3: Lanzar el Entorno de Desarrollo
Para poner en marcha AntorOS Desktop Edition con todas sus capacidades, debes iniciar tres servicios: el compilador de Vue, el daemon de Go y la ventana nativa de Electron.

Puedes iniciarlos abriendo tres terminales diferentes en la raíz del proyecto y ejecutando:

**Terminal 1: Compilador de Frontend (Vite)**
```bash
pnpm dev:vue
```

**Terminal 2: Daemon de Telemetría (Go)**
```bash
pnpm dev:daemon
```

**Terminal 3: Entorno Nativo de Electron**
```bash
pnpm dev:electron
```

*Nota: Una vez compilado todo, Electron levantará la interfaz de escritorio de AntorOS y se conectará automáticamente al daemon.*

---

## 📂 Estructura del Proyecto

*   `src/` - Aplicación frontend Vue 3 (vistas, componentes de aplicaciones, stores de Pinia, hojas de estilo CSS).
*   `electron/` - Scripts principales de Electron (`main.ts` para lógica nativa y descargas, `preload.ts` para comunicación IPC segura).
*   `daemon/` - Servidor de telemetría escrito en Go que recolecta hardware del sistema.
*   `workspace/` - Carpetas del simulador de usuario (Descargas, Documentos, Imágenes). *Esta carpeta local está gitignorada para no subir tus archivos descargados a GitHub, manteniendo únicamente la estructura mediante archivos `.gitkeep`.*
*   `public/` - Recursos estáticos, fondos de pantalla y pistas MP3 precargadas para el Elisa Player.
*   `update.json` - Archivo manifiesto para simular actualizaciones del sistema.

---

## 🔒 Buenas Prácticas y Seguridad
*   **Aislamiento de Contexto (Context Isolation):** Electron está configurado con `contextIsolation: true` y `nodeIntegration: false` para mitigar riesgos de seguridad.
*   **Comunicación IPC Segura:** Los accesos a las API nativas (descargas, ejecución, notificaciones) se canalizan estrictamente a través de un canal seguro expuesto en `preload.ts`.
*   **Estructura Limpia en Git:** El archivo `.gitignore` ha sido configurado exhaustivamente para omitir temporales de compilación (`dist`, `dist-electron`, `out`), archivos y configuraciones de IDEs (`.vscode`, `.idea`), y cualquier documento descargado o creado en el simulador.
