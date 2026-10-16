"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Check, ChevronDown, LayersPlus, X } from "lucide-react";
import { Combobox } from "@base-ui/react/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField, type SelectOption } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createProductSchema,
  editProductSchema,
  isLaptopCategory,
  type ProductFormValues,
} from "@/electron/db/validation/product";

type ProductFormOptions = Awaited<
  ReturnType<typeof window.electronAPI.getProductFormOptions>
>;

type AddProductDialogProps = {
  onProductCreated: (productId: number) => Promise<void>;
  editProductId?: number | null;
  onEditClose?: () => void;
};

const defaultValues: ProductFormValues = {
  name: "",
  brandId: null,
  categoryId: 0,
  trackingType: "QUANTITY",
  quantity: 0,
  costPrice: 0,
  sellingPrice: 0,
};

const fieldClassName = "flex flex-col gap-1.5 text-sm font-medium";
const numberInputClassName =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const ramCapacityOptions: SelectOption[] = [8, 16, 32, 64].map((value) => ({
  value: String(value),
  label: `${value} GB`,
}));

const ramTypeOptions: SelectOption[] = ["DDR4", "DDR5"].map((value) => ({
  value,
  label: value,
}));

const storageCapacityOptions: SelectOption[] = [128, 256, 512, 1024].map(
  (value) => ({
    value: String(value),
    label: `${value} GB`,
  }),
);

const storageTypeOptions: SelectOption[] = [
  { value: "NVME", label: "NVMe" },
  { value: "SSD", label: "SSD" },
  { value: "HDD", label: "HDD" },
];

function parseRamCapacity(value: string): ProductFormValues["ramCapacityGb"] {
  switch (value) {
    case "8":
      return 8;
    case "16":
      return 16;
    case "32":
      return 32;
    case "64":
      return 64;
    default:
      return undefined;
  }
}

function parseStorageCapacity(
  value: string,
): ProductFormValues["storageCapacityGb"] {
  switch (value) {
    case "128":
      return 128;
    case "256":
      return 256;
    case "512":
      return 512;
    case "1024":
      return 1024;
    default:
      return undefined;
  }
}

function toRamCapacity(
  value: number | null,
): ProductFormValues["ramCapacityGb"] {
  switch (value) {
    case 8:
    case 16:
    case 32:
    case 64:
      return value;
    default:
      return undefined;
  }
}

function toStorageCapacity(
  value: number | null,
): ProductFormValues["storageCapacityGb"] {
  switch (value) {
    case 128:
    case 256:
    case 512:
    case 1024:
      return value;
    default:
      return undefined;
  }
}

function toRamType(
  value: "DDR3" | "DDR4" | "DDR5" | null,
): ProductFormValues["ramType"] {
  if (value === "DDR4" || value === "DDR5") return value;
  return undefined;
}

export function AddProductDialog({
  onProductCreated,
  editProductId = null,
  onEditClose,
}: AddProductDialogProps) {
  const isEditing = editProductId !== null;
  const [open, setOpen] = useState(isEditing);
  const [options, setOptions] = useState<ProductFormOptions>({
    brands: [],
    categories: [],
  });
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(isEditing);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const brandInputId = useId();
  const form = useForm<ProductFormValues>({
    defaultValues,
  });

  const selectedCategoryId = useWatch({
    control: form.control,
    name: "categoryId",
  });
  const selectedBrandId = useWatch({
    control: form.control,
    name: "brandId",
  });
  const ramCapacityGb = useWatch({
    control: form.control,
    name: "ramCapacityGb",
  });
  const ramType = useWatch({ control: form.control, name: "ramType" });
  const storageCapacityGb = useWatch({
    control: form.control,
    name: "storageCapacityGb",
  });
  const storageType = useWatch({
    control: form.control,
    name: "storageType",
  });
  const trackingType = useWatch({
    control: form.control,
    name: "trackingType",
  });
  const selectedCategory = options.categories.find(
    (category) => category.id === selectedCategoryId,
  );
  const laptopSelected = selectedCategory
    ? isLaptopCategory(selectedCategory.name)
    : false;

  const loadOptions = useCallback(async (productId: number | null = null) => {
    setIsLoadingOptions(true);
    setIsLoadingProduct(productId !== null);
    setOptionsError(null);
    try {
      const [formOptions, product] = await Promise.all([
        window.electronAPI.getProductFormOptions(),
        productId === null
          ? Promise.resolve(null)
          : window.electronAPI.getProductForEdit(productId),
      ]);
      setOptions(formOptions);
      if (productId !== null) {
        if (!product) throw new Error("The product could not be found.");
        form.reset({
          name: product.name,
          brandId: product.brandId,
          categoryId: product.categoryId,
          trackingType: product.trackingType,
          quantity: product.quantity,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          ramCapacityGb: toRamCapacity(product.ramCapacityGb),
          ramType: toRamType(product.ramType),
          storageCapacityGb: toStorageCapacity(product.storageCapacityGb),
          storageType: product.storageType ?? undefined,
          screenSize: product.screenSize ?? undefined,
          cpu: product.cpu ?? "",
          gpu: product.gpu ?? "",
          serialNumber: product.serialNumber ?? "",
        });
      }
    } catch (cause) {
        console.error("[AddProduct] Failed to load form options:", cause);

        const message =
          cause instanceof Error
            ? `${cause.name}: ${cause.message}`
            : String(cause);

        setOptionsError(message);

      } finally {
        setIsLoadingOptions(false);
        setIsLoadingProduct(false);
      }
  }, [form]);

  useEffect(() => {
    if (editProductId !== null) {
      void Promise.resolve().then(() => loadOptions(editProductId));
    }
  }, [editProductId, loadOptions]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      if (!isEditing) void loadOptions();
    } else {
      form.reset(defaultValues);
      form.clearErrors();
      if (isEditing) onEditClose?.();
    }
  }

  const submit = form.handleSubmit(async (values) => {
    form.clearErrors();
    const parsed = (
      isEditing
        ? editProductSchema(laptopSelected)
        : createProductSchema(laptopSelected)
    ).safeParse(values);
    if (!parsed.success) {
      form.setError("root.validation", {
        type: "validation",
        message: parsed.error.issues[0]?.message ?? "Check the product details.",
      });
      return;
    }

    try {
      let productId: number;
      if (editProductId !== null) {
        productId = await window.electronAPI.updateProduct(
          editProductId,
          parsed.data,
        );
      } else {
        productId = await window.electronAPI.createProduct(parsed.data);
      }
      await onProductCreated(productId);
      toast.success(isEditing ? "Product updated successfully." : "Product added successfully.");
      form.reset(defaultValues);
      setOpen(false);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Could not save the product.";
      toast.error(
        `Product could not be ${isEditing ? "updated" : "added"}: ${message}`,
      );
    }
  });

  const brandItems = useMemo(
    () =>
      Combobox.createItems(options.brands, {
        getValue: (brand) => brand.id,
        getLabel: (brand) => brand.name,
      }),
    [options.brands],
  );
  const categoryOptions = options.categories.map(({ id, name }) => ({
    value: String(id),
    label: name,
  }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isEditing && (
        <DialogTrigger render={<Button />}>
          <LayersPlus className="size-4" />
          Add product
        </DialogTrigger>
      )}
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle>{isEditing ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the product details and specifications."
              : "Enter product details. A unique barcode will be generated automatically."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={submit}
        >
          <div className="app-scrollbar grid min-h-0 flex-1 content-start gap-4 overflow-y-auto overscroll-contain px-6 py-5">
          {isLoadingProduct && (
            <p className="sm:col-span-2 text-sm text-muted-foreground">
              Loading product details...
            </p>
          )}
          {optionsError && (
            <div className="flex items-center justify-between gap-3 sm:col-span-2">
              <p className="text-sm text-destructive" role="alert">
                {optionsError}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void loadOptions(editProductId)}
              >
                Retry
              </Button>
            </div>
          )}
          {isLoadingOptions && (
            <p className="sm:col-span-2 text-sm text-muted-foreground">
              Loading brands and categories...
            </p>
          )}
          {!isLoadingOptions &&
            !optionsError &&
            options.categories.length === 0 && (
              <p className="sm:col-span-2 text-sm text-muted-foreground">
                Add at least one category before creating a product.
              </p>
            )}

          <label className={`${fieldClassName} sm:col-span-2`}>
            Product name
            <Input
              autoComplete="off"
              maxLength={40}
              placeholder="e.g. NexTech Pro Laptop"
              {...form.register("name")}
            />
          </label>

          <div className={fieldClassName}>
            <label htmlFor={brandInputId}>Brand</label>
            <Combobox.Root
              items={brandItems}
              value={selectedBrandId ?? null}
              onValueChange={(value) =>
                form.setValue("brandId", value, { shouldDirty: true })
              }
              disabled={isLoadingOptions}
            >
              <Combobox.InputGroup
                aria-invalid={Boolean(form.formState.errors.brandId)}
                className="flex h-8 w-full items-center gap-1 rounded-lg border border-input bg-background px-2.5 text-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
              >
                <Combobox.Input
                  id={brandInputId}
                  autoComplete="off"
                  placeholder="Search or select a brand"
                  aria-invalid={Boolean(form.formState.errors.brandId)}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
                />
                <Combobox.Clear
                  aria-label="Clear selected brand"
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none"
                >
                  <X className="size-4" />
                </Combobox.Clear>
                <Combobox.Trigger
                  aria-label="Show brands"
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none"
                >
                  <ChevronDown className="size-4" />
                </Combobox.Trigger>
              </Combobox.InputGroup>
              <Combobox.Portal>
                <Combobox.Positioner
                  sideOffset={4}
                  className="z-[70] outline-none"
                >
                  <Combobox.Popup className="w-max min-w-[var(--anchor-width)] max-w-[var(--available-width)] rounded-lg border bg-popover text-popover-foreground shadow-md">
                    <Combobox.Empty className="px-3 py-2 text-sm text-muted-foreground">
                      No brands found.
                    </Combobox.Empty>
                    <Combobox.List className="app-scrollbar max-h-60 overflow-y-auto overscroll-contain p-1">
                      {(brand) => (
                        <Combobox.Item
                          key={brand.id}
                          value={brand.id}
                          className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                        >
                          <Combobox.ItemIndicator className="inline-flex size-4 items-center justify-center">
                            <Check className="size-4" />
                          </Combobox.ItemIndicator>
                          <span>{brand.name}</span>
                        </Combobox.Item>
                      )}
                    </Combobox.List>
                  </Combobox.Popup>
                </Combobox.Positioner>
              </Combobox.Portal>
            </Combobox.Root>
          </div>

          <label className={fieldClassName}>
            Category
            <SelectField
              value={
                selectedCategoryId > 0
                  ? String(selectedCategoryId)
                  : null
              }
              options={categoryOptions}
              placeholder="Select a category"
              disabled={isLoadingOptions || categoryOptions.length === 0}
              invalid={Boolean(form.formState.errors.categoryId)}
              onValueChange={(value) => {
                if (value !== null) {
                  form.setValue("categoryId", Number(value), {
                    shouldDirty: true,
                  });
                  form.clearErrors("root.validation");
                }
              }}
            />
          </label>

          <label className={fieldClassName}>
            Tracking type
            <SelectField
              value={trackingType}
              options={[
                { value: "QUANTITY", label: "Quantity" },
                { value: "SERIALIZED", label: "Serialized" },
              ]}
              placeholder="Select tracking type"
              onValueChange={(value) => {
                if (value === "QUANTITY" || value === "SERIALIZED") {
                  form.setValue("trackingType", value, {
                    shouldDirty: true,
                  });
                  form.setValue(
                    "quantity",
                    value === "SERIALIZED" ? 1 : 0,
                    { shouldDirty: true },
                  );
                }
              }}
            />
          </label>

          <label className={fieldClassName}>
            Quantity
            <Input
              className={numberInputClassName}
              inputMode="numeric"
              readOnly={trackingType === "SERIALIZED" && !isEditing}
              disabled={isLoadingProduct}
              min={isEditing ? 0 : 1}
              step={1}
              type="number"
              {...form.register("quantity", { valueAsNumber: true })}
            />
            {trackingType === "SERIALIZED" && (
              <span className="text-xs font-normal text-muted-foreground">
                Serialized products start with one available unit.
              </span>
            )}
          </label>

          <label className={fieldClassName}>
            Cost price
            <Input
              className={numberInputClassName}
              inputMode="decimal"
              step="any"
              type="number"
              {...form.register("costPrice", { valueAsNumber: true })}
            />
          </label>

          <label className={fieldClassName}>
            Selling price
            <Input
              className={numberInputClassName}
              inputMode="decimal"
              step="any"
              type="number"
              {...form.register("sellingPrice", { valueAsNumber: true })}
            />
          </label>

          {laptopSelected && (
            <>
              <label className={fieldClassName}>
                <span>RAM capacity</span>
                <SelectField
                  value={
                    ramCapacityGb === undefined ? null : String(ramCapacityGb)
                  }
                  options={ramCapacityOptions}
                  placeholder="Select RAM capacity"
                  onValueChange={(value) => {
                    if (value !== null) {
                      const capacity = parseRamCapacity(value);
                      if (capacity !== undefined) {
                        form.setValue("ramCapacityGb", capacity, {
                          shouldDirty: true,
                        });
                      }
                    }
                  }}
                />
              </label>

              <label className={fieldClassName}>
                <span>RAM type</span>
                <SelectField
                  value={ramType ?? null}
                  options={ramTypeOptions}
                  placeholder="Select RAM type"
                  onValueChange={(value) => {
                    if (value === "DDR4" || value === "DDR5") {
                      form.setValue("ramType", value, { shouldDirty: true });
                    }
                  }}
                />
              </label>

              <label className={fieldClassName}>
                <span>Storage capacity</span>
                <SelectField
                  value={
                    storageCapacityGb === undefined
                      ? null
                      : String(storageCapacityGb)
                  }
                  options={storageCapacityOptions}
                  placeholder="Select storage capacity"
                  onValueChange={(value) => {
                    if (value !== null) {
                      const capacity = parseStorageCapacity(value);
                      if (capacity !== undefined) {
                        form.setValue("storageCapacityGb", capacity, {
                          shouldDirty: true,
                        });
                      }
                    }
                  }}
                />
              </label>

              <label className={fieldClassName}>
                <span>Storage type</span>
                <SelectField
                  value={storageType ?? null}
                  options={storageTypeOptions}
                  placeholder="Select storage type"
                  onValueChange={(value) => {
                    if (
                      value === "NVME" ||
                      value === "SSD" ||
                      value === "HDD"
                    ) {
                      form.setValue("storageType", value, {
                        shouldDirty: true,
                      });
                    }
                  }}
                />
              </label>

              <label className={fieldClassName}>
                Screen size (inches)
                <Input
                  className={numberInputClassName}
                  inputMode="decimal"
                  min={0}
                  step="any"
                  type="number"
                  {...form.register("screenSize", { valueAsNumber: true })}
                />
              </label>

              <label className={fieldClassName}>
                CPU
                <Input autoComplete="off" {...form.register("cpu")} />
              </label>

              <label className={fieldClassName}>
                GPU
                <Input autoComplete="off" {...form.register("gpu")} />
              </label>

              <label className={fieldClassName}>
                Serial number
                <Input autoComplete="off" {...form.register("serialNumber")} />
              </label>
            </>
          )}

          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t bg-background px-6 py-4">
            {form.formState.errors.root?.validation?.message && (
              <p className="text-sm text-destructive" role="alert">
                {form.formState.errors.root.validation.message}
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting ||
                  isLoadingOptions ||
                  isLoadingProduct
                }
              >
                {form.formState.isSubmitting
                  ? isEditing
                    ? "Saving..."
                    : "Adding..."
                  : isEditing
                    ? "Save changes"
                    : "Add product"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
