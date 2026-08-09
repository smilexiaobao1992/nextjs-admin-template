ALTER TABLE "user" DROP CONSTRAINT "user_role_role_key_fk";
--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_keys_format_check" CHECK ("user"."role" ~ '^[a-z][a-z0-9_-]{1,63}(,[a-z][a-z0-9_-]{1,63})*$');
