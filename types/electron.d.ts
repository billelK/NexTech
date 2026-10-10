import type { getProducts } from "../electron/db/queries/products";
import type { getProductDetails } from "../electron/db/queries/product_details";
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