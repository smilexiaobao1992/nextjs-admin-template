const ERROR_NOTICES = new Set([
  "failed",
  "invalid_input",
  "email_taken",
  "last_admin",
  "not_found",
  "invalid_role",
  "system_role_forbidden",
  "role_scope_forbidden",
  "self_forbidden",
  "wrong_password",
  "no_credential",
  "password_mismatch",
  "duplicate",
  "system_locked",
  "in_use",
  "last_default",
  "forbidden",
]);

export function StatusNotice({
  notice,
  messages,
}: {
  notice?: string;
  messages: Record<string, string>;
}) {
  if (!notice || !messages[notice]) {
    return null;
  }

  const isError = ERROR_NOTICES.has(notice);

  return (
    <p
      role={isError ? "alert" : "status"}
      className={
        isError
          ? "rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          : "rounded-lg bg-card px-4 py-3 text-sm shadow-[0_1px_2px_rgba(62,47,35,0.06),0_8px_22px_rgba(62,47,35,0.07)]"
      }
    >
      {messages[notice]}
    </p>
  );
}
