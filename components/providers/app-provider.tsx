
"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  AppContext,
  type AppContextValue,
} from "@/contexts/app-context";

type InventoryProduct = Awaited<
  ReturnType<typeof window.electronAPI.getProducts>
>[number];

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const refreshProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setProductsError(null);

    try {
      const [productResult, productFormOptions] = await Promise.all([
        window.electronAPI.getProducts(),
        window.electronAPI.getProductFormOptions(),
      ]);

      setProducts(productResult);
      setCategories(productFormOptions.categories);
      setBrands(productFormOptions.brands);
    } catch (error) {
      console.error("Failed to load inventory products:", error);
      setProductsError("Unable to load inventory products.");
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

  const value: AppContextValue = {
    products,
    categories,
    brands,
    isLoadingProducts,
    productsError,
    refreshProducts,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}