import { db } from "./index";
import { brands, categories } from "./schema";

const defaultCategories = [
  "Storage",
  "Gaming Accessories",
  "Chargers & Cables",
  "Headphones",
  "Phone Accessories",
  "Laptops",
  "Computer Components",
  "Figurines",
  "Phones",
] as const;

const defaultBrands = [
  "Lenovo",
  "HP",
  "ASUS",
  "Dell",
  "Apple",
  "NVIDIA",
  "AMD",
  "Anker",
  "Razer",
] as const;

export function seedDefaultCatalogs(): void {
  db.transaction((transaction) => {
    for (const name of defaultCategories) {
      transaction
        .insert(categories)
        .values({ name })
        .onConflictDoNothing({ target: categories.name })
        .run();
    }

    for (const name of defaultBrands) {
      transaction
        .insert(brands)
        .values({ name })
        .onConflictDoNothing({ target: brands.name })
        .run();
    }
  });
}
