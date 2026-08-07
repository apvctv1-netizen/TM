import Link from "next/link";
import { Zap } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import type { NavItem } from "./nav-items";

export function Sidebar({ items }: { items: NavItem[] }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Zap className="size-5 text-primary" />
        <Link href="/dashboard" className="font-semibold">
          EVN HR
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav items={items} />
      </div>
    </aside>
  );
}
