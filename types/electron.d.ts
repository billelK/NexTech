import type { getProducts } from "../electron/db/queries/products";
import type { getProductDetails } from "../electron/db/queries/product_details";
import type { getStoreName, setStoreName } from "../electron/db/queries/app_settings";
import type {
  createProduct,
  getProductFormOptions,
} from "../electron/db/queries/product_form";
import type { ProductFormValues } from "../electron/db/validation/product";
import type {
  getProductForEdit,
  updateProduct,
} from "../electron/db/queries/product_edit";
import type { deleteProduct } from "../electron/db/queries/product_delete";
interface ElectronAPI {
  // getAppInfo: () => {
  //   name: string;
  //   platform: NodeJS.Platform;
  // };
  getProducts: () => Promise<ReturnType<typeof getProducts>>;
  getProductDetails: (
    productId: number,
  ) => ReturnType<typeof getProductDetails>;
  getStoreName: () => Promise<ReturnType<typeof getStoreName>>;
  setStoreName: (value: string) => Promise<ReturnType<typeof setStoreName>>;
  openStickerPreview: (productId: number) => Promise<void>;
  getStickerData: (productId: number) => Promise<{
    product: NonNullable<Awaited<ReturnType<typeof getProductDetails>>>;
    storeName: string;
  }>;
  closeStickerPreview: () => Promise<boolean>;
  printSticker: (dimensions: {
    widthMm: number;
    heightMm: number;
    quantity: number;
  }) => Promise<{ success: boolean; cancelled: boolean; error?: string }>;
  getProductFormOptions: () => ReturnType<typeof getProductFormOptions>;
  createProduct: (input: ProductFormValues) => ReturnType<typeof createProduct>;
  getProductForEdit: (
    productId: number,
  ) => ReturnType<typeof getProductForEdit>;
  updateProduct: (
    productId: number,
    input: ProductFormValues,
  ) => ReturnType<typeof updateProduct>;
  deleteProduct: (productId: number) => ReturnType<typeof deleteProduct>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};