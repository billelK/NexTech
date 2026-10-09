// import { contextBridge } from "electron";

// contextBridge.exposeInMainWorld("electronAPI", {});

import { contextBridge, ipcRenderer} from "electron";
import type { ProductFormValues } from "./db/validation/product";

const electronAPI = {
  // getAppInfo: () => ({
  //   name: "NexTech",
  //   platform: process.platform,
  // }),

  getProducts: () => ipcRenderer.invoke("products:get-all"),
  getProductDetails: (productId: number) =>
    ipcRenderer.invoke("products:get-details", productId),
  getProductFormOptions: () => ipcRenderer.invoke("products:get-form-options"),
  createProduct: (input: ProductFormValues) =>
    ipcRenderer.invoke("products:create", input),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);