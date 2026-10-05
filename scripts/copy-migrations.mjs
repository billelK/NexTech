import fs from "node:fs";
import path from "node:path";

const source = path.resolve("electron/db/migrations");
const destination = path.resolve("dist-electron/db/migrations");

fs.cpSync(source, destination, {
  recursive: true,
});

console.log("✓ Drizzle migrations copied to dist-electron");