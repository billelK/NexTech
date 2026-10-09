// import { contextBridge } from "electron";

// contextBridge.exposeInMainWorld("electronAPI", {});

import { contextBridge, ipcRenderer} from "electron";

const electronAPI = {
  // getAppInfo: () => ({
  //   name: "NexTech",
  //   platform: process.platform,
  // }),

  getProducts: () => ipcRenderer.invoke("products:get-all"),
  getProductDetails: (productId: number) =>
    ipcRenderer.invoke("products:get-details", productId),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);