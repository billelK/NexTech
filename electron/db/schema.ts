import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Product categories
 * Examples: Laptops, RAM, SSD, Headsets, Mouse Pads...
 */
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  name: text("name").notNull().unique(),

  createdAt: integer("created_at", {
    mode: "timestamp_ms",
  }).notNull().$defaultFn(() => new Date()),
});

/**
 * Product brands
 * Examples: Anker, Razer, Kingston, Lenovo...
 */
export const brands = sqliteTable("brands", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  name: text("name").notNull().unique(),

  createdAt: integer("created_at", {
    mode: "timestamp_ms",
  }).notNull().$defaultFn(() => new Date()),
});

/**
 * All sellable inventory products.
 *
 * Quantity products:
 *   quantity is the source of stock.
 *
 * Serialized products:
 *   each physical product has its own row and barcode.
 */
export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    name: text("name").notNull(),

    barcode: text("barcode"),

    brandId: integer("brand_id")
      .notNull()
      .references(() => brands.id),

    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),

    trackingType: text("tracking_type", {
      enum: ["QUANTITY", "SERIALIZED"],
    }).notNull(),

    /**
     * Used for quantity-tracked products.
     * Serialized products don't use this as their stock source.
     */
    quantity: integer("quantity").notNull().default(0),

    /**
     * Latest/current purchase cost.
     * Historical purchase prices will live in purchase records later.
     */
    costPrice: integer("cost_price").notNull(),

    /**
     * Current/default selling price.
     */
    sellingPrice: integer("selling_price").notNull(),

    /**
     * Mainly meaningful for serialized products.
     * Quantity-product availability will eventually be derived
     * from quantity + reservations.
     */
    status: text("status", {
      enum: ["AVAILABLE", "HELD", "SOLD"],
    }),

    createdAt: integer("created_at", {
      mode: "timestamp_ms",
    }).notNull().$defaultFn(() => new Date()),

    updatedAt: integer("updated_at", {
      mode: "timestamp_ms",
    }).notNull().$defaultFn(() => new Date()),
  },
  (table) => ({
    barcodeIdx: uniqueIndex("products_barcode_idx").on(table.barcode),
  }),
);

/**
 * Additional information for laptop products.
 *
 * One product can have one laptop_specs record.
 */
export const laptopSpecs = sqliteTable(
  "laptop_specs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    productId: integer("product_id")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
      }),

    ramCapacityGb: integer("ram_capacity_gb").notNull(),

    ramType: text("ram_type", {
      enum: ["DDR3", "DDR4", "DDR5"],
    }).notNull(),

    storageCapacityGb: integer("storage_capacity_gb").notNull(),

    storageType: text("storage_type", {
      enum: ["NVME", "SATA", "HDD"],
    }).notNull(),

    screenSize: integer("screen_size"),

    cpu: text("cpu").notNull(),

    gpu: text("gpu"),

    serialNumber: text("serial_number").notNull().unique(),
  },
  (table) => ({
    productIdIdx: uniqueIndex("laptop_specs_product_id_idx").on(
      table.productId,
    ),
  }),
);

/**
 * Records every change made to stock.
 */
export const stockMovements = sqliteTable("stock_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  productId: integer("product_id")
    .notNull()
    .references(() => products.id),

  type: text("type", {
    enum: [
      "PURCHASE",
      "SALE",
      "RETURN",
      "ADJUSTMENT",
    ],
  }).notNull(),

  quantity: integer("quantity").notNull(),

  referenceId: integer("reference_id"),

  createdAt: integer("created_at", {
    mode: "timestamp_ms",
  }).notNull().$defaultFn(() => new Date()),
});