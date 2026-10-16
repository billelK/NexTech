import fs from "node:fs/promises";
import path from "node:path";

const exportDirectory = path.resolve("out");
const staticAssetsDirectory = path.join(exportDirectory, "_next");

async function prepareStaticExport(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await prepareStaticExport(entryPath);
      continue;
    }
    if (!entry.isFile() || path.extname(entry.name) !== ".html") {
      continue;
    }

    const html = await fs.readFile(entryPath, "utf8");
    const updatedHtml = html.replace(/(?:\.\.\/)+_next\//g, "./_next/");
    if (updatedHtml !== html) {
      await fs.writeFile(entryPath, updatedHtml);
    }

    const relativeDirectory = path.relative(
      exportDirectory,
      path.dirname(entryPath),
    );
    if (relativeDirectory && updatedHtml.includes("./_next/")) {
      await fs.cp(
        staticAssetsDirectory,
        path.join(path.dirname(entryPath), "_next"),
        { recursive: true, force: true },
      );
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

await prepareStaticExport(exportDirectory);
