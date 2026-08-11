import Link from "next/link";
import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Badge                                                                      */
/* -------------------------------------------------------------------------- */

type Tone = "gray" | "blue" | "green" | "amber" | "red" | "violet";

/*
 * 알약(rounded-full) 대신 살짝 각진 모서리에 얇은 링을 둘렀다.
 * 한 화면에 배지가 열 개씩 놓이는 도구라, 둥근 알약이 많으면 화면이 물러 보이고
 * 경계가 흐릿해 어디까지가 배지인지 잘 안 읽힌다.
 */
const TONE_CLASS: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-700 ring-gray-600/12 dark:bg-gray-400/12 dark:text-gray-300 dark:ring-gray-300/20",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/15 dark:bg-blue-400/12 dark:text-blue-300 dark:ring-blue-300/22",
  green:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-400/12 dark:text-emerald-300 dark:ring-emerald-300/22",
  amber:
    "bg-amber-50 text-amber-800 ring-amber-600/18 dark:bg-amber-400/12 dark:text-amber-300 dark:ring-amber-300/22",
  red: "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-400/12 dark:text-rose-300 dark:ring-rose-300/22",
  violet:
    "bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-400/12 dark:text-violet-300 dark:ring-violet-300/22",
};

export function Badge({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Card                                                                       */
/* -------------------------------------------------------------------------- */

export function Card({
  title,
  action,
  children,
  padded = true,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface shadow-[var(--shadow-sm)]">
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <h2 className="text-sm font-bold">{title}</h2>
          {action}
        </header>
      )}
      <div className={padded ? "p-4" : ""}>{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  PageHeader                                                                 */
/* -------------------------------------------------------------------------- */

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  EmptyState                                                                 */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  message,
  actionLabel,
  actionHref,
}: {
  message: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <p className="text-sm text-muted">{message}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-secondary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  DataTable — 가로 스크롤을 표 안쪽에 가둬 페이지가 밀리지 않게 한다.           */
/* -------------------------------------------------------------------------- */

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">{children}</table>
    </div>
  );
}

// Tailwind 는 소스를 정적으로 훑기 때문에 `text-${align}` 같은 조합형 클래스는
// 빌드 결과에 포함되지 않는다. 완성된 클래스명을 그대로 적어 둔다.
type Align = "left" | "right" | "center";

const ALIGN_CLASS: Record<Align, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function Th({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: Align;
}) {
  return (
    <th
      // 헤더 행에 옅은 바탕을 깔아 본문과 분리한다. 스크롤해도 열 이름이 남도록 고정한다.
      className={`sticky top-0 z-10 whitespace-nowrap border-b border-line bg-surface-2 px-4 py-2 text-xs font-semibold text-muted ${ALIGN_CLASS[align]}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
}: {
  children: ReactNode;
  align?: Align;
  className?: string;
}) {
  return (
    <td
      className={`border-b border-line px-4 py-2.5 ${ALIGN_CLASS[align]} ${className}`}
    >
      {children}
    </td>
  );
}

/* -------------------------------------------------------------------------- */
/*  상세 화면의 라벨-값 목록                                                     */
/* -------------------------------------------------------------------------- */

export function DefList({ children }: { children: ReactNode }) {
  return <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{children}</dl>;
}

export function DefItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-faint">{label}</dt>
      <dd className="mt-0.5 break-words text-sm">{children ?? "-"}</dd>
    </div>
  );
}
