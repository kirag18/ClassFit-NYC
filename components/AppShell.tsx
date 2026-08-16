"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BookIcon, LogoMark, MapIcon } from "./icons";

const NAV = [
  {
    href: "/",
    label: "Map and search",
    match: (p: string) => p === "/" || p.startsWith("/school"),
    Icon: MapIcon,
  },
  {
    href: "/admin-guide",
    label: "Administrator guide",
    match: (p: string) => p.startsWith("/admin-guide"),
    Icon: BookIcon,
  },
];

const PAGE_LABELS: [(p: string) => boolean, string][] = [
  [(p) => p === "/", "Overview"],
  [(p) => p.startsWith("/school/"), "School detail"],
  [(p) => p.startsWith("/admin-guide"), "Administrator guide"],
];

function currentLabel(pathname: string) {
  return PAGE_LABELS.find(([match]) => match(pathname))?.[1] ?? "Overview";
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:sticky lg:top-0 lg:h-screen border-r border-line px-3 py-5">
        <Link href="/" className="flex items-center gap-2.5 px-2 mb-7">
          <LogoMark className="w-6 h-6 text-accent shrink-0" />
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-ink">ClassFit NYC</span>
            <span className="block text-[11px] text-ink-soft">Class size mandate explorer</span>
          </span>
        </Link>

        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ href, label, match, Icon }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-accent-soft text-accent font-semibold"
                    : "text-ink-soft font-medium hover:bg-paper-sunk hover:text-ink"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-[1000] border-b border-line bg-paper">
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
            <div className="min-w-0 flex items-center gap-2">
              <LogoMark className="lg:hidden w-5 h-5 text-accent shrink-0" />
              <div className="text-xs text-ink-soft truncate">
                <span className="lg:hidden font-semibold text-ink">ClassFit NYC</span>
                <span className="hidden lg:inline">ClassFit NYC</span>{" "}
                <span className="text-line-strong">/</span>{" "}
                <span className="text-ink font-medium">{currentLabel(pathname)}</span>
              </div>
            </div>
            <nav className="lg:hidden flex items-center gap-4 text-xs font-medium text-ink-soft shrink-0">
              <Link href="/" className="hover:text-ink">
                Map
              </Link>
              <Link href="/admin-guide" className="hover:text-ink">
                Guide
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col min-w-0">{children}</main>
      </div>
    </div>
  );
}
