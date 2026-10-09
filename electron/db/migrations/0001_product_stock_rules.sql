UPDATE `products`
SET `quantity` = CASE
  WHEN `status` = 'SOLD' THEN 0
  WHEN `quantity` > 0 OR `status` IN ('AVAILABLE', 'HELD') THEN 1
  ELSE 0
END
WHERE `tracking_type` = 'SERIALIZED';--> statement-breakpoint
UPDATE `laptop_specs`
SET `storage_type` = 'SSD'
WHERE `storage_type` = 'SATA';--> statement-breakpoint
CREATE TRIGGER `products_serialized_quantity_insert`
BEFORE INSERT ON `products`
FOR EACH ROW
WHEN NEW.`tracking_type` = 'SERIALIZED' AND NEW.`quantity` != 1
BEGIN
  SELECT RAISE(ABORT, 'serialized products must be created with quantity 1');
END;--> statement-breakpoint
CREATE TRIGGER `products_serialized_quantity_update`
BEFORE UPDATE OF `tracking_type`, `quantity` ON `products`
FOR EACH ROW
WHEN NEW.`tracking_type` = 'SERIALIZED' AND NEW.`quantity` NOT IN (0, 1)
BEGIN
  SELECT RAISE(ABORT, 'serialized product quantity must be 0 or 1');
END;