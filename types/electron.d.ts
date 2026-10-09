import type { getProducts } from "../electron/db/queries/products";
import type { getProductDetails } from "../electron/db/queries/product_details";
import type {
  createProduct,
  getProductFormOptions,
} from "../electron/db/queries/product_form";
import type { ProductFormValues } from "../electron/db/validation/product";
interface ElectronAPI {
  // getAppInfo: () => {
  //   name: string;
  //   platform: NodeJS.Platform;
  // };
  getProducts: () => Promise<ReturnType<typeof getProducts>>;
  getProductDetails: (
    productId: number,
  ) => ReturnType<typeof getProductDetails>;
  getProductFormOptions: () => ReturnType<typeof getProductFormOptions>;
  createProduct: (input: ProductFormValues) => ReturnType<typeof createProduct>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};