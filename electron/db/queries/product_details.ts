import { eq } from "drizzle-orm";
import { db } from "../index";
import { brands, categories, laptopSpecs, products } from "../schema";

export async function getProductDetails(productId: number) {
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error("A valid product ID is required.");
  }

  const product = db
    .select({
      id: products.id,
      name: products.name,
      barcode: products.barcode,
      brand: brands.name,
      category: categories.name,
      quantity: products.quantity,
      costPrice: products.costPrice,
      sellingPrice: products.sellingPrice,
      status: products.status,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      cpu: laptopSpecs.cpu,
      gpu: laptopSpecs.gpu,
      ramCapacityGb: laptopSpecs.ramCapacityGb,
      ramType: laptopSpecs.ramType,
      storageCapacityGb: laptopSpecs.storageCapacityGb,
      storageType: laptopSpecs.storageType,
      screenSize: laptopSpecs.screenSize,
      serialNumber: laptopSpecs.serialNumber,
    })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(laptopSpecs, eq(products.id, laptopSpecs.productId))
    .where(eq(products.id, productId))
    .get();

  return product ?? null;
}
