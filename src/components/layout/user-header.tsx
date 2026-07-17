import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "./sign-out-button";

type HeaderUser = {
  name: string;
  email: string;
  role: string;
  roleLabel?: string;
};

export default function UserHeader({
  user,
  onOpenNavigation,
}: {
  user: HeaderUser;
  onOpenNavigation: () => void;
}) {
  const initials = (user.name || user.email).slice(0, 2).toUpperCase();
  const roleLabel = user.roleLabel || user.role;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-card/95 px-4 shadow-[0_1px_0_rgba(62,47,35,0.04),0_8px_24px_rgba(62,47,35,0.04)] sm:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="打开导航"
        onClick={onOpenNavigation}
      >
        <Menu aria-hidden="true" />
      </Button>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="max-w-56 truncate text-sm font-medium">{user.name || user.email}</p>
          <p className="max-w-56 truncate text-xs text-muted-foreground">{roleLabel}</p>
        </div>
        <span
          aria-hidden="true"
          className="inline-flex size-9 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary"
        >
          {initials}
        </span>
        <SignOutButton />
      </div>
    </header>
  );
}
