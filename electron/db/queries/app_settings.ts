import { eq } from "drizzle-orm";
import { db } from "../index";
import { appSettings } from "../schema";

const STORE_NAME_KEY = "store_name";
const MAX_STORE_NAME_LENGTH = 60;

export function getStoreName(): string {
  const setting = db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, STORE_NAME_KEY))
    .get();

  return setting?.value ?? "";
}

export function setStoreName(value: string): string {
  if (typeof value !== "string") {
    throw new Error("The store name must be text.");
  }

  const storeName = value.trim();
  if (storeName.length > MAX_STORE_NAME_LENGTH) {
    throw new Error(
      `The store name must be ${MAX_STORE_NAME_LENGTH} characters or fewer.`,
    );
  }

  db.insert(appSettings)
    .values({ key: STORE_NAME_KEY, value: storeName })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: storeName },
    })
    .run();

  return storeName;
}
