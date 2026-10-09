
"use client";

import {
  createContext,
  useContext,
} from "react";

type InventoryProduct = Awaited<
  ReturnType<typeof window.electronAPI.getProducts>
>[number];

export type AppContextValue = {
  products: InventoryProduct[];
  isLoadingProducts: boolean;
  productsError: string | null;
  refreshProducts: () => Promise<void>;
};

export const AppContext = createContext<AppContextValue | undefined>(
  undefined,
);

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useAppContext must be used within an AppProvider",
    );
  }

  return context;
}