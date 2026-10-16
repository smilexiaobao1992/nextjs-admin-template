const SUCCESS_NOTICES = new Set([
  "created",
  "updated",
  "deleted",
  "saved",
  "role_updated",
  "banned",
  "unbanned",
  "password_reset",
  "sessions_revoked",
  "password_changed",
  "session_revoked",
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

  const isError = !SUCCESS_NOTICES.has(notice);

  return (
    <p
      role={isError ? "alert" : "status"}
      className={
        isError
          ? "rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          : "rounded-lg bg-card px-4 py-3 text-sm shadow-soft"
      }
    >
      {messages[notice]}
    </p>
  );
}
