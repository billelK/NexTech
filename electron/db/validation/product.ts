import { z } from "zod";

const productFieldsSchema = z.object({
  name: z.string().trim().min(1, "Product name is required.").max(
    40,
    "Product name must be 40 characters or fewer.",
  ),
  brandId: z.number().int().positive("Select a brand."),
  categoryId: z.number().int().positive("Select a category."),
  trackingType: z.enum(["QUANTITY", "SERIALIZED"]),
  quantity: z.number().int().min(1, "Quantity cannot be less than 1."),
  costPrice: z.number().min(1,"Enter a valid cost price."),
  sellingPrice: z.number().min(1,"Enter a valid cost price."),
  ramCapacityGb: z
    .union([z.literal(8), z.literal(16), z.literal(32), z.literal(64)])
    .optional(),
  ramType: z.enum(["DDR4", "DDR5"]).optional(),
  storageCapacityGb: z
    .union([
      z.literal(128),
      z.literal(256),
      z.literal(512),
      z.literal(1024),
    ])
    .optional(),
  storageType: z.enum(["NVME", "SSD", "HDD"]).optional(),
  screenSize: z
    .number({ error: "Enter a valid screen size." })
    .min(1, "Enter a valid screen size.")
    .optional(),
  cpu: z.string().trim().optional(),
  gpu: z.string().trim().optional(),
  serialNumber: z.string().trim().optional(),
});

export type ProductFormValues = z.infer<typeof productFieldsSchema>;

export function isLaptopCategory(categoryName: string): boolean {
  const name = categoryName.trim().toLowerCase();
  return name === "laptop" || name === "laptops";
}

export function createProductSchema(isLaptop: boolean) {
  return productFieldsSchema.superRefine((values, context) => {
    if (!isLaptop) return;

    const requiredLaptopFields = [
      ["ramCapacityGb", values.ramCapacityGb, "Select RAM capacity."],
      ["ramType", values.ramType, "Select RAM type."],
      [
        "storageCapacityGb",
        values.storageCapacityGb,
        "Select storage capacity.",
      ],
      ["storageType", values.storageType, "Select storage type."],
      ["screenSize", values.screenSize, "Enter a valid screen size."],
      ["cpu", values.cpu?.trim(), "Enter a CPU."],
      ["gpu", values.gpu?.trim(), "Enter a GPU."],
      ["serialNumber", values.serialNumber?.trim(), "Enter the laptop's serial number."],
    ] as const;

    for (const [field, value, message] of requiredLaptopFields) {
      if (value === undefined || value === "") {
        context.addIssue({
          code: "custom",
          path: [field],
          message,
        });
      }
    }
  });
}
