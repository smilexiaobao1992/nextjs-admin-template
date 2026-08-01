import {
  KeyRound,
  LayoutDashboard,
  PanelLeft,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Shield,
  ShieldCheck,
  KeyRound,
  PanelLeft,
  Settings,
  ScrollText,
  Key: KeyRound,
  Menu: PanelLeft,
  Audit: ScrollText,
};

export function resolveMenuIcon(name: string | null | undefined): LucideIcon {
  if (!name) {
    return LayoutDashboard;
  }
  return ICONS[name] ?? LayoutDashboard;
}

export const MENU_ICON_OPTIONS = Object.keys(ICONS);
