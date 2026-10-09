
"use client";

import { useMemo, useState } from "react";
import { useAppContext } from "@/contexts/app-context";
import { AddProductDialog } from "@/components/inventory/add-product-dialog";
import { ProductDetailsDialog } from "@/components/inventory/product-details-dialog";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";

import {
  Barcode,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Package,
  Shapes,
} from "lucide-react";

const PAGE_SIZE = 7;

export default function InventoryPage() {
  const {
    products,
    isLoadingProducts,
    productsError,
    refreshProducts,
  } = useAppContext();

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );

  const columns = [
    { key: "name", label: "Product Name" },
    { key: "brand", label: "Brand Name" },
    { key: "category", label: "Category Name" },
    { key: "quantity", label: "Quantity" },
    { key: "sellingPrice", label: "Sell Price" },
    { key: "status", label: "Status" },
  ] as const satisfies readonly {
    key: keyof (typeof products)[number];
    label: string;
  }[];

  // All metrics come from the products loaded through App Context.
  const metrics = useMemo(
    () => [
      {
        label: "Total products",
        value: products.length,
        icon: Package,
      },
      {
        label: "Units in stock",
        value: products.reduce(
          (total, product) => total + product.quantity,
          0,
        ),
        icon: Boxes,
      },
      {
        label: "Quantity tracked",
        value: products.filter(
          (product) => product.trackingType === "QUANTITY",
        ).length,
        icon: Shapes,
      },
      {
        label: "Serialized",
        value: products.filter(
          (product) => product.trackingType === "SERIALIZED",
        ).length,
        icon: Barcode,
      },
    ],
    [products],
  );

  const pageCount = Math.ceil(products.length / PAGE_SIZE);

  // Keep pagination valid if a future CRUD operation changes the list.
  const safePage = Math.min(
    currentPage,
    Math.max(0, pageCount - 1),
  );

  const pageProducts = products.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  );

  const firstVisibleItem =
    products.length === 0 ? 0 : safePage * PAGE_SIZE + 1;

  const lastVisibleItem = Math.min(
    (safePage + 1) * PAGE_SIZE,
    products.length,
  );

  function formatValue(value: unknown): string {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    if (typeof value === "number") {
      return value.toLocaleString();
    }

    return String(value);
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-hidden p-4 lg:p-5">
      {/* Page heading */}
      <div className="flex shrink-0 items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Inventory
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage your products and stock.
          </p>
        </div>

        <AddProductDialog />
      </div>

      {/* Database-driven metrics */}
      <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Card key={metric.label} className="gap-3 py-4">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 px-5 pb-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </CardTitle>

                <Icon
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </CardHeader>

              <CardContent className="px-5">
                <div className="text-2xl font-semibold tracking-tight">
                  {metric.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Inventory table */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
        {isLoadingProducts ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Loading inventory...
            </p>
          </div>
        ) : productsError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-destructive">
              {productsError}
            </p>

            <Button
              variant="outline"
              onClick={() => void refreshProducts()}
            >
              Retry
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
            <Package className="size-8 text-muted-foreground" />

            <p className="font-medium">No products yet</p>

            <p className="text-sm text-muted-foreground">
              Products in your database will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="min-h-0 min-w-0 flex-1 overflow-auto">
              <Table className="min-w-max">
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className="whitespace-nowrap"
                      >
                        {column.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {pageProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      aria-label={`View details for ${product.name}`}
                      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => setSelectedProductId(product.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedProductId(product.id);
                        }
                      }}
                      tabIndex={0}
                    >
                      {columns.map((column) => {
                        const value = product[column.key];

                        return (
                          <TableCell
                            key={column.key}
                            className={
                              column.key === "name"
                                ? "whitespace-nowrap font-medium"
                                : "whitespace-nowrap"
                            }
                          >
                            {column.key === "status" &&
                            value !== null &&
                            value !== undefined ? (
                              <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium">
                                {formatValue(value)}
                              </span>
                            ) : (
                              formatValue(value)
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5">
              <p className="text-sm text-muted-foreground">
                Showing {firstVisibleItem}-{lastVisibleItem} of{" "}
                {products.length} products
              </p>

              <div className="flex items-center gap-2">
                <Button
                  aria-label="Previous page"
                  disabled={safePage === 0}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(0, page - 1))
                  }
                  size="sm"
                  variant="outline"
                >
                  <ChevronLeft />
                  Previous
                </Button>

                <span className="whitespace-nowrap text-sm text-muted-foreground">
                  Page {safePage + 1} of {pageCount}
                </span>

                <Button
                  aria-label="Next page"
                  disabled={safePage >= pageCount - 1}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(pageCount - 1, page + 1),
                    )
                  }
                  size="sm"
                  variant="outline"
                >
                  Next
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      <ProductDetailsDialog
        productId={selectedProductId}
        onOpenChange={(open) => {
          if (!open) setSelectedProductId(null);
        }}
      />
    </div>
  );
}