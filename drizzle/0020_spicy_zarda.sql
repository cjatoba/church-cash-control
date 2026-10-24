CREATE TABLE "app_settings" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"name" varchar(40) NOT NULL,
	"short_name" varchar(12) NOT NULL,
	"icon" varchar(32) NOT NULL,
	"color" varchar(32) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
