"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ImagePlus, History, LogOut, Sparkles } from "lucide-react";

const navItems = [
  {
    label: "Generate",
    href: "/",
    icon: ImagePlus,
    description: "Create new images",
  },
  {
    label: "History",
    href: "/history",
    icon: History,
    description: "View past jobs",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "/generate";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-[var(--sqm-bg-secondary)] border-r border-[var(--sqm-border)] flex flex-col z-50">
      {/* Logo Section */}
      <div className="p-6 border-b border-[var(--sqm-border)]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--sqm-green)] to-[var(--sqm-green-light)] flex items-center justify-center shadow-lg shadow-[var(--sqm-glow)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold text-[var(--sqm-text-primary)] leading-tight tracking-wide">
              SQM Images
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--sqm-text-muted)]">
              AI Generator
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-300 group
                ${
                  active
                    ? "bg-[var(--sqm-bg-elevated)] text-[var(--sqm-text-primary)]"
                    : "text-[var(--sqm-text-secondary)] hover:bg-[var(--sqm-bg-elevated)] hover:text-[var(--sqm-text-primary)]"
                }
              `}
            >
              {/* Active indicator - left green bar */}
              <div
                className={`
                  absolute left-0 top-2 bottom-2 w-[3px] rounded-full
                  bg-[var(--sqm-green)] transition-opacity duration-300
                  ${active ? "opacity-100" : "opacity-0 group-hover:opacity-50"}
                `}
              />

              <Icon
                className={`w-5 h-5 transition-colors duration-300 ${
                  active
                    ? "text-[var(--sqm-green)]"
                    : "text-[var(--sqm-text-muted)] group-hover:text-[var(--sqm-green)]"
                }`}
              />
              <div>
                <span className="font-medium text-sm">{item.label}</span>
                <p className="text-[11px] text-[var(--sqm-text-muted)] leading-tight">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--sqm-border)]">
        <button
          onClick={handleLogout}
          className="
            w-full flex items-center gap-3 px-4 py-3 rounded-lg
            text-[var(--sqm-text-secondary)] hover:text-[var(--sqm-text-primary)]
            hover:bg-[var(--sqm-bg-elevated)] transition-all duration-300 group
          "
        >
          <LogOut className="w-5 h-5 text-[var(--sqm-text-muted)] group-hover:text-red-400 transition-colors duration-300" />
          <span className="font-medium text-sm">Sign Out</span>
        </button>

        {/* SQM Architects branding */}
        <div className="mt-4 pt-4 border-t border-[var(--sqm-border)]">
          <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--sqm-text-muted)] text-center">
            SQM Architects
          </p>
          <p className="text-[9px] text-[var(--sqm-text-muted)] text-center mt-1 opacity-60">
            Internal Tool
          </p>
        </div>
      </div>
    </aside>
  );
}
