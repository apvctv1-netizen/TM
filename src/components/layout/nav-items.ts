import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Wallet,
  Settings2,
  Clock,
  CalendarHeart,
  ShieldCheck,
  UserCog,
  FileBarChart,
  CalendarDays,
  ReceiptText,
} from "lucide-react";

export type AppRole = "admin" | "hr" | "employee";
export type Feature =
  | "personnel"
  | "attendance"
  | "payroll"
  | "payroll_settings"
  | "reports"
  | "user_management";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Nếu bỏ trống: mọi role đăng nhập đều thấy (vd Trang chủ). */
  feature?: Feature;
  /** Chỉ admin mới thấy, bất kể phân quyền theo feature. */
  adminOnly?: boolean;
};

export const managementNavItems: NavItem[] = [
  { href: "/dashboard", label: "Trang chủ", icon: LayoutDashboard },
  { href: "/personnel", label: "Nhân sự", icon: Users, feature: "personnel" },
  {
    href: "/attendance",
    label: "Chấm công",
    icon: CalendarCheck,
    feature: "attendance",
  },
  {
    href: "/shift-types",
    label: "Danh mục ca trực",
    icon: Clock,
    adminOnly: true,
  },
  {
    href: "/holidays",
    label: "Ngày Lễ / Tết",
    icon: CalendarHeart,
    adminOnly: true,
  },
  { href: "/payroll", label: "Bảng lương", icon: Wallet, feature: "payroll" },
  {
    href: "/payroll/settings",
    label: "Cấu hình lương",
    icon: Settings2,
    feature: "payroll_settings",
  },
  {
    href: "/reports",
    label: "Báo cáo",
    icon: FileBarChart,
    feature: "reports",
  },
  {
    href: "/permissions",
    label: "Phân quyền",
    icon: ShieldCheck,
    adminOnly: true,
  },
  {
    href: "/users",
    label: "Người dùng",
    icon: UserCog,
    feature: "user_management",
    adminOnly: true,
  },
];

export const employeeNavItems: NavItem[] = [
  { href: "/dashboard", label: "Trang chủ", icon: LayoutDashboard },
  { href: "/me/attendance", label: "Lịch công của tôi", icon: CalendarDays },
  { href: "/me/payslips", label: "Phiếu lương của tôi", icon: ReceiptText },
];

/**
 * admin: thấy toàn bộ menu quản lý.
 * hr: thấy menu quản lý theo đúng feature đã được admin cấp quyền xem
 *     (adminOnly luôn ẩn với hr).
 * employee: chỉ thấy khu vực tự phục vụ.
 */
export function resolveNavItems(
  role: AppRole,
  viewableFeatures: ReadonlySet<Feature>
): NavItem[] {
  if (role === "employee") return employeeNavItems;
  if (role === "admin") return managementNavItems;

  return managementNavItems.filter((item) => {
    if (item.adminOnly) return false;
    if (!item.feature) return true;
    return viewableFeatures.has(item.feature);
  });
}
