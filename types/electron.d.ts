interface ElectronAPI {
  getAppInfo: () => {
    name: string;
    platform: NodeJS.Platform;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};