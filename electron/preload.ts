import { contextBridge, ipcRenderer} from "electron";
import type { ProductFormValues } from "./db/validation/product";

const electronAPI = {
  getProducts: () => ipcRenderer.invoke("products:get-all"),
  getProductDetails: (productId: number) =>
    ipcRenderer.invoke("products:get-details", productId),
  getProductFormOptions: () => ipcRenderer.invoke("products:get-form-options"),
  createProduct: (input: ProductFormValues) =>
    ipcRenderer.invoke("products:create", input),
  getProductForEdit: (productId: number) =>
    ipcRenderer.invoke("products:get-for-edit", productId),
  updateProduct: (productId: number, input: ProductFormValues) =>
    ipcRenderer.invoke("products:update", productId, input),
  deleteProduct: (productId: number) =>
    ipcRenderer.invoke("products:delete", productId),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);