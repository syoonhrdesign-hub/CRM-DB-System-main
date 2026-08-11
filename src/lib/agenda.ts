/**
 * 주간 · 월간 컨택 아젠다.
 *
 * "이번 주에 누구에게 연락해야 하는가"와 "이번 달에 어떤 고객사를 챙겨야 하는가"를
 * 감이 아니라 규칙으로 뽑아낸다. 근거는 세 가지다.
 *
 *   1. 등급별 접촉 주기 — 마지막 접촉일로부터 주기가 지났으면 연락 대상
 *   2. 프로파일의 시즌 정보 — 예산 편성월 / 채용 시즌 / 교육 시즌
 *   3. 후속 조치 기한과 예정 교육
 */

import { contactCycleWeeks, type Grade } from "./grade";

/** "3,9" 형태로 저장된 월 목록을 숫자 배열로 바꾼다. */
export function parseMonths(value: string | null | undefined): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 12);
}

export function formatMonths(months: number[]): string {
  if (months.length === 0) return "-";
  return months.map((m) => `${m}월`).join(", ");
}

/** 이번 주(월요일~일요일)의 시작·끝을 UTC 자정 기준으로 구한다. */
export function currentWeekRange(base = new Date()): { start: Date; end: Date } {
  const d = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()),
  );
  // getUTCDay(): 일=0 … 토=6. 월요일 시작으로 맞춘다.
  const offsetToMonday = (d.getUTCDay() + 6) % 7;
  const start = new Date(d.getTime() - offsetToMonday * 86_400_000);
  const end = new Date(start.getTime() + 6 * 86_400_000);
  return { start, end };
}

export type ContactDueInput = {
  id: string;
  name: string;
  grade: Grade | null;
  contactCycleWeeks: number | null;
  /** 마지막 활동 일자 — 활동 기록이 없으면 null */
  lastContactAt: Date | null;
  ownerName: string | null;
};

export type ContactDue = ContactDueInput & {
  /** 적용된 접촉 주기(주) */
  cycleWeeks: number;
  /** 마지막 접촉 후 경과일. 접촉 이력이 없으면 null */
  daysSince: number | null;
  /** 다음 접촉 예정일 */
  dueAt: Date | null;
  /** 기한이 지난 일수 (0 이면 오늘이 기한) */
  overdueDays: number;
  /** 한 번도 접촉하지 않은 고객사 */
  neverContacted: boolean;
};

/**
 * 접촉 주기가 도래했거나 지난 고객사를 급한 순으로 돌려준다.
 * 한 번도 접촉하지 않은 곳은 항상 목록에 포함한다.
 */
export function findContactsDue(
  orgs: ContactDueInput[],
  base = new Date(),
): ContactDue[] {
  const today = Date.UTC(
    base.getUTCFullYear(),
    base.getUTCMonth(),
    base.getUTCDate(),
  );

  const result: ContactDue[] = [];

  for (const org of orgs) {
    const cycleWeeks = contactCycleWeeks(org.grade, org.contactCycleWeeks);

    if (!org.lastContactAt) {
      result.push({
        ...org,
        cycleWeeks,
        daysSince: null,
        dueAt: null,
        overdueDays: Number.MAX_SAFE_INTEGER, // 정렬에서 맨 위로
        neverContacted: true,
      });
      continue;
    }

    const last = Date.UTC(
      org.lastContactAt.getUTCFullYear(),
      org.lastContactAt.getUTCMonth(),
      org.lastContactAt.getUTCDate(),
    );
    const daysSince = Math.round((today - last) / 86_400_000);
    const cycleDays = cycleWeeks * 7;
    const dueAt = new Date(last + cycleDays * 86_400_000);
    const overdueDays = daysSince - cycleDays;

    if (overdueDays >= 0) {
      result.push({
        ...org,
        cycleWeeks,
        daysSince,
        dueAt,
        overdueDays,
        neverContacted: false,
      });
    }
  }

  return result.sort((a, b) => b.overdueDays - a.overdueDays);
}

export type SeasonHit = {
  organizationId: string;
  organizationName: string;
  grade: Grade | null;
  /** 예산편성 / 채용시즌 / 교육시즌 */
  kind: "예산편성" | "채용시즌" | "교육시즌";
  note: string | null;
};

/** 지정한 월에 해당하는 시즌 이벤트를 모은다. */
export function findSeasonHits(
  profiles: {
    organizationId: string;
    organizationName: string;
    grade: Grade | null;
    budgetMonth: number | null;
    budgetNote: string | null;
    hiringMonths: string | null;
    hiringNote: string | null;
    trainingMonths: string | null;
    trainingNote: string | null;
  }[],
  month: number,
): SeasonHit[] {
  const hits: SeasonHit[] = [];

  for (const p of profiles) {
    const base = {
      organizationId: p.organizationId,
      organizationName: p.organizationName,
      grade: p.grade,
    };

    if (p.budgetMonth === month) {
      hits.push({ ...base, kind: "예산편성", note: p.budgetNote });
    }
    if (parseMonths(p.hiringMonths).includes(month)) {
      hits.push({ ...base, kind: "채용시즌", note: p.hiringNote });
    }
    if (parseMonths(p.trainingMonths).includes(month)) {
      hits.push({ ...base, kind: "교육시즌", note: p.trainingNote });
    }
  }

  return hits;
}

export const SEASON_TONE: Record<SeasonHit["kind"], "amber" | "blue" | "green"> = {
  예산편성: "amber",
  채용시즌: "blue",
  교육시즌: "green",
};

export const SEASON_ACTION: Record<SeasonHit["kind"], string> = {
  예산편성: "다음 해 예산에 우리 과정이 들어가도록 지금 제안한다.",
  채용시즌: "신입·경력 입문교육 수요를 확인한다.",
  교육시즌: "이번 시즌 교육 계획과 잔여 예산을 확인한다.",
};
