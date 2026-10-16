import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  Database,
  FileText,
  Folder,
  Globe,
  KeyRound,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Package,
  PanelLeft,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Users,
  Wrench,
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
  Folder,
  FileText,
  Package,
  ShoppingCart,
  Tags,
  BarChart3,
  ClipboardList,
  Database,
  CreditCard,
  Bell,
  MessageSquare,
  Building2,
  Layers,
  Wrench,
  Globe,
};

const LEGACY_ALIASES: Record<string, LucideIcon> = {
  Key: KeyRound,
  Menu: PanelLeft,
  Audit: ScrollText,
};

export function resolveMenuIcon(name: string | null | undefined): LucideIcon {
  if (!name) {
    return LayoutDashboard;
  }
  return ICONS[name] ?? LEGACY_ALIASES[name] ?? LayoutDashboard;
}

export const MENU_ICON_OPTIONS = Object.keys(ICONS);
