// components/dashboard/sidebar-desktop.tsx
"use client";

import { Command, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { DASHBOARD_NAV, DASHBOARD_SECONDARY } from "./nav";
import React, { useMemo } from "react";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { usePathname } from "next/navigation";

export function DashboardSidebarDesktop({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const widthClass = collapsed ? "w-[92px]" : "w-[280px]";

  return (
    <aside className={`mr-4 hidden shrink-0 lg:block ${widthClass} transition-all duration-300`}>
      {/* ✅ KEY FIXES:
         1. sticky top-6: This pins the sidebar 1.5rem (24px) from the top while the body scrolls.
         2. h-[calc(100vh-3rem)]: Matches viewport height minus the Shell's top (1.5rem) and bottom (1.5rem) padding.
         3. overflow-hidden: Ensures scrollbars stay inside the rounded corners.
         4. flex flex-col: Setup for the inner layout to stretch.
      */}
      <div className="glass-panel sticky top-6 h-[calc(100vh-3rem)] rounded-[2rem] p-3 overflow-hidden flex flex-col">
        <SidebarInner collapsed={collapsed} onToggle={onToggle} />
      </div>
    </aside>
  );
}

function SidebarInner({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  const brand = useMemo(() => {
    return (
      <div className="mb-2 shrink-0"> 
        <div
          className={[
            "relative flex items-center gap-3 px-1 py-1",
            collapsed ? "justify-center" : "justify-between",
          ].join(" ")}
        >
          <Link
            href="/dashboard"
            className={[
              "group flex items-center gap-3",
              collapsed ? "justify-center" : "",
            ].join(" ")}
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background transition-transform group-hover:scale-110">
              <Command className="h-6 w-6" />
              <div className="absolute inset-0 rounded-xl bg-brand-primary/20 blur-lg opacity-0 transition-opacity group-hover:opacity-100" />
            </div>

            {!collapsed && (
              <div className="leading-tight">
                <div className="text-base font-black tracking-tighter">Hive</div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Control Hub
                </div>
              </div>
            )}
          </Link>

          {!collapsed && (
            <Button
              variant="ghost"
              onClick={onToggle}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="h-9 w-9 rounded-xl p-0 hover:bg-foreground/5"
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          )}
        </div>

        {collapsed && (
          <div className="mt-2 flex justify-center">
            <Button
              variant="ghost"
              onClick={onToggle}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className={[
                "h-10 w-10 rounded-2xl p-0",
                "border border-border/40 bg-background/25",
                "backdrop-blur-xl supports-[backdrop-filter]:backdrop-blur-xl",
                "shadow-[0_10px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.55)]",
                "hover:bg-foreground/5",
              ].join(" ")}
            >
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    );
  }, [collapsed, onToggle]);

  return (
    // ✅ Use h-full so it fills the sticky parent container
    <div className="flex h-full flex-col">
      {brand}

      {/* ✅ SCROLLABLE NAV AREA */}
      {/* 1. overflow-y-auto: Only this middle section will scroll if the menu is long. */}
      {/* 2. min-h-0: Essential for flex children to scroll properly. */}
      {/* 3. no-scrollbar: Optional class if you want to hide the scrollbar UI (requires custom CSS). */}
      <nav className="mt-3 flex-1 space-y-1 overflow-y-auto min-h-0 py-2 no-scrollbar">
        {DASHBOARD_NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-colors",
                collapsed ? "justify-center px-0" : "",
                active
                  ? "bg-brand-primary/12 text-foreground"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
              ].join(" ")}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ✅ PINNED FOOTER (Stays at bottom of sidebar) */}
      <div className="mt-3 shrink-0 space-y-2 border-t border-border/40 pt-3">
        {DASHBOARD_SECONDARY.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground",
                collapsed ? "justify-center px-0" : "",
              ].join(" ")}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}

        <LogoutButton mode="sidebar" collapsed={collapsed} />

        <div
          className={[
            "flex items-center rounded-2xl border border-border/40 bg-background/30 px-3 py-2",
            collapsed ? "justify-center" : "justify-between",
          ].join(" ")}
        >
          {!collapsed && <div className="text-xs text-muted-foreground">Theme</div>}
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}