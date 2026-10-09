"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { LayersPlus } from "lucide-react";
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
  isLaptopCategory,
  type ProductFormValues,
} from "@/electron/db/validation/product";

type ProductFormOptions = Awaited<
  ReturnType<typeof window.electronAPI.getProductFormOptions>
>;

type AddProductDialogProps = {
  onProductCreated: (productId: number) => Promise<void>;
};

const defaultValues: ProductFormValues = {
  name: "",
  brandId: 0,
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

export function AddProductDialog({
  onProductCreated,
}: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ProductFormOptions>({
    brands: [],
    categories: [],
  });
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
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

  function loadOptions() {
    setIsLoadingOptions(true);
    setOptionsError(null);
    window.electronAPI
      .getProductFormOptions()
      .then(setOptions)
      .catch((cause: unknown) => {
        const message =
          cause instanceof Error
            ? cause.message
            : "Could not load brand and category options.";
        setOptionsError(message);
      })
      .finally(() => setIsLoadingOptions(false));
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      loadOptions();
    } else {
      form.reset(defaultValues);
      form.clearErrors();
    }
  }

  const submit = form.handleSubmit(async (values) => {
    form.clearErrors();
    const parsed = createProductSchema(laptopSelected).safeParse(values);
    if (!parsed.success) {
      form.setError("root.validation", {
        type: "validation",
        message: parsed.error.issues[0]?.message ?? "Check the product details.",
      });
      return;
    }

    try {
      const productId = await window.electronAPI.createProduct(parsed.data);
      await onProductCreated(productId);
      toast.success("Product added successfully.");
      form.reset(defaultValues);
      setOpen(false);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Could not add the product.";
      toast.error(`Product could not be added: ${message}`);
    }
  });

  const brandOptions = options.brands.map(({ id, name }) => ({
    value: String(id),
    label: name,
  }));
  const categoryOptions = options.categories.map(({ id, name }) => ({
    value: String(id),
    label: name,
  }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <LayersPlus className="size-4" />
        Add product
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>
            Enter product details. A unique barcode will be generated
            automatically.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          {optionsError && (
            <div className="flex items-center justify-between gap-3 sm:col-span-2">
              <p className="text-sm text-destructive" role="alert">
                {optionsError}
              </p>
              <Button type="button" size="sm" variant="outline" onClick={loadOptions}>
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
            (options.brands.length === 0 || options.categories.length === 0) && (
              <p className="sm:col-span-2 text-sm text-muted-foreground">
                Add at least one brand and one category before creating a
                product.
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

          <label className={fieldClassName}>
            Brand
            <SelectField
              value={
                selectedBrandId > 0
                  ? String(selectedBrandId)
                  : null
              }
              options={brandOptions}
              placeholder="Select a brand"
              disabled={isLoadingOptions || brandOptions.length === 0}
              invalid={Boolean(form.formState.errors.brandId)}
              onValueChange={(value) => {
                if (value !== null) {
                  form.setValue("brandId", Number(value), {
                    shouldDirty: true,
                  });
                }
              }}
            />
          </label>

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
              min={0}
              readOnly={trackingType === "SERIALIZED"}
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

          {form.formState.errors.root?.validation?.message && (
            <p className="sm:col-span-2 text-sm text-destructive" role="alert">
              {form.formState.errors.root.validation.message}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Adding..." : "Add product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
