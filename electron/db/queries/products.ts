
import { eq } from "drizzle-orm";
import { db } from "../index";
import { brands, categories, products } from "../schema";

export async function getProducts() {
  return db
    .select({
      id: products.id,
      name: products.name,
      barcode: products.barcode,
      brandId: products.brandId,
      brand: brands.name,
      categoryId: products.categoryId,
      category: categories.name,
      trackingType: products.trackingType,
      quantity: products.quantity,
      costPrice: products.costPrice,
      sellingPrice: products.sellingPrice,
      status: products.status,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(products.id);
}