import Link from "next/link";
import {
  SEASON_ACTION,
  SEASON_TONE,
  currentWeekRange,
  findContactsDue,
  findSeasonHits,
} from "@/lib/agenda";
import { calculateGrade } from "@/lib/grade";
import { GradeChip } from "@/components/grade-chip";
import { LIFECYCLE_ACTION, LIFECYCLE_TONE, calculateLifecycle } from "@/lib/lifecycle";
import { db } from "@/lib/db";
import { daysUntil, formatDate } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;

  const now = new Date();
  const currentMonth = now.getUTCMonth() + 1;
  const parsed = Number.parseInt(monthParam ?? "", 10);
  const month =
    Number.isFinite(parsed) && parsed >= 1 && parsed <= 12 ? parsed : currentMonth;

  const week = currentWeekRange(now);

  const organizations = await db.organization.findMany({
    where: { status: { not: "종료" } },
    include: {
      profile: true,
      activities: {
        orderBy: { occurredAt: "desc" },
        take: 1,
        select: { occurredAt: true },
      },
      trainings: {
        where: { status: "완료" },
        select: { startDate: true, course: { select: { category: true } } },
      },
    },
  });

  // 등급·생애주기·마지막 접촉일을 한 번에 계산해 둔다.
  const enriched = organizations.map((org) => {
    const { grade } = calculateGrade(org, org.gradeOverride);
    const lifecycle = calculateLifecycle(
      org.trainings.map((t) => ({
        startDate: t.startDate,
        courseCategory: t.course?.category ?? null,
      })),
    );
    return {
      org,
      grade,
      lifecycle,
      lastContactAt: org.activities[0]?.occurredAt ?? null,
    };
  });

  const due = findContactsDue(
    enriched.map((e) => ({
      id: e.org.id,
      name: e.org.name,
      grade: e.grade,
      contactCycleWeeks: e.org.contactCycleWeeks,
      lastContactAt: e.lastContactAt,
      ownerName: e.org.ownerName,
    })),
    now,
  );

  const seasonHits = findSeasonHits(
    enriched
      .filter((e) => e.org.profile)
      .map((e) => ({
        organizationId: e.org.id,
        organizationName: e.org.name,
        grade: e.grade,
        budgetMonth: e.org.profile!.budgetMonth,
        budgetNote: e.org.profile!.budgetNote,
        hiringMonths: e.org.profile!.hiringMonths,
        hiringNote: e.org.profile!.hiringNote,
        trainingMonths: e.org.profile!.trainingMonths,
        trainingNote: e.org.profile!.trainingNote,
      })),
    month,
  );

  // 이번 주 후속 조치와 예정 교육
  const [weekTodos, weekTrainings] = await Promise.all([
    db.activity.findMany({
      where: {
        isDone: false,
        nextAction: { not: null },
        nextActionDate: { lte: week.end },
      },
      orderBy: { nextActionDate: "asc" },
      include: { organization: { select: { id: true, name: true } } },
    }),
    db.training.findMany({
      where: {
        status: { in: ["예정", "진행중"] },
        startDate: { gte: week.start, lte: week.end },
      },
      orderBy: { startDate: "asc" },
      include: { organization: { select: { id: true, name: true } } },
    }),
  ]);

  const atRisk = enriched.filter(
    (e) => e.lifecycle.stage === "이탈위험" || e.lifecycle.stage === "휴면",
  );

  return (
    <>
      <PageHeader
        title="컨택 아젠다"
        description={`${formatDate(week.start)} ~ ${formatDate(week.end)} 주간 · ${MONTH_NAMES[month - 1]} 월간`}
      />

      {/* ------------------------------- 주간 ------------------------------- */}
      <h2 className="mb-3 text-lg font-bold">이번 주</h2>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card
          title={`접촉 주기 도래 (${due.length})`}
          padded={false}
          action={
            <span className="text-xs text-faint">등급별 주기 기준</span>
          }
        >
          {due.length === 0 ? (
            <EmptyState message="주기가 지난 고객사가 없습니다." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {due.slice(0, 12).map((d) => (
                <li key={d.id} className="px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <GradeChip grade={d.grade} />
                    <Link
                      href={`/organizations/${d.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {d.name}
                    </Link>
                  </div>
                  <p className="mt-0.5 text-xs">
                    {d.neverContacted ? (
                      <span className="font-semibold text-[var(--danger)]">
                        접촉 이력 없음
                      </span>
                    ) : (
                      <>
                        <span className="tnum font-semibold text-[var(--danger)]">
                          {d.overdueDays === 0
                            ? "오늘이 기한"
                            : `${d.overdueDays}일 초과`}
                        </span>
                        <span className="tnum text-faint">
                          {" · "}
                          {d.cycleWeeks}주 주기 · 마지막 접촉 {d.daysSince}일 전
                        </span>
                      </>
                    )}
                  </p>
                  {d.ownerName && (
                    <p className="text-xs text-faint">담당 {d.ownerName}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`후속 조치 (${weekTodos.length})`} padded={false}>
          {weekTodos.length === 0 ? (
            <EmptyState message="이번 주 후속 조치가 없습니다." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {weekTodos.map((t) => {
                const d = t.nextActionDate ? daysUntil(t.nextActionDate) : null;
                const overdue = d != null && d < 0;
                return (
                  <li key={t.id} className="px-4 py-2.5">
                    <Link
                      href={`/activities/${t.id}/edit`}
                      className="text-sm font-medium hover:underline"
                    >
                      {t.nextAction}
                    </Link>
                    <p className="mt-0.5 text-xs">
                      <Link
                        href={`/organizations/${t.organization.id}`}
                        className="text-muted hover:underline"
                      >
                        {t.organization.name}
                      </Link>
                      <span
                        className={`tnum ${overdue ? "font-semibold text-[var(--danger)]" : "text-faint"}`}
                      >
                        {" · "}
                        {formatDate(t.nextActionDate)}
                        {overdue && ` (${Math.abs(d)}일 지남)`}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title={`이번 주 교육 (${weekTrainings.length})`} padded={false}>
          {weekTrainings.length === 0 ? (
            <EmptyState message="이번 주 진행 교육이 없습니다." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {weekTrainings.map((t) => (
                <li key={t.id} className="px-4 py-2.5">
                  <Link
                    href={`/trainings/${t.id}/edit`}
                    className="text-sm font-medium hover:underline"
                  >
                    {t.title}
                  </Link>
                  <p className="mt-0.5 text-xs">
                    <Link
                      href={`/organizations/${t.organization.id}`}
                      className="text-muted hover:underline"
                    >
                      {t.organization.name}
                    </Link>
                    <span className="tnum text-faint">
                      {" · "}
                      {formatDate(t.startDate)} · {t.headcount}명
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ------------------------------- 월간 ------------------------------- */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          월간 · {MONTH_NAMES[month - 1]}
          {month !== currentMonth && (
            <span className="ml-2 text-sm font-normal text-faint">
              (이번 달은 {MONTH_NAMES[currentMonth - 1]})
            </span>
          )}
        </h2>

        <div className="flex flex-wrap gap-1">
          {MONTH_NAMES.map((label, i) => {
            const m = i + 1;
            return (
              <Link
                key={m}
                href={`/agenda?month=${m}`}
                className={`tnum rounded-md border px-2 py-1 text-xs ${
                  m === month
                    ? "border-accent bg-accent text-white"
                    : "border-line text-muted hover:bg-surface-2"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title={`${MONTH_NAMES[month - 1]} 시즌 이벤트 (${seasonHits.length})`}
          padded={false}
        >
          {seasonHits.length === 0 ? (
            <EmptyState
              message={`${MONTH_NAMES[month - 1]}에 해당하는 시즌 정보가 없습니다. 고객사 프로파일에 예산 편성월·채용 시즌·교육 시즌을 채워 두면 여기에 나타납니다.`}
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {seasonHits.map((h, i) => (
                <li key={`${h.organizationId}-${h.kind}-${i}`} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={SEASON_TONE[h.kind]}>{h.kind}</Badge>
                    <GradeChip grade={h.grade} />
                    <Link
                      href={`/organizations/${h.organizationId}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {h.organizationName}
                    </Link>
                  </div>
                  <p className="mt-1 text-sm text-muted">{SEASON_ACTION[h.kind]}</p>
                  {h.note && (
                    <p className="mt-0.5 text-xs text-faint">{h.note}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`관계 점검이 필요한 고객사 (${atRisk.length})`} padded={false}>
          {atRisk.length === 0 ? (
            <EmptyState message="이탈 위험·휴면 고객사가 없습니다." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {atRisk.map((e) => (
                <li key={e.org.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={LIFECYCLE_TONE[e.lifecycle.stage]}>
                      {e.lifecycle.stage}
                    </Badge>
                    <GradeChip grade={e.grade} />
                    <Link
                      href={`/organizations/${e.org.id}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {e.org.name}
                    </Link>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {LIFECYCLE_ACTION[e.lifecycle.stage]}
                  </p>
                  <p className="tnum mt-0.5 text-xs text-faint">
                    마지막 거래 {e.lifecycle.monthsSinceLast}개월 전 · 누적{" "}
                    {e.lifecycle.dealCount}건
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
