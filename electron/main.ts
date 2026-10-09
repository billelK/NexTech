import { app, BrowserWindow, ipcMain  } from "electron";
import path from "node:path";
import { runMigrations } from "./db/index";
import { getProducts } from "./db/queries/products";
import { getProductDetails } from "./db/queries/product_details";
import {
  createProduct,
  getProductFormOptions,
} from "./db/queries/product_form";
import type { ProductFormValues } from "./db/validation/product";
const isDev = process.env.NODE_ENV === "development";

ipcMain.handle("products:get-all", async () => {
  return getProducts();
});

ipcMain.handle("products:get-details", async (_event, productId: number) => {
  return getProductDetails(productId);
});

ipcMain.handle("products:get-form-options", async () => {
  return getProductFormOptions();
});

ipcMain.handle(
  "products:create",
  async (_event, input: ProductFormValues) => createProduct(input),
);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1100,
    minHeight: 650,

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