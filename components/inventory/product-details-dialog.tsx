"use client";

import { useEffect, useState } from "react";
import { Pencil, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProductDetails = Awaited<
  ReturnType<typeof window.electronAPI.getProductDetails>
>;

type ProductDetailsDialogProps = {
  productId: number | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (productId: number) => void;
};

type ProductRequest = {
  productId: number;
  retryCount: number;
  product: ProductDetails;
  error: string | null;
};

function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return typeof value === "number" ? value.toLocaleString() : value;
}

function formatPrice(value: number): string {
  return `${value.toLocaleString()} DA`;
}

function formatDate(value: Date): string {
  return value.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStorageType(value: string | null): string {
  if (value === "NVME") return "NVMe";
  if (value === "SATA") return "SSD";
  return formatValue(value);
}

export function ProductDetailsDialog({
  productId,
  onOpenChange,
  onEdit,
}: ProductDetailsDialogProps) {
  const open = productId !== null;
  const [request, setRequest] = useState<ProductRequest | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  const hasCurrentRequest =
    request?.productId === productId && request.retryCount === retryCount;
  const product = hasCurrentRequest ? request.product : null;
  const error = hasCurrentRequest ? request.error : null;
  const isLoading = open && !hasCurrentRequest;

  useEffect(() => {
    if (!open || productId === null) return;

    let isCurrentRequest = true;

    window.electronAPI
      .getProductDetails(productId)
      .then((result) => {
        if (isCurrentRequest) {
          setRequest({
            productId,
            retryCount,
            product: result,
            error: null,
          });
        }
      })
      .catch((cause: unknown) => {
        if (isCurrentRequest) {
          setRequest({
            productId,
            retryCount,
            product: null,
            error:
              cause instanceof Error
                ? cause.message
                : "Could not load product details.",
          });
        }
      })

    return () => {
      isCurrentRequest = false;
    };
  }, [open, productId, retryCount]);

  async function openStickerPreview() {
    if (!product) return;
    try {
      setBarcodeError(null);
      await window.electronAPI.openStickerPreview(product.id);
    } catch (cause) {
      setBarcodeError(
        cause instanceof Error
          ? cause.message
          : "Could not open the barcode sticker preview.",
      );
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setBarcodeError(null);
    }
    onOpenChange(nextOpen);
  }

  const isLaptop =
    product?.category.trim().toLowerCase() === "laptop" ||
    product?.category.trim().toLowerCase() === "laptops";

  const specifications = product
    ? [
        { label: "Processor", value: formatValue(product.cpu) },
        { label: "Graphics", value: formatValue(product.gpu) },
        {
          label: "RAM",
          value: `${formatValue(product.ramCapacityGb)} GB ${formatValue(product.ramType)}`,
        },
        {
          label: "Storage",
          value: `${formatValue(product.storageCapacityGb)} GB ${formatStorageType(product.storageType)}`,
        },
        {
          label: "Screen size",
          value:
            product.screenSize === null
              ? "—"
              : `${formatValue(product.screenSize)} inches`,
        },
        { label: "Serial number", value: formatValue(product.serialNumber) },
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <div className="flex items-start justify-between gap-4 border-b pb-4 pr-8 sm:pr-10">
          <DialogHeader className="min-w-0">
            <DialogTitle>{product?.name ?? "Product details"}</DialogTitle>
            {product && (
              <DialogDescription>
                {formatValue(product.brand)} · {product.category}
              </DialogDescription>
            )}
            {product && (
              <p className="text-xs text-muted-foreground">
                Barcode: {formatValue(product.barcode)}
              </p>
            )}
          </DialogHeader>

          {product && (
            <div className="flex shrink-0 flex-col gap-2">
              <Button
                onClick={() => void openStickerPreview()}
                size="sm"
                variant="outline"
              >
                <Printer />
                Print Barcode
              </Button>
              <Button
                onClick={() => onEdit(product.id)}
                size="sm"
                variant="outline"
              >
                <Pencil />
                Edit
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading product details...
          </p>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              onClick={() => setRetryCount((count) => count + 1)}
              size="sm"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        ) : !product ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Product not found.
          </p>
        ) : (
          <div className="space-y-5">
            <section className="space-y-4">
              <h3 className="font-semibold">Product details</h3>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Available quantity
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {formatValue(product.quantity)} units
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Selling price
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {formatPrice(product.sellingPrice)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Cost price</dt>
                  <dd className="mt-1 font-semibold">
                    {formatPrice(product.costPrice)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Created</dt>
                  <dd className="mt-1 font-semibold">
                    {formatDate(product.createdAt)}
                  </dd>
                </div>
              </dl>
            </section>

            {isLaptop && (
              <section className="space-y-4 border-t pt-5">
                <h3 className="font-semibold">Specifications</h3>
                <dl className="space-y-3">
                  {specifications.map((specification) => (
                    <div
                      className="flex items-start justify-between gap-4"
                      key={specification.label}
                    >
                      <dt className="text-sm text-muted-foreground">
                        {specification.label}
                      </dt>
                      <dd className="text-right text-sm font-semibold">
                        {specification.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <section className="border-t pt-4">
              <dl className="flex items-start justify-between gap-4">
                <dt className="text-sm text-muted-foreground">Last updated</dt>
                <dd className="text-right text-sm font-semibold">
                  {formatDate(product.updatedAt)}
                </dd>
              </dl>
            </section>

            {barcodeError && (
              <p role="alert" className="text-sm text-destructive">
                Could not print barcode: {barcodeError}
              </p>
            )}
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
