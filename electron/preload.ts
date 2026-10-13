import { contextBridge, ipcRenderer} from "electron";
import type { ProductFormValues } from "./db/validation/product";
import type { CatalogEntry } from "./db/queries/catalog";

const electronAPI = {
  getProducts: () => ipcRenderer.invoke("products:get-all"),
  getProductDetails: (productId: number) =>
    ipcRenderer.invoke("products:get-details", productId),
  getStoreName: () => ipcRenderer.invoke("settings:get-store-name"),
  setStoreName: (value: string) =>
    ipcRenderer.invoke("settings:set-store-name", value),
  openStickerPreview: (productId: number) =>
    ipcRenderer.invoke("sticker:open-preview", productId),
  getStickerData: (productId: number) =>
    ipcRenderer.invoke("sticker:get-data", productId),
  closeStickerPreview: () => ipcRenderer.invoke("sticker:close-preview"),
  printSticker: (dimensions: {
    widthMm: number;
    heightMm: number;
    quantity: number;
  }) =>
    ipcRenderer.invoke("sticker:print", dimensions),
  getProductFormOptions: () => ipcRenderer.invoke("products:get-form-options"),
  createProduct: (input: ProductFormValues) =>
    ipcRenderer.invoke("products:create", input),
  getProductForEdit: (productId: number) =>
    ipcRenderer.invoke("products:get-for-edit", productId),
  updateProduct: (productId: number, input: ProductFormValues) =>
    ipcRenderer.invoke("products:update", productId, input),
  deleteProduct: (productId: number) =>
    ipcRenderer.invoke("products:delete", productId),
  getCategories: (): Promise<CatalogEntry[]> =>
    ipcRenderer.invoke("catalog:categories:get"),
  createCategory: (name: string): Promise<CatalogEntry> =>
    ipcRenderer.invoke("catalog:categories:create", name),
  updateCategory: (id: number, name: string): Promise<CatalogEntry> =>
    ipcRenderer.invoke("catalog:categories:update", id, name),
  deleteCategory: (id: number): Promise<number> =>
    ipcRenderer.invoke("catalog:categories:delete", id),
  getBrands: (): Promise<CatalogEntry[]> =>
    ipcRenderer.invoke("catalog:brands:get"),
  createBrand: (name: string): Promise<CatalogEntry> =>
    ipcRenderer.invoke("catalog:brands:create", name),
  updateBrand: (id: number, name: string): Promise<CatalogEntry> =>
    ipcRenderer.invoke("catalog:brands:update", id, name),
  deleteBrand: (id: number): Promise<number> =>
    ipcRenderer.invoke("catalog:brands:delete", id),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);