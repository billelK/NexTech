"use strict";
// import { contextBridge } from "electron";
Object.defineProperty(exports, "__esModule", { value: true });
// contextBridge.exposeInMainWorld("electronAPI", {});
const electron_1 = require("electron");
console.log("NexTech preload loaded");
const electronAPI = {
    getAppInfo: () => ({
        name: "NexTech",
        platform: process.platform,
    }),
};
electron_1.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
