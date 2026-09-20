"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const test_db_1 = require("./test-db");
const isDev = process.env.NODE_ENV === "development";
function createWindow() {
    const mainWindow = new electron_1.BrowserWindow({
        width: 1366,
        height: 768,
        minWidth: 1100,
        minHeight: 650,
        webPreferences: {
            preload: node_path_1.default.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    if (isDev) {
        mainWindow.loadURL("http://localhost:3000");
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(node_path_1.default.join(__dirname, "../out/index.html"));
    }
}
electron_1.app.whenReady().then(() => {
    (0, test_db_1.testSQLite)();
    createWindow();
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
