"use client";

import { useState } from "react";
import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import type { NavItem } from "./nav-items";

export function Sidebar({ items }: { items: NavItem[] }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex md:flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center gap-2 border-b",
          collapsed ? "justify-center px-2" : "px-4"
        )}
      >
        {!collapsed && (
          <>
            <Zap className="size-5 shrink-0 text-primary" />
            <Link href="/dashboard" className="flex-1 truncate font-semibold">
              EVN HR
            </Link>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-7 shrink-0", !collapsed && "ml-auto")}
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          <span className="sr-only">{collapsed ? "Mở rộng menu" : "Thu gọn menu"}</span>
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav items={items} collapsed={collapsed} />
      </div>
    </aside>
  );
}
