/// <reference types="electron" />

interface Window {
  osAPI: {
    minimizeWindow: () => void;
    maximizeWindow: () => void;
    closeWindow: () => void;
    shutdown: () => void;
    setVolume: (level: number) => void;
    toggleMute: (isMuted: boolean) => void;
    readWorkspace: () => Promise<any>;
    writeFile: (folder: string, filename: string, data: { content?: string; dataUrl?: string }) => Promise<void>;
    deleteFile: (folder: string, filename: string) => Promise<void>;
    runFile: (folder: string, filename: string) => Promise<{ stdout: string; stderr: string; code: number }>;
    killFile: (folder: string, filename: string) => Promise<boolean>;
    onWebviewNavigate: (callback: (url: string) => void) => (() => void);
  };
}
