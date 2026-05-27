import { app, BrowserWindow, ipcMain, net } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import { exec, ChildProcess } from 'child_process';

// Deshabilitar VSync y omitir la lista negra de GPU para corregir errores de VSync/Chromium en entornos Linux
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// En entornos ESM, definimos __dirname de manera compatible
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Guardar referencia de sesiones que ya tienen el listener de descarga
const sessionsWithDownloadHandler = new Set<Electron.Session>();

/**
 * Inicializa la ventana principal frameless y transparente.
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: false,
    transparent: true,
    webPreferences: {
      webviewTag: true, // Requerido para incrustar el navegador real
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Registrar handler de descargas en la sesión de la ventana principal
  attachDownloadHandler(mainWindow.webContents.session);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---- IPC Event Handlers (Control de Ventana Principal) ----

ipcMain.on('window:minimize', (): void => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('window:maximize', (): void => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', (): void => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.on('system:shutdown', (): void => {
  app.quit();
});

// ---- IPC Audio Event Handlers (Control de Volumen Global) ----
ipcMain.on('audio:set-volume', (_event, level: number): void => {
  console.log(`[Audio IPC] Volume set to: ${level * 100}%`);
});

ipcMain.on('audio:toggle-mute', (_event, isMuted: boolean): void => {
  if (mainWindow) {
    mainWindow.webContents.setAudioMuted(isMuted);
    console.log(`[Audio IPC] Muted status set to: ${isMuted}`);
  }
});

// ---- IPC Filesystem Event Handlers (Persistencia Física) ----
const WORKSPACE_DIR = path.join(process.cwd(), 'workspace');

function ensureWorkspaceDirs() {
  if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR);
  }
  const subDirs = ['Descargas', 'Documentos', 'Imágenes'];
  subDirs.forEach(dir => {
    const fullPath = path.join(WORKSPACE_DIR, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath);
    }
  });
}
ensureWorkspaceDirs();

ipcMain.handle('fs:read-workspace', async () => {
  const dirs = ['Descargas', 'Documentos', 'Imágenes'];
  const result: Record<string, { name: string; type: 'file' | 'dir'; size: string; dataUrl?: string; content?: string }[]> = {
    Descargas: [],
    Documentos: [],
    Imágenes: []
  };

  for (const dirName of dirs) {
    const dirPath = path.join(WORKSPACE_DIR, dirName);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          const sizeStr = stats.size > 1024 * 1024 ? `${sizeMB} MB` : `${(stats.size / 1024).toFixed(1)} KB`;
          
          let dataUrl = '';
          let content = '';

          const ext = path.extname(file).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mp3'].includes(ext)) {
            const fileData = fs.readFileSync(filePath);
            let mimeType = 'image/jpeg';
            if (ext === '.png') mimeType = 'image/png';
            else if (ext === '.mp4') mimeType = 'video/mp4';
            else if (ext === '.webm') mimeType = 'video/webm';
            else if (ext === '.mp3') mimeType = 'audio/mp3';
            dataUrl = `data:${mimeType};base64,${fileData.toString('base64')}`;
          } else {
            content = fs.readFileSync(filePath, 'utf-8');
          }

          result[dirName].push({
            name: file,
            type: 'file',
            size: sizeStr,
            dataUrl,
            content
          });
        }
      }
    }
  }
  return result;
});

// ---- Utilidades de Descarga ----

/**
 * Descarga un archivo usando Electron net.request() con la sesión del webview.
 * Esto incluye las cookies y headers del browser, permitiendo descargas autenticadas.
 * Soporta seguimiento de progreso si el servidor devuelve content-length.
 */
function downloadWithSession(
  url: string,
  destPath: string,
  filename: string,
  targetSession: Electron.Session
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = net.request({
      method: 'GET',
      url,
      session: targetSession,
      useSessionCookies: true,
    });

    request.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    request.setHeader('Accept', '*/*');
    request.setHeader('Accept-Encoding', 'identity');

    const chunks: Buffer[] = [];
    let receivedBytes = 0;
    let totalBytes = 0;

    request.on('response', (response) => {
      const statusCode = response.statusCode;
      console.log(`[electron] HTTP ${statusCode} para: ${url}`);

      if (statusCode >= 300 && statusCode < 400) {
        const location = Array.isArray(response.headers.location)
          ? response.headers.location[0]
          : response.headers.location as string;
        if (location) {
          request.abort();
          downloadWithSession(location, destPath, filename, targetSession).then(resolve).catch(reject);
          return;
        }
      }

      if (statusCode !== 200) {
        request.abort();
        reject(new Error(`HTTP ${statusCode} al descargar: ${url}`));
        return;
      }

      const contentLength = Array.isArray(response.headers['content-length'])
        ? response.headers['content-length'][0]
        : response.headers['content-length'] as string;
      totalBytes = parseInt(contentLength || '0', 10);

      response.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        receivedBytes += chunk.length;
        if (totalBytes > 0 && mainWindow) {
          const progress = Math.round((receivedBytes / totalBytes) * 100);
          mainWindow.webContents.send('download:progress', { filename, progress });
        }
      });

      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(destPath, buffer);
        console.log(`[electron] ✓ Escrito en disco: ${destPath} (${buffer.length} bytes)`);
        resolve();
      });

      response.on('error', (err: Error) => {
        reject(err);
      });
    });

    request.on('error', (err: Error) => {
      reject(err);
    });

    request.end();
  });
}

/**
 * Descarga simple con Node.js nativo. Usada por fs:write-file (sin sesión de webview).
 */
function downloadFile(url: string, destPath: string, maxRedirects = 10): Promise<void> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
      }
    };
    lib.get(url, options, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        if (maxRedirects <= 0) { reject(new Error('Too many redirects')); return; }
        downloadFile(response.headers.location, destPath, maxRedirects - 1).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) { reject(new Error(`HTTP ${response.statusCode}`)); return; }
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () => {
        fs.writeFileSync(destPath, Buffer.concat(chunks));
        resolve();
      });
      response.on('error', reject);
    }).on('error', reject);
  });
}

ipcMain.handle('fs:write-file', async (_event, folder: string, filename: string, data: { content?: string; dataUrl?: string }) => {
  const dirPath = path.join(WORKSPACE_DIR, folder);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, filename);
  if (data.dataUrl) {
    if (data.dataUrl.startsWith('http://') || data.dataUrl.startsWith('https://')) {
      try {
        await downloadFile(data.dataUrl, filePath);
      } catch (err) {
        console.error('[electron] Error downloading remote file:', err);
      }
    } else {
      const base64Data = data.dataUrl.split(';base64,').pop();
      if (base64Data) {
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      }
    }
  } else if (data.content !== undefined) {
    fs.writeFileSync(filePath, data.content, 'utf-8');
  }
});

ipcMain.handle('fs:delete-file', async (_event, folder: string, filename: string) => {
  const filePath = path.join(WORKSPACE_DIR, folder, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
});

const activeProcesses = new Map<string, ChildProcess>();

ipcMain.handle('fs:run-file', async (_event, folder: string, filename: string) => {
  const filePath = path.join(WORKSPACE_DIR, folder, filename);
  const ext = path.extname(filename).toLowerCase();
  const processKey = `${folder}:${filename}`;
  
  // Si ya hay un proceso corriendo para este archivo, matarlo primero para evitar procesos colgados
  if (activeProcesses.has(processKey)) {
    try {
      activeProcesses.get(processKey)?.kill();
    } catch (err) {}
    activeProcesses.delete(processKey);
  }

  let command = '';
  switch (ext) {
    case '.py':
      command = `python3 "${filePath}" || python "${filePath}"`;
      break;
    case '.js':
      command = `node "${filePath}"`;
      break;
    case '.sh':
      command = `chmod +x "${filePath}" && bash "${filePath}"`;
      break;
    case '.go':
      command = `go run "${filePath}"`;
      break;
    default:
      return {
        stdout: '',
        stderr: `Tipo de archivo (${ext}) no soportado para ejecución directa en el sistema.`,
        code: -1
      };
  }
  
  return new Promise((resolve) => {
    const child = exec(command, (error, stdout, stderr) => {
      activeProcesses.delete(processKey);
      resolve({
        stdout: stdout || '',
        stderr: stderr || (error ? error.message : ''),
        code: error && error.code !== undefined ? error.code : 0
      });
    });
    
    activeProcesses.set(processKey, child);
  });
});

ipcMain.handle('fs:kill-file', async (_event, folder: string, filename: string) => {
  const processKey = `${folder}:${filename}`;
  if (activeProcesses.has(processKey)) {
    try {
      activeProcesses.get(processKey)?.kill();
    } catch (err) {
      console.error('[electron] Error al matar proceso:', err);
    }
    activeProcesses.delete(processKey);
    return true;
  }
  return false;
});

// IPC Handler para leer el archivo de actualización del sistema de la raíz física
ipcMain.handle('system:get-update-info', async () => {
  const updateFilePath = path.join(process.cwd(), 'update.json');
  if (fs.existsSync(updateFilePath)) {
    try {
      const content = fs.readFileSync(updateFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('[electron] Error al parsear update.json:', err);
      return null;
    }
  }
  return null;
});

// ---- Handler Reutilizable de Descargas para cualquier sesión ----

/**
 * Registra el interceptor de descargas en una sesión de Electron.
 * Cancela inmediatamente el mecanismo nativo de Electron (que produce
 * archivos de 0 bytes) y lo reemplaza por una descarga directa con Node.js.
 */
function attachDownloadHandler(targetSession: Electron.Session): void {
  if (sessionsWithDownloadHandler.has(targetSession)) return;
  sessionsWithDownloadHandler.add(targetSession);

  console.log('[electron] Registrando handler de descargas en sesión');

  targetSession.on('will-download', (_event, item) => {
    const filename = item.getFilename();
    const url = item.getURL();
    const destDir = path.join(WORKSPACE_DIR, 'Descargas');
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const destPath = path.join(destDir, filename);

    console.log(`[electron] Descarga interceptada: "${filename}" <- ${url}`);

    // ★ Cancelar el mecanismo de descarga de Electron (produce 0 bytes en
    //   servidores con streaming o tokens de sesión).
    //   Usar net.request() con la MISMA sesión del webview para heredar
    //   cookies y cabeceras de autenticación.
    item.cancel();

    // Notificar inicio al renderer
    if (mainWindow) {
      mainWindow.webContents.send('download:progress', { filename, progress: 0 });
    }

    downloadWithSession(url, destPath, filename, targetSession)
      .then(() => {
        const stats = fs.statSync(destPath);
        const sizeStr = stats.size > 1024 * 1024
          ? (stats.size / (1024 * 1024)).toFixed(1) + ' MB'
          : (stats.size / 1024).toFixed(1) + ' KB';

        console.log(`[electron] ✓ Descarga completada: "${filename}" (${sizeStr})`);

        if (mainWindow) {
          mainWindow.webContents.send('download:completed', {
            folder: 'Descargas',
            name: filename,
            size: sizeStr
          });
        }
      })
      .catch((err: Error) => {
        console.error(`[electron] ✗ Error al descargar "${filename}":`, err.message);
        try {
          if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        } catch (_) {}
      });
  });
}

// ---- Ciclo de vida del Proceso Principal ----

app.whenReady().then(() => {
  createWindow();

  // Interceptar la creación de WebContents desde webview guests
  app.on('web-contents-created', (_event, contents) => {
    if (contents.getType() === 'webview') {
      // ★ Registrar handler de descargas en la sesión del webview guest
      attachDownloadHandler(contents.session);

      // Interceptar window.open() y links con target="_blank"
      contents.setWindowOpenHandler(({ url }) => {
        if (mainWindow && url && url !== 'about:blank') {
          mainWindow.webContents.send('webview:navigate-to', url);
        }
        return { action: 'deny' };
      });

      contents.on('will-navigate', (_navEvent, url) => {
        console.log('[webview] will-navigate:', url);
      });
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
