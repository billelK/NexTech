import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../index";
import { brands, categories, products } from "../schema";

export type CatalogKind = "category" | "brand";
export type CatalogEntry = { id: number; name: string };

type CatalogTable = typeof categories | typeof brands;

function getTable(kind: CatalogKind): CatalogTable {
  return kind === "category" ? categories : brands;
}

function validateName(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("The name must be text.");
  }

  const name = value.trim();
  if (!name) {
    throw new Error("A name is required.");
  }
  if (name.length > 60) {
    throw new Error("The name must be 60 characters or fewer.");
  }

  return name;
}

function validateId(id: number): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("A valid record ID is required.");
  }
}

function assertNameAvailable(
  table: CatalogTable,
  name: string,
  excludingId?: number,
): void {
  const nameCondition = sql`lower(${table.name}) = ${name.toLowerCase()}`;
  const condition = excludingId
    ? and(nameCondition, sql`${table.id} != ${excludingId}`)
    : nameCondition;
  const duplicate = db
    .select({ id: table.id })
    .from(table)
    .where(condition)
    .get();

  if (duplicate) {
    throw new Error("A record with this name already exists.");
  }
}

export function getCatalogEntries(kind: CatalogKind): CatalogEntry[] {
  const table = getTable(kind);
  return db
    .select({ id: table.id, name: table.name })
    .from(table)
    .orderBy(asc(table.name))
    .all();
}

export function createCatalogEntry(
  kind: CatalogKind,
  value: string,
): CatalogEntry {
  const table = getTable(kind);
  const name = validateName(value);
  assertNameAvailable(table, name);

  const created = db
    .insert(table)
    .values({ name })
    .returning({ id: table.id, name: table.name })
    .get();
  if (!created) {
    throw new Error("The record could not be created.");
  }
  return created;
}

export function updateCatalogEntry(
  kind: CatalogKind,
  id: number,
  value: string,
): CatalogEntry {
  validateId(id);
  const table = getTable(kind);
  const name = validateName(value);
  const existing = db
    .select({ id: table.id })
    .from(table)
    .where(eq(table.id, id))
    .get();
  if (!existing) {
    throw new Error("The record could not be found.");
  }
  assertNameAvailable(table, name, id);

  const updated = db
    .update(table)
    .set({ name })
    .where(eq(table.id, id))
    .returning({ id: table.id, name: table.name })
    .get();
  if (!updated) {
    throw new Error("The record could not be updated.");
  }
  return updated;
}

export function deleteCatalogEntry(kind: CatalogKind, id: number): number {
  validateId(id);
  const table = getTable(kind);

  return db.transaction((transaction) => {
    const existing = transaction
      .select({ id: table.id })
      .from(table)
      .where(eq(table.id, id))
      .get();
    if (!existing) {
      throw new Error("The record could not be found.");
    }

    const linkedProduct =
      kind === "category"
        ? transaction
            .select({ id: products.id })
            .from(products)
            .where(eq(products.categoryId, id))
            .get()
        : transaction
            .select({ id: products.id })
            .from(products)
            .where(eq(products.brandId, id))
            .get();
    if (linkedProduct) {
      throw new Error(
        `This ${kind} is assigned to one or more products and cannot be deleted.`,
      );
    }

    const deleted = transaction
      .delete(table)
      .where(eq(table.id, id))
      .returning({ id: table.id })
      .get();
    if (!deleted) {
      throw new Error("The record could not be deleted.");
    }
    return deleted.id;
  });
}

export const getCategories = () => getCatalogEntries("category");
export const getBrands = () => getCatalogEntries("brand");
export const createCategory = (name: string) =>
  createCatalogEntry("category", name);
export const createBrand = (name: string) => createCatalogEntry("brand", name);
export const updateCategory = (id: number, name: string) =>
  updateCatalogEntry("category", id, name);
export const updateBrand = (id: number, name: string) =>
  updateCatalogEntry("brand", id, name);
export const deleteCategory = (id: number) =>
  deleteCatalogEntry("category", id);
export const deleteBrand = (id: number) => deleteCatalogEntry("brand", id);
