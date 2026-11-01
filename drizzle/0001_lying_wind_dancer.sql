CREATE TABLE `admin_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL,
	`at` text NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `banners` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`image` text NOT NULL,
	`link` text NOT NULL,
	`active` integer NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catalog_metadata` (
	`id` text PRIMARY KEY NOT NULL,
	`version` integer NOT NULL,
	`updated_at` text,
	`write_token` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `motorcycles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`category` text NOT NULL,
	`transmission` text NOT NULL,
	`consumption` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	`daily` real NOT NULL,
	`weekly` real NOT NULL,
	`available` integer NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`whatsapp_number` text NOT NULL,
	`address` text NOT NULL,
	`hours` text NOT NULL,
	`map_query` text NOT NULL,
	`map_label` text NOT NULL,
	`instagram` text NOT NULL,
	`facebook` text NOT NULL
);
