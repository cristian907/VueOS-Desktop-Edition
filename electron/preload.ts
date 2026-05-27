import { contextBridge, ipcRenderer } from 'electron';

// API segura expuesta al espacio de usuario (Vue 3) bajo window.osAPI
const osAPI = {
  minimizeWindow: (): void => {
    ipcRenderer.send('window:minimize');
  },
  maximizeWindow: (): void => {
    ipcRenderer.send('window:maximize');
  },
  closeWindow: (): void => {
    ipcRenderer.send('window:close');
  },
  shutdown: (): void => {
    ipcRenderer.send('system:shutdown');
  },
  setVolume: (level: number): void => {
    ipcRenderer.send('audio:set-volume', level);
  },
  toggleMute: (isMuted: boolean): void => {
    ipcRenderer.send('audio:toggle-mute', isMuted);
  },
  readWorkspace: (): Promise<any> => {
    return ipcRenderer.invoke('fs:read-workspace');
  },
  writeFile: (folder: string, filename: string, data: { content?: string; dataUrl?: string }): Promise<void> => {
    return ipcRenderer.invoke('fs:write-file', folder, filename, data);
  },
  deleteFile: (folder: string, filename: string): Promise<void> => {
    return ipcRenderer.invoke('fs:delete-file', folder, filename);
  },
  runFile: (folder: string, filename: string): Promise<{ stdout: string; stderr: string; code: number }> => {
    return ipcRenderer.invoke('fs:run-file', folder, filename);
  },
  killFile: (folder: string, filename: string): Promise<boolean> => {
    return ipcRenderer.invoke('fs:kill-file', folder, filename);
  },
  getUpdateInfo: (): Promise<any> => {
    return ipcRenderer.invoke('system:get-update-info');
  },
  onWebviewNavigate: (callback: (url: string) => void): (() => void) => {
    const handler = (_event: any, url: string) => callback(url);
    ipcRenderer.on('webview:navigate-to', handler);
    return () => ipcRenderer.removeListener('webview:navigate-to', handler);
  },
  onDownloadProgress: (callback: (data: { filename: string; progress: number }) => void): (() => void) => {
    const handler = (_event: any, data: { filename: string; progress: number }) => callback(data);
    ipcRenderer.on('download:progress', handler);
    return () => ipcRenderer.removeListener('download:progress', handler);
  },
  onDownloadCompleted: (callback: (data: { folder: string; name: string; size: string }) => void): (() => void) => {
    const handler = (_event: any, data: { folder: string; name: string; size: string }) => callback(data);
    ipcRenderer.on('download:completed', handler);
    return () => ipcRenderer.removeListener('download:completed', handler);
  },
};

contextBridge.exposeInMainWorld('osAPI', osAPI);
