import { asc, eq } from "drizzle-orm";
import { db } from "../index";
import { brands, categories, laptopSpecs, products } from "../schema";
import {
  createProductSchema,
  isLaptopCategory,
  type ProductFormValues,
} from "../validation/product";

export async function getProductFormOptions() {
  const [brandOptions, categoryOptions] = await Promise.all([
    db.select({ id: brands.id, name: brands.name }).from(brands).orderBy(asc(brands.name)),
    db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .orderBy(asc(categories.name)),
  ]);

  return { brands: brandOptions, categories: categoryOptions };
}

export async function createProduct(input: ProductFormValues) {
  const category = db
    .select({ name: categories.name })
    .from(categories)
    .where(eq(categories.id, input.categoryId))
    .get();
  const brand = db
    .select({ id: brands.id })
    .from(brands)
    .where(eq(brands.id, input.brandId))
    .get();

  if (!category) {
    throw new Error("The selected category is no longer available.");
  }
  if (!brand) {
    throw new Error("The selected brand is no longer available.");
  }

  const isLaptop = isLaptopCategory(category.name);
  const parsed = createProductSchema(isLaptop).safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid product details.");
  }

  const values = parsed.data;
  const quantity =
    values.trackingType === "SERIALIZED" ? 1 : values.quantity;
  const status = quantity === 0 ? "SOLD" : "AVAILABLE";

  return db.transaction((transaction) => {
    const inserted = transaction
      .insert(products)
      .values({
        name: values.name,
        brandId: values.brandId,
        categoryId: values.categoryId,
        trackingType: values.trackingType,
        quantity,
        costPrice: values.costPrice,
        sellingPrice: values.sellingPrice,
        status,
      })
      .returning({ id: products.id })
      .get();

    if (!inserted) {
      throw new Error("The product could not be created.");
    }

    const barcodeBase = `NX${String(inserted.id).padStart(10, "0")}`;
    let barcode = barcodeBase;
    let suffix = 1;
    while (
      transaction
        .select({ id: products.id })
        .from(products)
        .where(eq(products.barcode, barcode))
        .get()
    ) {
      barcode = `${barcodeBase}-${suffix}`;
      suffix += 1;
    }
    transaction
      .update(products)
      .set({ barcode })
      .where(eq(products.id, inserted.id))
      .run();

    if (isLaptop) {
      if (values.ramCapacityGb === undefined) {
        throw new Error("RAM capacity is required for laptops.");
      }
      if (values.ramType === undefined) {
        throw new Error("RAM type is required for laptops.");
      }
      if (values.storageCapacityGb === undefined) {
        throw new Error("Storage capacity is required for laptops.");
      }
      if (values.storageType === undefined) {
        throw new Error("Storage type is required for laptops.");
      }
      if (values.screenSize === undefined) {
        throw new Error("Screen size is required for laptops.");
      }
      if (!values.cpu?.trim()) {
        throw new Error("CPU is required for laptops.");
      }
      if (!values.gpu?.trim()) {
        throw new Error("GPU is required for laptops.");
      }
      if (!values.serialNumber?.trim()) {
        throw new Error("Serial number is required for laptops.");
      }

      transaction
        .insert(laptopSpecs)
        .values({
          productId: inserted.id,
          ramCapacityGb: values.ramCapacityGb,
          ramType: values.ramType,
          storageCapacityGb: values.storageCapacityGb,
          storageType: values.storageType,
          screenSize: values.screenSize,
          cpu: values.cpu.trim(),
          gpu: values.gpu.trim(),
          serialNumber: values.serialNumber.trim(),
        })
        .run();
    }

    return inserted.id;
  });
}
