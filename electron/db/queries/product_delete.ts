import { eq } from "drizzle-orm";
import { db } from "../index";
import { laptopSpecs, products, stockMovements } from "../schema";

export async function deleteProduct(productId: number) {
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error("A valid product ID is required.");
  }

  return db.transaction((transaction) => {
    transaction
      .delete(stockMovements)
      .where(eq(stockMovements.productId, productId))
      .run();
    transaction
      .delete(laptopSpecs)
      .where(eq(laptopSpecs.productId, productId))
      .run();

    const [deletedProduct] = transaction
      .delete(products)
      .where(eq(products.id, productId))
      .returning({ id: products.id })
      .all();

    if (!deletedProduct) {
      throw new Error("The product could not be found.");
    }

    return deletedProduct.id;
  });
}
