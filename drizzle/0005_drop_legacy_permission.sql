ALTER TABLE "menu" DROP CONSTRAINT "menu_permission_id_permission_id_fk";--> statement-breakpoint
DROP INDEX "menu_permission_id_idx";--> statement-breakpoint
ALTER TABLE "menu" DROP COLUMN "permission_id";--> statement-breakpoint
DROP TABLE "role_permission";--> statement-breakpoint
DROP TABLE "permission";
