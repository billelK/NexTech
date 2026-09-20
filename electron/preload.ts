// import { contextBridge } from "electron";

// contextBridge.exposeInMainWorld("electronAPI", {});

import { contextBridge } from "electron";

console.log("NexTech preload loaded");

const electronAPI = {
  getAppInfo: () => ({
    name: "NexTech",
    platform: process.platform,
  }),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);