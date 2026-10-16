"use client";

import { useEffect } from "react";
import { toast } from "sonner";

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
  const message = notice ? messages[notice] : undefined;
  const isError = notice ? !SUCCESS_NOTICES.has(notice) : false;

  useEffect(() => {
    if (!notice || !message) {
      return;
    }

    if (isError) {
      toast.error(message, { id: `notice:${notice}` });
    } else {
      toast.success(message, { id: `notice:${notice}` });
    }

    const url = new URL(window.location.href);
    if (url.searchParams.has("notice")) {
      url.searchParams.delete("notice");
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(window.history.state, "", nextUrl);
    }
  }, [isError, message, notice]);

  if (!notice || !message) {
    return null;
  }

  return (
    <p
      role={isError ? "alert" : "status"}
      className={
        isError
          ? "rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          : "rounded-lg bg-card px-4 py-3 text-sm shadow-soft"
      }
    >
      {message}
    </p>
  );
}
