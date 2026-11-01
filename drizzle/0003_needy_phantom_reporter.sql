CREATE TABLE `admin_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`revision` text NOT NULL
);
