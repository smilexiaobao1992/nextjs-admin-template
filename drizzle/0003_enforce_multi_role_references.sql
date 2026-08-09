CREATE OR REPLACE FUNCTION "enforce_user_role_references"() RETURNS trigger AS $$
DECLARE
  requested_role_key text;
BEGIN
  IF NEW."role" !~ '^[a-z][a-z0-9_-]{1,63}(,[a-z][a-z0-9_-]{1,63})*$' THEN
    RETURN NEW;
  END IF;

  FOREACH requested_role_key IN ARRAY string_to_array(NEW."role", ',') LOOP
    PERFORM 1
    FROM "role"
    WHERE "key" = requested_role_key
    FOR KEY SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'user role references unknown role key: %', requested_role_key
        USING ERRCODE = '23503';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER "user_role_references_insert_trigger"
BEFORE INSERT ON "user"
FOR EACH ROW EXECUTE FUNCTION "enforce_user_role_references"();
--> statement-breakpoint
CREATE TRIGGER "user_role_references_update_trigger"
BEFORE UPDATE OF "role" ON "user"
FOR EACH ROW EXECUTE FUNCTION "enforce_user_role_references"();
--> statement-breakpoint
CREATE FUNCTION "prevent_referenced_role_change"() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW."key" IS NOT DISTINCT FROM OLD."key" THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "user"
    WHERE OLD."key" = ANY(string_to_array("role", ','))
  ) THEN
    RAISE EXCEPTION 'role key is assigned to one or more users: %', OLD."key"
      USING ERRCODE = '23503';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER "role_reference_delete_trigger"
BEFORE DELETE ON "role"
FOR EACH ROW EXECUTE FUNCTION "prevent_referenced_role_change"();
--> statement-breakpoint
CREATE TRIGGER "role_reference_key_update_trigger"
BEFORE UPDATE OF "key" ON "role"
FOR EACH ROW EXECUTE FUNCTION "prevent_referenced_role_change"();
