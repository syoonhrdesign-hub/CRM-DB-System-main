import type { Grade } from "@/lib/grade";

/**
 * 등급 칩.
 *
 * 일반 배지와 달리 색으로 종류를 구분하는 게 아니라, **시각적 무게로 순위를 표현**한다.
 * S 는 꽉 채우고 아래로 갈수록 옅어지므로, 목록을 훑을 때 중요한 고객사가 먼저 눈에 들어온다.
 * 무지개처럼 색을 흩뿌리면 어느 쪽이 위인지 매번 범례를 떠올려야 한다.
 */
const CHIP: Record<Grade, string> = {
  S: "bg-accent text-white ring-transparent",
  A: "bg-accent-soft text-accent ring-accent/25",
  B: "bg-surface-2 text-ink ring-line-strong",
  C: "bg-transparent text-muted ring-line",
  D: "bg-transparent text-faint ring-line",
};

export function GradeChip({
  grade,
  size = "sm",
}: {
  grade: Grade | null;
  /** sm — 목록·배지 자리 / lg — 상세 화면 강조 */
  size?: "sm" | "lg";
}) {
  if (!grade) {
    return <span className="text-xs text-faint">미평가</span>;
  }

  const dimension =
    size === "lg" ? "h-9 min-w-9 text-base" : "h-5 min-w-5 text-xs";

  return (
    <span
      title={`${grade}등급`}
      className={`tnum inline-flex items-center justify-center rounded-md px-1 font-bold ring-1 ring-inset ${dimension} ${CHIP[grade]}`}
    >
      {grade}
    </span>
  );
}
