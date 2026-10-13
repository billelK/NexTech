import { app, BrowserWindow, ipcMain, Menu } from "electron";
import path from "node:path";
import { runMigrations } from "./db/index";
import { getProducts } from "./db/queries/products";
import { getProductDetails } from "./db/queries/product_details";
import { getStoreName, setStoreName } from "./db/queries/app_settings";
import {
  createProduct,
  getProductFormOptions,
} from "./db/queries/product_form";
import {
  getProductForEdit,
  updateProduct,
} from "./db/queries/product_edit";
import { deleteProduct } from "./db/queries/product_delete";
import {
  createBrand,
  createCategory,
  deleteBrand,
  deleteCategory,
  getBrands,
  getCategories,
  updateBrand,
  updateCategory,
} from "./db/queries/catalog";
import type { ProductFormValues } from "./db/validation/product";
const isDev = process.env.NODE_ENV === "development";
const stickerWindows = new Map<number, BrowserWindow>();

Menu.setApplicationMenu(null);

ipcMain.handle("products:get-all", async () => {
  return getProducts();
});

ipcMain.handle("products:get-details", async (_event, productId: number) => {
  return getProductDetails(productId);
});

ipcMain.handle("settings:get-store-name", () => getStoreName());

ipcMain.handle("settings:set-store-name", (_event, value: string) =>
  setStoreName(value),
);

ipcMain.handle("sticker:open-preview", async (event, productId: number) => {
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error("A valid product ID is required to print a sticker.");
  }

  const previewWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 760,
    minHeight: 560,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  stickerWindows.set(previewWindow.webContents.id, previewWindow);
  const previewWebContentsId = previewWindow.webContents.id;
  previewWindow.on("closed", () => stickerWindows.delete(previewWebContentsId));

  try {
    if (isDev) {
      await previewWindow.loadURL(
        `http://localhost:3000/barcode-sticker?productId=${productId}`,
      );
    } else {
      await previewWindow.loadFile(
        path.join(__dirname, "../out/barcode-sticker.html"),
        { query: { productId: String(productId) } },
      );
    }
  } catch (error) {
    previewWindow.close();
    throw error;
  }
});

ipcMain.handle("sticker:get-data", (event, productId: number) => {
  if (!stickerWindows.has(event.sender.id)) {
    throw new Error("Sticker data is only available in the print preview.");
  }

  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error("A valid product ID is required.");
  }

  return Promise.all([getProductDetails(productId), getStoreName()]).then(
    ([product, storeName]) => {
      if (!product) {
        throw new Error("The selected product could not be found.");
      }
      return { product, storeName };
    },
  );
});

ipcMain.handle("sticker:close-preview", (event) => {
  const previewWindow = stickerWindows.get(event.sender.id);
  if (!previewWindow || previewWindow.isDestroyed()) {
    return false;
  }

  previewWindow.close();
  return true;
});

ipcMain.handle(
  "sticker:print",
  (
    event,
    dimensions: { widthMm: number; heightMm: number; quantity: number },
  ) => {
    const previewWindow = stickerWindows.get(event.sender.id);
    if (!previewWindow || previewWindow.isDestroyed()) {
      throw new Error("The sticker print preview is no longer available.");
    }

    const widthMm = dimensions?.widthMm;
    const heightMm = dimensions?.heightMm;
    const quantity = dimensions?.quantity;
    if (
      !Number.isFinite(widthMm) ||
      !Number.isFinite(heightMm) ||
      !Number.isInteger(quantity) ||
      widthMm < 25 ||
      widthMm > 80 ||
      heightMm < 20 ||
      heightMm > 40 ||
      quantity < 1 ||
      quantity > 1000
    ) {
      throw new Error("Sticker dimensions are outside the supported range.");
    }

    return new Promise<{ success: boolean; cancelled: boolean; error?: string }>(
      (resolve) => {
        previewWindow.webContents.print(
          {
            silent: false,
            printBackground: true,
            landscape: false,
            pageSize: "A4",
            margins: { marginType: "none" },
            scaleFactor: 100,
          },
          (success, failureReason) => {
            if (success) {
              resolve({ success: true, cancelled: false });
              return;
            }

            const cancelled = /cancel/i.test(failureReason);
            resolve({
              success: false,
              cancelled,
              error: cancelled ? undefined : failureReason,
            });
          },
        );
      },
    );
  },
);

ipcMain.handle("products:get-form-options", async () => {
  return getProductFormOptions();
});

ipcMain.handle(
  "products:create",
  async (_event, input: ProductFormValues) => createProduct(input),
);

ipcMain.handle("products:get-for-edit", async (_event, productId: number) =>
  getProductForEdit(productId),
);

ipcMain.handle(
  "products:update",
  async (_event, productId: number, input: ProductFormValues) =>
    updateProduct(productId, input),
);

ipcMain.handle("products:delete", async (_event, productId: number) =>
  deleteProduct(productId),
);

ipcMain.handle("catalog:categories:get", () => getCategories());
ipcMain.handle("catalog:categories:create", (_event, name: string) =>
  createCategory(name),
);
ipcMain.handle(
  "catalog:categories:update",
  (_event, id: number, name: string) => updateCategory(id, name),
);
ipcMain.handle("catalog:categories:delete", (_event, id: number) =>
  deleteCategory(id),
);
ipcMain.handle("catalog:brands:get", () => getBrands());
ipcMain.handle("catalog:brands:create", (_event, name: string) =>
  createBrand(name),
);
ipcMain.handle("catalog:brands:update", (_event, id: number, name: string) =>
  updateBrand(id, name),
);
ipcMain.handle("catalog:brands:delete", (_event, id: number) =>
  deleteBrand(id),
);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1100,
    minHeight: 650,
    autoHideMenuBar: true,

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"));
  }
}

app.whenReady().then(async () => {
   runMigrations();
    createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});