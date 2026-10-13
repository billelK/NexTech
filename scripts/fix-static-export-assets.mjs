import fs from "node:fs/promises";
import path from "node:path";

const exportDirectory = path.resolve("out");

async function updateHtmlAssets(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await updateHtmlAssets(entryPath);
      continue;
    }
    if (!entry.isFile() || path.extname(entry.name) !== ".html") {
      continue;
    }

    const relativeDirectory = path.relative(exportDirectory, path.dirname(entryPath));
    const depth =
      relativeDirectory === "" ? 0 : relativeDirectory.split(path.sep).length;
    const assetPrefix = `${depth === 0 ? "./" : "../".repeat(depth)}_next/`;
    const html = await fs.readFile(entryPath, "utf8");
    const updatedHtml = html.replaceAll("./_next/", assetPrefix);
    if (updatedHtml !== html) {
      await fs.writeFile(entryPath, updatedHtml);
    }
  }
}

try {
  await fs.access(exportDirectory);
} catch (cause) {
  throw new Error(`Static export directory was not found: ${exportDirectory}`, {
    cause,
  });
}

await updateHtmlAssets(exportDirectory);
