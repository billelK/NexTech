import { eq } from "drizzle-orm";
import { db } from "../index";
import { brands, categories, laptopSpecs, products } from "../schema";
import {
  editProductSchema,
  isLaptopCategory,
  type ProductFormValues,
} from "../validation/product";

export async function getProductForEdit(productId: number) {
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error("A valid product ID is required.");
  }

  return (
    db
      .select({
        id: products.id,
        name: products.name,
        brandId: products.brandId,
        categoryId: products.categoryId,
        trackingType: products.trackingType,
        quantity: products.quantity,
        costPrice: products.costPrice,
        sellingPrice: products.sellingPrice,
        ramCapacityGb: laptopSpecs.ramCapacityGb,
        ramType: laptopSpecs.ramType,
        storageCapacityGb: laptopSpecs.storageCapacityGb,
        storageType: laptopSpecs.storageType,
        screenSize: laptopSpecs.screenSize,
        cpu: laptopSpecs.cpu,
        gpu: laptopSpecs.gpu,
        serialNumber: laptopSpecs.serialNumber,
      })
      .from(products)
      .innerJoin(brands, eq(products.brandId, brands.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(laptopSpecs, eq(products.id, laptopSpecs.productId))
      .where(eq(products.id, productId))
      .get() ?? null
  );
}

export async function updateProduct(
  productId: number,
  input: ProductFormValues,
) {
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error("A valid product ID is required.");
  }

  const existing = db
    .select({
      status: products.status,
    })
    .from(products)
    .where(eq(products.id, productId))
    .get();
  if (!existing) {
    throw new Error("The product could not be found.");
  }

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
  const parsed = editProductSchema(isLaptop).safeParse(input);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid product details.",
    );
  }

  const values = parsed.data;
  if (values.trackingType === "SERIALIZED" && values.quantity > 1) {
    throw new Error("Serialized product quantity must be 0 or 1.");
  }

  if (isLaptop) {
    if (
      values.ramCapacityGb === undefined ||
      values.ramType === undefined ||
      values.storageCapacityGb === undefined ||
      values.storageType === undefined ||
      values.screenSize === undefined ||
      !values.cpu?.trim() ||
      !values.gpu?.trim() ||
      !values.serialNumber?.trim()
    ) {
      throw new Error("Complete all laptop specifications before saving.");
    }
  }

  const laptopSpecification =
    isLaptop &&
    values.ramCapacityGb !== undefined &&
    values.ramType !== undefined &&
    values.storageCapacityGb !== undefined &&
    values.storageType !== undefined &&
    values.screenSize !== undefined &&
    values.cpu?.trim() &&
    values.gpu?.trim() &&
    values.serialNumber?.trim()
      ? {
          ramCapacityGb: values.ramCapacityGb,
          ramType: values.ramType,
          storageCapacityGb: values.storageCapacityGb,
          storageType: values.storageType,
          screenSize: values.screenSize,
          cpu: values.cpu.trim(),
          gpu: values.gpu.trim(),
          serialNumber: values.serialNumber.trim(),
        }
      : null;

  return db.transaction((transaction) => {
    transaction
      .update(products)
      .set({
        name: values.name,
        brandId: values.brandId,
        categoryId: values.categoryId,
        trackingType: values.trackingType,
        quantity: values.quantity,
        costPrice: values.costPrice,
        sellingPrice: values.sellingPrice,
        status:
          values.quantity === 0
            ? "SOLD"
            : existing.status === "HELD"
              ? "HELD"
              : "AVAILABLE",
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .run();

    transaction.delete(laptopSpecs).where(eq(laptopSpecs.productId, productId)).run();

    if (laptopSpecification) {
      transaction
        .insert(laptopSpecs)
        .values({
          productId,
          ...laptopSpecification,
        })
        .run();
    }

    return productId;
  });
}
