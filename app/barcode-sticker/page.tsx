"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Printer, Save } from "lucide-react";
import {
  BarcodeSticker,
  isSupportedStickerBarcode,
} from "@/components/inventory/barcode-sticker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const SHEET_MARGIN_MM = 10;
const STICKER_GAP_MM = 3;
const PREVIEW_SCALE = 0.55;
const SINGLE_STICKER_SCALE = 2;
const MAX_STICKERS_PER_JOB = 1000;

type StickerData = Awaited<
  ReturnType<typeof window.electronAPI.getStickerData>
>;

async function waitForA4PrintDocument(
  stickerCount: number,
  pageCount: number,
): Promise<boolean> {
  await document.fonts.ready;
  const deadline = Date.now() + 5000;

  while (Date.now() < deadline) {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve()),
      ),
    );

    const stickers = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".a4-sheet-page .barcode-sticker",
      ),
    );
    const sheetPages = document.querySelectorAll<HTMLElement>(".a4-sheet-page");
    const barcodesReady =
      stickers.length === stickerCount &&
      stickers.every((sticker) =>
        Boolean(sticker.querySelector("svg")?.querySelector("rect")),
      );
    const sheetsReady =
      sheetPages.length === pageCount &&
      Array.from(sheetPages).every(
        (sheet) => getComputedStyle(sheet).display === "grid",
      );

    if (barcodesReady && sheetsReady) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return false;
}

export default function BarcodeStickerPage() {
  const [data, setData] = useState<StickerData | null>(null);
  const [storeName, setStoreName] = useState("");
  const [isSavingStoreName, setIsSavingStoreName] = useState(false);
  const [storeNameError, setStoreNameError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [widthMm, setWidthMm] = useState(70);
  const [heightMm, setHeightMm] = useState(40);
  const [quantity, setQuantity] = useState(1);
  const [previewMode, setPreviewMode] = useState<"sheet" | "single">("single");
  const [isPrinting, setIsPrinting] = useState(false);
  const [printMessage, setPrintMessage] = useState<string | null>(null);

  const availableWidthMm = A4_WIDTH_MM - SHEET_MARGIN_MM * 2;
  const availableHeightMm = A4_HEIGHT_MM - SHEET_MARGIN_MM * 2;
  const columns = Math.floor(
    (availableWidthMm + STICKER_GAP_MM) / (widthMm + STICKER_GAP_MM),
  );
  const rows = Math.floor(
    (availableHeightMm + STICKER_GAP_MM) / (heightMm + STICKER_GAP_MM),
  );
  const stickersPerSheet = columns * rows;
  const sheetCount = Math.ceil(quantity / stickersPerSheet);
  const sheetStickers = Array.from({ length: sheetCount }, (_, sheetIndex) =>
    Array.from(
      { length: Math.min(stickersPerSheet, quantity - sheetIndex * stickersPerSheet) },
      (_, stickerIndex) => sheetIndex * stickersPerSheet + stickerIndex,
    ),
  );

  useEffect(() => {
    const productId = Number(
      new URLSearchParams(window.location.search).get("productId"),
    );
    let active = true;
    window.electronAPI
      .getStickerData(productId)
      .then((result) => {
        if (active) {
          setData(result);
          setStoreName(result.storeName);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setLoadError(
            cause instanceof Error
              ? cause.message
              : "Could not load the selected product for printing.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function saveStoreName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingStoreName(true);
    setStoreNameError(null);
    try {
      const savedName = await window.electronAPI.setStoreName(storeName);
      setStoreName(savedName);
    } catch (cause) {
      setStoreNameError(
        cause instanceof Error ? cause.message : "Could not save the shop name.",
      );
    } finally {
      setIsSavingStoreName(false);
    }
  }

  async function printSticker() {
    if (!data) return;
    setIsPrinting(true);
    setPrintMessage(null);
    try {
      setPreviewMode("sheet");
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );

      if (!(await waitForA4PrintDocument(quantity, sheetCount))) {
        throw new Error(
          "The A4 sheet preview is not ready yet. Wait for the barcodes to finish rendering and try again.",
        );
      }

      const result = await window.electronAPI.printSticker({
        widthMm,
        heightMm,
        quantity,
      });
      if (result.success) {
        setPrintMessage("A4 print job submitted.");
      } else if (result.cancelled) {
        setPrintMessage("Printing was cancelled.");
      } else {
        setPrintMessage(
          result.error
            ? `Printing failed: ${result.error}`
            : "Printing failed. Check the selected printer and try again.",
        );
      }
    } catch (cause) {
      setPrintMessage(
        cause instanceof Error
          ? `Printing failed: ${cause.message}`
          : "Printing failed. Check the selected printer and try again.",
      );
    } finally {
      setIsPrinting(false);
    }
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
        <p role="alert" className="text-sm text-destructive">{loadError}</p>
        <Button onClick={() => void window.electronAPI.closeStickerPreview()}>
          <ArrowLeft />
          Back to inventory
        </Button>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-8">
        <p className="text-sm text-muted-foreground">Loading sticker preview...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="sticker-controls mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => void window.electronAPI.closeStickerPreview()}
        >
          <ArrowLeft />
          Back to inventory
        </Button>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-xs text-muted-foreground">
            Width (mm)
            <Input
              type="number"
              min={25}
              max={80}
              value={widthMm}
              onChange={(event) =>
                setWidthMm(Math.min(80, Math.max(25, Number(event.target.value) || 25)))
              }
              className="w-24"
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Height (mm)
            <Input
              type="number"
              min={20}
              max={40}
              value={heightMm}
              onChange={(event) =>
                setHeightMm(Math.min(40, Math.max(20, Number(event.target.value) || 20)))
              }
              className="w-24"
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Sticker quantity
            <Input
              type="number"
              min={1}
              max={MAX_STICKERS_PER_JOB}
              value={quantity}
              onChange={(event) =>
                setQuantity(
                  Math.min(
                    MAX_STICKERS_PER_JOB,
                    Math.max(1, Number(event.target.value) || 1),
                  ),
                )
              }
              className="w-28"
            />
          </label>
          <Button
            type="button"
            variant={previewMode === "single" ? "secondary" : "outline"}
            aria-pressed={previewMode === "single"}
            onClick={() => setPreviewMode("single")}
          >
            Single sticker
          </Button>
          <Button
            type="button"
            variant={previewMode === "sheet" ? "secondary" : "outline"}
            aria-pressed={previewMode === "sheet"}
            onClick={() => setPreviewMode("sheet")}
          >
            A4 sheet preview
          </Button>
          <Button
            onClick={() => void printSticker()}
            disabled={
              isPrinting ||
              !storeName.trim() ||
              !isSupportedStickerBarcode(data.product.barcode) ||
              stickersPerSheet === 0
            }
          >
            <Printer />
            {isPrinting ? "Opening print dialog..." : "Print A4 sheet(s)"}
          </Button>
        </div>
      </div>
      <p className="sticker-controls mx-auto mt-4 max-w-5xl text-sm text-muted-foreground">
        {stickersPerSheet} stickers per A4 sheet · {sheetCount}{" "}
        {sheetCount === 1 ? "sheet" : "sheets"} required
      </p>

      {!storeName.trim() && (
        <div className="sticker-controls mx-auto mt-5 max-w-5xl space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p>Set the shop name before printing. It will be saved for future stickers.</p>
          <form
            onSubmit={(event) => void saveStoreName(event)}
            className="flex flex-wrap items-end gap-2"
          >
            <label className="grid gap-1 text-xs text-muted-foreground">
              Shop name
              <Input
                maxLength={60}
                value={storeName}
                onChange={(event) => setStoreName(event.target.value)}
                placeholder="Enter your shop name"
              />
            </label>
            <Button type="submit" disabled={isSavingStoreName || !storeName.trim()}>
              <Save />
              {isSavingStoreName ? "Saving..." : "Save shop name"}
            </Button>
          </form>
          {storeNameError && (
            <p role="alert" className="text-sm text-destructive">
              {storeNameError}
            </p>
          )}
        </div>
      )}

      {!isSupportedStickerBarcode(data.product.barcode) && (
        <p role="alert" className="sticker-controls mx-auto mt-4 max-w-5xl text-sm text-destructive">
          {data.product.barcode?.trim()
            ? "This product's barcode contains unsupported characters and cannot be printed as CODE128."
            : "This product has no barcode and cannot be printed. No replacement barcode will be generated."}
        </p>
      )}

      {printMessage && (
        <p role="status" className="sticker-controls mx-auto mt-4 max-w-5xl text-sm text-muted-foreground">
          {printMessage}
        </p>
      )}

      <section className="sticker-preview mx-auto mt-6 flex h-[min(55vh,400px)] min-h-[280px] max-w-5xl flex-col items-center gap-6 overflow-auto overscroll-contain rounded-xl border bg-muted/40 p-6 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
        <div
          className="single-sticker-preview"
          style={{ display: previewMode === "single" ? "flex" : "none" }}
        >
          <div
            className="single-sticker-scale"
            style={{
              width: `${widthMm * SINGLE_STICKER_SCALE}mm`,
              height: `${heightMm * SINGLE_STICKER_SCALE}mm`,
            }}
          >
            <div
              className="single-sticker-inner"
              style={{
                width: `${widthMm}mm`,
                height: `${heightMm}mm`,
                transform: `scale(${SINGLE_STICKER_SCALE})`,
                transformOrigin: "top left",
              }}
            >
              <BarcodeSticker
                product={data.product}
                storeName={storeName}
                widthMm={widthMm}
                heightMm={heightMm}
              />
            </div>
          </div>
        </div>
        <div
          className="a4-sheets-preview"
          style={{ display: previewMode === "sheet" ? "flex" : "none" }}
        >
          {sheetStickers.map((stickerIndexes, sheetIndex) => (
            <div
              key={sheetIndex}
              className="a4-sheet-scale"
              style={{
                width: `${A4_WIDTH_MM * PREVIEW_SCALE}mm`,
                height: `${A4_HEIGHT_MM * PREVIEW_SCALE}mm`,
              }}
            >
              <div
                className="a4-sheet-page"
                style={{
                  width: `${A4_WIDTH_MM}mm`,
                  height: `${A4_HEIGHT_MM}mm`,
                  padding: `${SHEET_MARGIN_MM}mm`,
                  gridTemplateColumns: `repeat(${columns}, ${widthMm}mm)`,
                  gridAutoRows: `${heightMm}mm`,
                  gap: `${STICKER_GAP_MM}mm`,
                  transform: `scale(${PREVIEW_SCALE})`,
                }}
              >
                {stickerIndexes.map((stickerIndex) => (
                <BarcodeSticker
                  key={`${sheetIndex}-${stickerIndex}`}
                  product={data.product}
                  storeName={storeName}
                  widthMm={widthMm}
                  heightMm={heightMm}
                />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <p className="sticker-controls mx-auto mt-3 max-w-5xl text-center text-xs text-muted-foreground">
        Preview shows the complete A4 sheet layout, including any partially filled final sheet.
      </p>

      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        .a4-sheet-page {
          box-sizing: border-box;
          display: grid;
          align-content: start;
          justify-content: start;
          background: #fff;
          transform-origin: top left;
        }
        .a4-sheets-preview {
          flex-direction: column;
          align-items: center;
          gap: 6mm;
        }
        .single-sticker-preview {
          min-height: 100%;
          align-items: center;
          justify-content: center;
        }
        @media print {
          html,
          body {
            width: auto !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #fff !important;
          }
          main {
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .sticker-controls {
            display: none !important;
          }
          .single-sticker-preview {
            display: none !important;
          }
          .a4-sheets-preview {
            display: block !important;
          }
          .sticker-preview {
            display: block !important;
            width: auto !important;
            max-width: none !important;
            min-height: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            border: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .a4-sheet-scale {
            width: ${A4_WIDTH_MM}mm !important;
            height: ${A4_HEIGHT_MM}mm !important;
            margin: 0 !important;
          }
          .a4-sheet-page {
            width: ${A4_WIDTH_MM}mm !important;
            height: ${A4_HEIGHT_MM}mm !important;
            break-after: page;
            page-break-after: always;
            transform: none !important;
          }
          .a4-sheet-scale:last-child .a4-sheet-page {
            break-after: auto;
            page-break-after: auto;
          }
        }
      `}</style>
    </main>
  );
}
