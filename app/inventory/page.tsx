"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAppContext } from "@/contexts/app-context";
import { AddProductDialog } from "@/components/inventory/add-product-dialog";
import { ProductDetailsDialog } from "@/components/inventory/product-details-dialog";
import { ProductDeleteDialog } from "@/components/inventory/product-delete-dialog";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { SelectField, type SelectOption } from "@/components/ui/select";

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
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Package,
  Search,
  Shapes,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

const PAGE_SIZE = 6;
const LOW_STOCK_THRESHOLD = 3;

const statusLabels: Record<string, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  OUT_OF_STOCK: "Out of stock",
  HELD: "Held",
};

type StockStatusFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";
type TrackingTypeFilter = "all" | "QUANTITY" | "SERIALIZED";
type DatePreset = "all" | "today" | "last_7_days" | "last_30_days" | "custom";

type FilterPopoverProps = {
  open: boolean;
  active: boolean;
  triggerLabel: string;
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
};

function FilterPopover({
  open,
  active,
  triggerLabel,
  children,
  onOpenChange,
}: FilterPopoverProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        event.target instanceof Element &&
        event.target.closest('[role="listbox"]')
      ) {
        return;
      }

      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [onOpenChange, open]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant={active ? "secondary" : "outline"}
        size="sm"
        onClick={() => onOpenChange(!open)}
        className="gap-2"
      >
        {triggerLabel}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border bg-popover p-3 shadow-xl backdrop-blur-sm">
          {children}
        </div>
      )}
    </div>
  );
}

function parseLocalDate(dateString: string): Date | null {
  if (!dateString) {
    return null;
  }

  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function getProductDateValue(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDateRangeForPreset(
  preset: DatePreset,
  customStartDate: string,
  customEndDate: string,
) {
  const now = new Date();

  if (preset === "all") {
    return null;
  }

  if (preset === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (preset === "last_7_days") {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (preset === "last_30_days") {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  const parsedStart = parseLocalDate(customStartDate);
  const parsedEnd = parseLocalDate(customEndDate);

  if (!parsedStart && !parsedEnd) {
    return null;
  }

  let startDate = parsedStart;
  let endDate = parsedEnd;
  if (
    startDate &&
    endDate &&
    startDate.getTime() > endDate.getTime()
  ) {
    [startDate, endDate] = [endDate, startDate];
  }

  const start = startDate ? new Date(startDate) : null;
  start?.setHours(0, 0, 0, 0);
  const end = endDate ? new Date(endDate) : null;
  end?.setHours(23, 59, 59, 999);

  return { start, end };
}

function getProductStockStatus(product: {
  status?: string | null;
  trackingType: string;
  quantity: number;
}) {
  if (product.status === "HELD") {
    return "OUT_OF_STOCK";
  }

  if (product.trackingType === "SERIALIZED") {
    return product.quantity > 0 ? "IN_STOCK" : "OUT_OF_STOCK";
  }

  if (product.quantity <= 0) {
    return "OUT_OF_STOCK";
  }

  if (product.quantity <= LOW_STOCK_THRESHOLD) {
    return "LOW_STOCK";
  }

  return "IN_STOCK";
}

export default function InventoryPage() {
  const {
    products,
    categories,
    isLoadingProducts,
    productsError,
    refreshProducts,
  } = useAppContext();

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [editingProductId, setEditingProductId] = useState<number | null>(
    null,
  );
  const [productToDelete, setProductToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [selectedStockStatus, setSelectedStockStatus] =
    useState<StockStatusFilter>("all");
  const [selectedTrackingType, setSelectedTrackingType] =
    useState<TrackingTypeFilter>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  const categoryOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "All categories" },
      ...categories.map((category) => ({
        value: String(category.id),
        label: category.name,
      })),
    ],
    [categories],
  );

  const stockOptions: SelectOption[] = [
    { value: "all", label: "All stock" },
    { value: "in_stock", label: "In stock" },
    { value: "low_stock", label: "Low stock" },
    { value: "out_of_stock", label: "Out of stock" },
  ];

  const trackingTypeOptions: SelectOption[] = [
    { value: "all", label: "All product types" },
    { value: "QUANTITY", label: "Quantity tracked" },
    { value: "SERIALIZED", label: "Serialized" },
  ];

  const dateOptions: SelectOption[] = [
    { value: "all", label: "Any time" },
    { value: "today", label: "Today" },
    { value: "last_7_days", label: "Last 7 days" },
    { value: "last_30_days", label: "Last 30 days" },
    { value: "custom", label: "Custom date range" },
  ];

  const hasActiveFilters =
    Boolean(searchValue.trim()) ||
    selectedCategoryId !== "all" ||
    selectedStockStatus !== "all" ||
    selectedTrackingType !== "all" ||
    datePreset !== "all";

  function updateFilter<T>(setFilter: (value: T) => void, value: T) {
    setCurrentPage(0);
    setFilter(value);
  }

  async function handleProductSaved(productId: number) {
    await refreshProducts();
    setEditingProductId(null);
    setSelectedProductId(productId);
  }

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const activeDateRange = getDateRangeForPreset(
      datePreset,
      customStartDate,
      customEndDate,
    );

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        (product.barcode ?? "").toLowerCase().includes(normalizedSearch) ||
        (product.brand ?? "").toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        selectedCategoryId === "all" ||
        String(product.categoryId) === selectedCategoryId;

      const matchesTrackingType =
        selectedTrackingType === "all" ||
        product.trackingType === selectedTrackingType;

      const statusMap: Record<StockStatusFilter, string> = {
        all: "",
        in_stock: "IN_STOCK",
        low_stock: "LOW_STOCK",
        out_of_stock: "OUT_OF_STOCK",
      };

      const stockStatus = getProductStockStatus(product);
      const matchesStock =
        selectedStockStatus === "all" ||
        stockStatus === statusMap[selectedStockStatus];

      let matchesDate = true;
      if (datePreset !== "all") {
        if (
          datePreset === "custom" &&
          !customStartDate &&
          !customEndDate
        ) {
          matchesDate = true;
        } else if (!activeDateRange) {
          matchesDate = false;
        } else {
          const productDate = getProductDateValue(product.createdAt);
          matchesDate =
            productDate !== null &&
            (activeDateRange.start === null ||
              productDate.getTime() >= activeDateRange.start.getTime()) &&
            (activeDateRange.end === null ||
              productDate.getTime() <= activeDateRange.end.getTime());
        }
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesTrackingType &&
        matchesStock &&
        matchesDate
      );
    });
  }, [
    products,
    searchValue,
    selectedCategoryId,
    selectedStockStatus,
    selectedTrackingType,
    datePreset,
    customStartDate,
    customEndDate,
  ]);

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

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, Math.max(0, pageCount - 1));
  const pageProducts = filteredProducts.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  );

  const firstVisibleItem =
    filteredProducts.length === 0 ? 0 : safePage * PAGE_SIZE + 1;

  const lastVisibleItem = Math.min(
    (safePage + 1) * PAGE_SIZE,
    filteredProducts.length,
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

  const resetFilters = () => {
    setCurrentPage(0);
    setSearchValue("");
    setSelectedCategoryId("all");
    setSelectedStockStatus("all");
    setSelectedTrackingType("all");
    setDatePreset("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setIsDatePopoverOpen(false);
    setIsAdvancedFiltersOpen(false);
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-hidden p-4 lg:p-5">
      <div className="flex shrink-0 items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage your products and stock.
          </p>
        </div>

        <AddProductDialog onProductCreated={handleProductSaved} />
      </div>

      <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Card key={metric.label} className="gap-3 py-4">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 px-5 pb-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </CardTitle>

                <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
        <div className="border-b bg-card/80 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(event) =>
                  updateFilter(setSearchValue, event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                  }
                }}
                aria-label="Search products by name, barcode or brand"
                placeholder="Search products, barcode, brand"
                className="h-8 pl-8 pr-8"
              />
              {searchValue && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => updateFilter(setSearchValue, "")}
                  className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="w-[180px] min-w-[150px]">
              <SelectField
                value={selectedCategoryId}
                options={categoryOptions}
                placeholder="All categories"
                onValueChange={(value) =>
                  updateFilter(setSelectedCategoryId, value ?? "all")
                }
              />
            </div>

            <div className="w-[160px] min-w-[140px]">
              <SelectField
                value={selectedStockStatus}
                options={stockOptions}
                placeholder="All stock"
                onValueChange={(value) =>
                  updateFilter(
                    setSelectedStockStatus,
                    (value as StockStatusFilter) ?? "all",
                  )
                }
              />
            </div>

            <FilterPopover
              open={isDatePopoverOpen}
              active={datePreset !== "all"}
              triggerLabel={
                datePreset === "all"
                  ? "Date"
                  : `Date: ${dateOptions.find((option) => option.value === datePreset)?.label ?? "Custom"}`
              }
              onOpenChange={setIsDatePopoverOpen}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  Date added
                </div>

                <SelectField
                  value={datePreset}
                  options={dateOptions}
                  placeholder="Any time"
                  onValueChange={(value) => {
                    const nextPreset = (value as DatePreset) ?? "all";
                    updateFilter(setDatePreset, nextPreset);
                    if (nextPreset !== "custom") {
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }
                  }}
                />

                {datePreset === "custom" && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="space-y-1 text-xs text-muted-foreground">
                      <span>Start</span>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(event) =>
                          updateFilter(setCustomStartDate, event.target.value)
                        }
                      />
                    </label>
                    <label className="space-y-1 text-xs text-muted-foreground">
                      <span>End</span>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(event) =>
                          updateFilter(setCustomEndDate, event.target.value)
                        }
                      />
                    </label>
                  </div>
                )}
              </div>
            </FilterPopover>

            <FilterPopover
              open={isAdvancedFiltersOpen}
              active={selectedTrackingType !== "all"}
              triggerLabel={
                selectedTrackingType === "all"
                  ? "Advanced filters"
                  : "Product type"
              }
              onOpenChange={setIsAdvancedFiltersOpen}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <SlidersHorizontal className="size-4 text-muted-foreground" />
                  Advanced filters
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Product type
                  </label>
                  <SelectField
                    value={selectedTrackingType}
                    options={trackingTypeOptions}
                    placeholder="All product types"
                    onValueChange={(value) =>
                      updateFilter(
                        setSelectedTrackingType,
                        value === "QUANTITY" || value === "SERIALIZED"
                          ? value
                          : "all",
                      )
                    }
                  />
                </div>
              </div>
            </FilterPopover>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={resetFilters}
              >
                <Filter className="size-3.5" />
                Reset filters
              </Button>
            )}
          </div>
        </div>

        {isLoadingProducts ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading inventory...</p>
          </div>
        ) : productsError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-destructive">{productsError}</p>

            <Button variant="outline" onClick={() => void refreshProducts()}>
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
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <Search className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">No products match your filters</p>
              <p className="text-sm text-muted-foreground">
                Try a different search, category, stock, date range, or reset all filters.
              </p>
            </div>
            <Button variant="outline" onClick={resetFilters}>
              Reset filters
            </Button>
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
                    <TableHead className="whitespace-nowrap text-right">
                      Actions
                    </TableHead>
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
                            {column.key === "status" && typeof value === "string" ? (
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                  value === "IN_STOCK"
                                    ? "bg-green-500/15 text-green-700 dark:text-green-400"
                                    : value === "LOW_STOCK"
                                      ? "bg-orange-500/15 text-orange-700 dark:text-orange-400"
                                      : value === "OUT_OF_STOCK"
                                        ? "bg-red-500/15 text-red-700 dark:text-red-400"
                                        : "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                                }`}
                              >
                                {statusLabels[value] ?? value}
                              </span>
                            ) : column.key === "sellingPrice" && typeof value === "number" ? (
                              `${formatValue(value)} DA`
                            ) : column.key === "brand" && value === null ? (
                              "—"
                            ) : (
                              formatValue(value)
                            )}
                          </TableCell>
                        );
                      })}

                      <TableCell className="text-right">
                        <Button
                          aria-label={`Delete ${product.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setProductToDelete({
                              id: product.id,
                              name: product.name,
                            });
                          }}
                          onKeyDown={(event) => event.stopPropagation()}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5">
              <p className="text-sm text-muted-foreground">
                Showing {firstVisibleItem}-{lastVisibleItem} of {filteredProducts.length} products
              </p>

              <div className="flex items-center gap-2">
                <Button
                  aria-label="Previous page"
                  disabled={safePage === 0}
                  onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
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
                    setCurrentPage((page) => Math.min(pageCount - 1, page + 1))
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
        onEdit={(productId) => {
          setSelectedProductId(null);
          setEditingProductId(productId);
        }}
        onOpenChange={(open) => {
          if (!open) setSelectedProductId(null);
        }}
      />
      <ProductDeleteDialog
        product={productToDelete}
        onOpenChange={(open) => {
          if (!open) setProductToDelete(null);
        }}
        onDeleted={async () => {
          setProductToDelete(null);
          await refreshProducts();
        }}
      />
      {editingProductId !== null && (
        <AddProductDialog
          key={editingProductId}
          editProductId={editingProductId}
          onEditClose={() => setEditingProductId(null)}
          onProductCreated={handleProductSaved}
        />
      )}
    </div>
  );
}
