import type { getProducts } from "../electron/db/queries/products";
import type { getProductDetails } from "../electron/db/queries/product_details";
interface ElectronAPI {
  // getAppInfo: () => {
  //   name: string;
  //   platform: NodeJS.Platform;
  // };
  getProducts: () => Promise<ReturnType<typeof getProducts>>;
  getProductDetails: (
    productId: number,
  ) => ReturnType<typeof getProductDetails>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};