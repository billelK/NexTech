
import { eq, sql } from "drizzle-orm";
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
      status: sql<string>`CASE
        WHEN ${products.status} = 'HELD' THEN 'HELD'
        WHEN ${products.trackingType} = 'SERIALIZED' AND ${products.quantity} > 0 THEN 'IN_STOCK'
        WHEN ${products.quantity} <= 0 THEN 'OUT_OF_STOCK'
        WHEN ${products.trackingType} = 'QUANTITY' AND ${products.quantity} <= 3 THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
      END`,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(products.id);
}