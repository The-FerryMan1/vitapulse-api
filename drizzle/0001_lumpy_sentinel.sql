ALTER TABLE "users_table" DROP CONSTRAINT "users_table_deviceId_unique";--> statement-breakpoint
ALTER TABLE "users_table" ALTER COLUMN "created_At" SET DEFAULT '2025-09-17 06:28:00.882';--> statement-breakpoint
ALTER TABLE "users_table" DROP COLUMN "deviceId";