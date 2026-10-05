// import { contextBridge } from "electron";

// contextBridge.exposeInMainWorld("electronAPI", {});

import { contextBridge } from "electron";

const electronAPI = {
  getAppInfo: () => ({
    name: "NexTech",
    platform: process.platform,
  }),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);