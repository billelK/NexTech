CREATE TEMP TABLE `__nextech_laptop_specs_backup` AS
SELECT * FROM `laptop_specs`;--> statement-breakpoint
CREATE TEMP TABLE `__nextech_stock_movements_backup` AS
SELECT * FROM `stock_movements`;--> statement-breakpoint
CREATE TEMP TABLE `__nextech_products_backup` AS
SELECT * FROM `products`;--> statement-breakpoint
CREATE TEMP TABLE `__nextech_autoincrement_backup` AS
SELECT `name`, `seq`
FROM `sqlite_sequence`
WHERE `name` IN ('products', 'laptop_specs', 'stock_movements');--> statement-breakpoint
DROP TABLE `laptop_specs`;--> statement-breakpoint
DROP TABLE `stock_movements`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`barcode` text,
	`brand_id` integer,
	`category_id` integer NOT NULL,
	`tracking_type` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`cost_price` integer NOT NULL,
	`selling_price` integer NOT NULL,
	`status` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
INSERT INTO `products` (
	`id`, `name`, `barcode`, `brand_id`, `category_id`, `tracking_type`,
	`quantity`, `cost_price`, `selling_price`, `status`, `created_at`, `updated_at`
)
SELECT
	`id`, `name`, `barcode`, `brand_id`, `category_id`, `tracking_type`,
	`quantity`, `cost_price`, `selling_price`, `status`, `created_at`, `updated_at`
FROM `__nextech_products_backup`;--> statement-breakpoint
CREATE UNIQUE INDEX `products_barcode_idx` ON `products` (`barcode`);--> statement-breakpoint
CREATE TABLE `laptop_specs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`ram_capacity_gb` integer NOT NULL,
	`ram_type` text NOT NULL,
	`storage_capacity_gb` integer NOT NULL,
	`storage_type` text NOT NULL,
	`screen_size` integer,
	`cpu` text NOT NULL,
	`gpu` text,
	`serial_number` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE UNIQUE INDEX `laptop_specs_serial_number_unique` ON `laptop_specs` (`serial_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `laptop_specs_product_id_idx` ON `laptop_specs` (`product_id`);--> statement-breakpoint
INSERT INTO `laptop_specs` (
	`id`, `product_id`, `ram_capacity_gb`, `ram_type`, `storage_capacity_gb`,
	`storage_type`, `screen_size`, `cpu`, `gpu`, `serial_number`
)
SELECT
	`id`, `product_id`, `ram_capacity_gb`, `ram_type`, `storage_capacity_gb`,
	`storage_type`, `screen_size`, `cpu`, `gpu`, `serial_number`
FROM `__nextech_laptop_specs_backup`;--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`reference_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
INSERT INTO `stock_movements` (
	`id`, `product_id`, `type`, `quantity`, `reference_id`, `created_at`
)
SELECT
	`id`, `product_id`, `type`, `quantity`, `reference_id`, `created_at`
FROM `__nextech_stock_movements_backup`;--> statement-breakpoint
INSERT INTO `sqlite_sequence` (`name`, `seq`)
SELECT `name`, `seq` FROM `__nextech_autoincrement_backup`
WHERE NOT EXISTS (
	SELECT 1 FROM `sqlite_sequence`
	WHERE `sqlite_sequence`.`name` = `__nextech_autoincrement_backup`.`name`
);--> statement-breakpoint
UPDATE `sqlite_sequence`
SET `seq` = MAX(`seq`, COALESCE((
	SELECT `seq`
	FROM `__nextech_autoincrement_backup`
	WHERE `__nextech_autoincrement_backup`.`name` = `sqlite_sequence`.`name`
	LIMIT 1
),
	0
))
WHERE `name` IN ('products', 'laptop_specs', 'stock_movements');--> statement-breakpoint
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
END;--> statement-breakpoint
DROP TABLE `__nextech_laptop_specs_backup`;--> statement-breakpoint
DROP TABLE `__nextech_stock_movements_backup`;--> statement-breakpoint
DROP TABLE `__nextech_products_backup`;--> statement-breakpoint
DROP TABLE `__nextech_autoincrement_backup`;
