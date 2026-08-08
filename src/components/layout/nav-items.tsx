import type { ReactNode } from "react";
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
  // Đây là JSX đã render sẵn, không phải reference tới component — mảng
  // NavItem[] được tính ở Server Component ((app)/layout.tsx) rồi truyền
  // xuống Client Component (SidebarNav), mà function/class component
  // reference không serialize được qua ranh giới RSC (chỉ plain object và
  // React element mới được).
  icon: ReactNode;
  /** Nếu bỏ trống: mọi role đăng nhập đều thấy (vd Trang chủ). */
  feature?: Feature;
  /** Chỉ admin mới thấy, bất kể phân quyền theo feature. */
  adminOnly?: boolean;
};

const iconClassName = "size-4 shrink-0";

export const managementNavItems: NavItem[] = [
  { href: "/dashboard", label: "Trang chủ", icon: <LayoutDashboard className={iconClassName} /> },
  {
    href: "/personnel",
    label: "Nhân sự",
    icon: <Users className={iconClassName} />,
    feature: "personnel",
  },
  {
    href: "/attendance",
    label: "Chấm công",
    icon: <CalendarCheck className={iconClassName} />,
    feature: "attendance",
  },
  {
    href: "/shift-types",
    label: "Danh mục ca trực",
    icon: <Clock className={iconClassName} />,
    adminOnly: true,
  },
  {
    href: "/holidays",
    label: "Ngày Lễ / Tết",
    icon: <CalendarHeart className={iconClassName} />,
    adminOnly: true,
  },
  {
    href: "/payroll",
    label: "Bảng lương",
    icon: <Wallet className={iconClassName} />,
    feature: "payroll",
  },
  {
    href: "/payroll/settings",
    label: "Cấu hình lương",
    icon: <Settings2 className={iconClassName} />,
    feature: "payroll_settings",
  },
  {
    href: "/reports",
    label: "Báo cáo",
    icon: <FileBarChart className={iconClassName} />,
    feature: "reports",
  },
  {
    href: "/permissions",
    label: "Phân quyền",
    icon: <ShieldCheck className={iconClassName} />,
    adminOnly: true,
  },
  {
    href: "/users",
    label: "Người dùng",
    icon: <UserCog className={iconClassName} />,
    feature: "user_management",
    adminOnly: true,
  },
];

export const employeeNavItems: NavItem[] = [
  { href: "/dashboard", label: "Trang chủ", icon: <LayoutDashboard className={iconClassName} /> },
  {
    href: "/me/attendance",
    label: "Lịch công của tôi",
    icon: <CalendarDays className={iconClassName} />,
  },
  {
    href: "/me/payslips",
    label: "Phiếu lương của tôi",
    icon: <ReceiptText className={iconClassName} />,
  },
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
