"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import JsBarcode from "jsbarcode";

type StickerProduct = NonNullable<
  Awaited<ReturnType<typeof window.electronAPI.getProductDetails>>
>;

type BarcodeStickerProps = {
  product: StickerProduct;
  storeName: string;
  widthMm: number;
  heightMm: number;
};

export function isSupportedStickerBarcode(
  value: string | null | undefined,
): boolean {
  return typeof value === "string" &&
    value.length > 0 &&
    /^[\x20-\x7e]+$/.test(value);
}

function specificationsFor(product: StickerProduct): string {
  const values = [
    product.cpu,
    product.ramCapacityGb && product.ramType
      ? `${product.ramCapacityGb} GB ${product.ramType}`
      : null,
    product.storageCapacityGb && product.storageType
      ? `${product.storageCapacityGb} GB ${product.storageType === "NVME" ? "NVMe" : product.storageType}`
      : null,
    product.screenSize ? `${product.screenSize}"` : null,
  ].filter((value): value is string => Boolean(value?.trim()));

  return values.join(" · ");
}

export function BarcodeSticker({
  product,
  storeName,
  widthMm,
  heightMm,
}: BarcodeStickerProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const barcodeMessageRef = useRef<HTMLSpanElement>(null);
  const specifications = specificationsFor(product);

  useEffect(() => {
    if (!barcodeRef.current) return;
    barcodeRef.current.replaceChildren();
    if (barcodeMessageRef.current) {
      barcodeMessageRef.current.textContent = "";
      barcodeMessageRef.current.hidden = true;
    }

    if (!isSupportedStickerBarcode(product.barcode)) {
      if (barcodeMessageRef.current) {
        barcodeMessageRef.current.textContent =
          product.barcode?.trim()
            ? "This product's barcode contains unsupported characters."
            : "This product has no barcode. Create or update its barcode before printing.";
        barcodeMessageRef.current.hidden = false;
      }
      return;
    }

    try {
      JsBarcode(barcodeRef.current, product.barcode ?? "", {
        format: "CODE128",
        background: "#ffffff",
        displayValue: false,
        height: 34,
        lineColor: "#000000",
        margin: 8,
        width: 1.35,
      });
    } catch {
      if (barcodeMessageRef.current) {
        barcodeMessageRef.current.textContent =
          "This product's barcode could not be encoded as CODE128.";
        barcodeMessageRef.current.hidden = false;
      }
    }
  }, [product.barcode]);
  const barcodeUnsupported = !isSupportedStickerBarcode(product.barcode);

  return (
    <div
      className="barcode-sticker"
      style={
        {
          width: `${widthMm}mm`,
          height: `${heightMm}mm`,
        } satisfies CSSProperties
      }
    >
      <div className="sticker-shop-name" title={storeName}>
        <span>{storeName}</span>
      </div>
      <div className="sticker-content">
        <div className="sticker-product-name" title={product.name}>
          {product.name}
        </div>
        {specifications && (
          <div className="sticker-specifications" title={specifications}>
            {specifications}
          </div>
        )}
        <div className="sticker-barcode">
          <svg ref={barcodeRef} aria-label={`Barcode ${product.barcode ?? ""}`} />
          <span
            ref={barcodeMessageRef}
            className="sticker-barcode-error"
            hidden
          />
          {!barcodeUnsupported && (
            <span className="sticker-barcode-value">{product.barcode}</span>
          )}
        </div>
        <div className="sticker-price">
          Price: {product.sellingPrice.toLocaleString("fr-DZ")} DA
        </div>
      </div>
      <style jsx>{`
        .barcode-sticker {
          box-sizing: border-box;
          display: flex;
          align-items: stretch;
          gap: 1.2mm;
          overflow: hidden;
          padding: 1.8mm;
          border: 0.25mm solid #d1d5db;
          border-radius: 1.4mm;
          background: #fff;
          color: #000;
          font-family: Arial, Helvetica, sans-serif;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        .sticker-shop-name {
          display: flex;
          flex: 0 0 5mm;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-right: 0.2mm solid #d1d5db;
          padding-right: 1mm;
        }
        .sticker-shop-name span {
          font-size: 7pt;
          font-weight: 700;
          letter-spacing: 0.15mm;
          text-align: center;
          text-overflow: ellipsis;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          white-space: nowrap;
        }
        .sticker-content {
          display: flex;
          min-width: 0;
          flex: 1;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
          text-align: center;
        }
        .sticker-product-name {
          display: -webkit-box;
          width: 100%;
          overflow: hidden;
          font-size: 8pt;
          font-weight: 700;
          line-height: 1.1;
          overflow-wrap: anywhere;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
        .sticker-specifications {
          width: 100%;
          overflow: hidden;
          font-size: 6pt;
          line-height: 1.1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sticker-barcode {
          display: flex;
          width: 100%;
          min-height: 0;
          flex: 1;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-top: 0.2mm solid #d1d5db;
          padding-top: 0.8mm;
        }
        .sticker-barcode :global(svg) {
          display: block;
          width: auto;
          max-width: 100%;
          max-height: 100%;
        }
        .sticker-barcode-value {
          max-width: 100%;
          overflow: hidden;
          font-family: "Courier New", monospace;
          font-size: 6pt;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sticker-barcode-error {
          padding: 0 1mm;
          color: #b91c1c;
          font-size: 6pt;
        }
        .sticker-price {
          width: 100%;
          border-top: 0.2mm solid #d1d5db;
          padding-top: 0.8mm;
          font-size: 8pt;
          font-weight: 700;
          line-height: 1;
        }
      `}</style>
    </div>
  );
}
