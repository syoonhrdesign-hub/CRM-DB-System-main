"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "대시보드" },
  { href: "/agenda", label: "컨택 아젠다" },
  { href: "/organizations", label: "고객사" },
  { href: "/contacts", label: "담당자" },
  { href: "/deals", label: "영업 파이프라인" },
  { href: "/trainings", label: "교육 진행" },
  { href: "/courses", label: "교육 과정" },
  { href: "/activities", label: "활동 기록" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-sm text-white">
            E
          </span>
          <span className="whitespace-nowrap">교육사업 CRM</span>
        </Link>

        <nav className="ml-2 hidden flex-wrap gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                isActive(pathname, l.href)
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="메뉴 열기"
          className="btn btn-secondary ml-auto md:hidden"
        >
          메뉴
        </button>
      </div>

      {open && (
        <nav className="grid gap-1 border-t border-line px-4 py-2 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                isActive(pathname, l.href)
                  ? "bg-accent-soft text-accent"
                  : "text-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
