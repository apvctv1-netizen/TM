import { MobileSidebar } from "./mobile-sidebar";
import { UserMenu } from "./user-menu";
import type { NavItem } from "./nav-items";

export function Header({
  navItems,
  fullName,
  email,
  role,
}: {
  navItems: NavItem[];
  fullName: string;
  email: string;
  role: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background px-4">
      <MobileSidebar items={navItems} />
      <div className="flex-1" />
      <UserMenu fullName={fullName} email={email} role={role} />
    </header>
  );
}
