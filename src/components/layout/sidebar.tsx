"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Timer, List, FolderKanban, BarChart3, Settings, Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/", label: "Dashboard", icon: Timer },
  { href: "/entries", label: "Entries", icon: List },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

function NavContent({ user, onNavigate }: { user: SidebarUser | null; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* TR-808 nameplate */}
      <div className="mb-8 px-3 pt-2">
        <h1 className="font-pixel text-sm leading-relaxed tracking-tight text-sidebar-primary">
          TimeTrack
        </h1>
        <div className="mt-1.5 chrome-divider" />
        <p className="mt-1.5 text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/50">
          Rhythm Composer
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-150",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-[0_0_8px_rgba(255,140,66,0.3)]"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-auto px-3 pb-2">
        <div className="chrome-divider" />
        {user && (
          <div className="mt-3 flex items-center gap-2">
            {user.image ? (
              <img src={user.image} alt="" className="h-7 w-7 rounded-full" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-primary/20 text-xs font-semibold text-sidebar-primary">
                {(user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {user.name ?? "User"}
              </p>
              <p className="truncate text-[10px] text-sidebar-foreground/50">
                {user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Sign out"
              className="shrink-0 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between">
          <p className="font-pixel text-[6px] text-muted-foreground/50">v1.0</p>
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}

export function Sidebar({ user }: { user: SidebarUser | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="font-pixel text-xs tracking-tight text-sidebar-primary">TimeTrack</h1>
        <ThemeToggle className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent" />
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-64 flex flex-col border-r border-sidebar-border bg-sidebar p-4 animate-slide-in-left">
            <div className="mb-2 flex justify-end">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavContent user={user} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar p-4">
        <NavContent user={user} />
      </aside>
    </>
  );
}
