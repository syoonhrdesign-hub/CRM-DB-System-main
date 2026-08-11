"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/auth-actions";

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

export function Nav({
  user,
}: {
  user: { name: string; email: string; role: string };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-sm font-bold text-white">
            E
          </span>
          <span className="whitespace-nowrap">교육사업 CRM</span>
        </Link>

        <nav className="ml-2 hidden flex-wrap gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                isActive(pathname, l.href)
                  ? "bg-accent-soft font-semibold text-accent"
                  : "font-medium text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* 계정 메뉴 */}
        <div className="relative ml-auto hidden md:block">
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-expanded={menu}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-surface-2"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">
              {user.name.slice(0, 1)}
            </span>
            <span className="font-medium">{user.name}</span>
          </button>

          {menu && (
            <>
              {/* 바깥을 누르면 닫히도록 */}
              <button
                type="button"
                aria-label="메뉴 닫기"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setMenu(false)}
              />
              <div className="absolute right-0 z-20 mt-1.5 w-56 rounded-card border border-line bg-surface p-1.5 shadow-[var(--shadow-md)]">
                <div className="px-2.5 py-2">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="truncate text-xs text-faint">{user.email}</p>
                  {user.role === "admin" && (
                    <p className="mt-1 text-xs font-semibold text-accent">관리자</p>
                  )}
                </div>

                <hr className="my-1 border-line" />

                <Link
                  href="/account/password"
                  onClick={() => setMenu(false)}
                  className="block rounded-md px-2.5 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink"
                >
                  비밀번호 변경
                </Link>

                {user.role === "admin" && (
                  <Link
                    href="/users"
                    onClick={() => setMenu(false)}
                    className="block rounded-md px-2.5 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink"
                  >
                    사용자 관리
                  </Link>
                )}

                <hr className="my-1 border-line" />

                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full rounded-md px-2.5 py-1.5 text-left text-sm text-muted hover:bg-surface-2 hover:text-ink"
                  >
                    로그아웃
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

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

          <hr className="my-1 border-line" />

          <p className="px-3 py-1 text-xs text-faint">
            {user.name} · {user.email}
          </p>
          <Link
            href="/account/password"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted"
          >
            비밀번호 변경
          </Link>
          {user.role === "admin" && (
            <Link
              href="/users"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted"
            >
              사용자 관리
            </Link>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-muted"
            >
              로그아웃
            </button>
          </form>
        </nav>
      )}
    </header>
  );
}
