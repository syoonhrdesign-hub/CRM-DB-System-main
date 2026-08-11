import Link from "next/link";
import {
  ACTIVITY_TYPE_TONE,
  CLOSED_STAGES,
  DEAL_STAGE_TONE,
  DEAL_STAGES,
  TRAINING_STATUS_TONE,
} from "@/lib/constants";
import { db } from "@/lib/db";
import { daysUntil, formatDate, formatKRWShort, monthKey } from "@/lib/format";
import {
  MonthlyRevenueChart,
  type MonthlyPoint,
} from "@/components/monthly-revenue-chart";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

/** 최근 12개월의 월 키를 과거→현재 순으로 만든다. */
function last12Months(): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 11; i >= 0; i--) {
    keys.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
  }
  return keys;
}

export default async function DashboardPage() {
  const now = new Date();
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

  const [
    orgCount,
    activeOrgCount,
    completedThisYear,
    windowTrainings,
    openDeals,
    upcomingTrainings,
    todos,
    recentActivities,
  ] = await Promise.all([
    db.organization.count(),
    db.organization.count({ where: { status: "거래중" } }),

    // 올해 완료 교육 — 매출·수료 인원 집계용
    db.training.findMany({
      where: { status: "완료", startDate: { gte: yearStart } },
      select: { totalAmount: true, headcount: true },
    }),

    // 최근 12개월 완료 교육 — 월별 그래프용
    db.training.findMany({
      where: { status: "완료", startDate: { gte: windowStart } },
      select: { startDate: true, totalAmount: true },
    }),

    db.deal.findMany({
      where: { stage: { notIn: [...CLOSED_STAGES] } },
      select: { stage: true, expectedAmount: true, probability: true },
    }),

    db.training.findMany({
      where: { status: { in: ["예정", "진행중"] } },
      orderBy: { startDate: "asc" },
      take: 8,
      include: { organization: { select: { id: true, name: true } } },
    }),

    // 후속 조치 할 일 — 기한이 임박하거나 지난 것부터
    db.activity.findMany({
      where: { isDone: false, nextAction: { not: null } },
      orderBy: [{ nextActionDate: "asc" }],
      take: 10,
      include: { organization: { select: { id: true, name: true } } },
    }),

    db.activity.findMany({
      orderBy: { occurredAt: "desc" },
      take: 8,
      include: { organization: { select: { id: true, name: true } } },
    }),
  ]);

  const revenueYTD = completedThisYear.reduce((s, t) => s + t.totalAmount, 0);
  const traineesYTD = completedThisYear.reduce((s, t) => s + t.headcount, 0);

  const pipelineValue = openDeals.reduce((s, d) => s + d.expectedAmount, 0);
  const weightedPipeline = openDeals.reduce(
    (s, d) => s + (d.expectedAmount * d.probability) / 100,
    0,
  );

  // 월별 집계 — 값이 없는 달도 0 으로 채워 12칸을 유지한다.
  const buckets = new Map<string, { revenue: number; count: number }>();
  for (const key of last12Months()) buckets.set(key, { revenue: 0, count: 0 });
  for (const t of windowTrainings) {
    const b = buckets.get(monthKey(t.startDate));
    if (b) {
      b.revenue += t.totalAmount;
      b.count += 1;
    }
  }
  const monthly: MonthlyPoint[] = [...buckets.entries()].map(([key, v]) => ({
    key,
    ...v,
  }));

  const stageCounts = DEAL_STAGES.filter(
    (s) => !CLOSED_STAGES.includes(s as (typeof CLOSED_STAGES)[number]),
  ).map((stage) => ({
    stage,
    count: openDeals.filter((d) => d.stage === stage).length,
    amount: openDeals
      .filter((d) => d.stage === stage)
      .reduce((s, d) => s + d.expectedAmount, 0),
  }));

  return (
    <>
      <PageHeader
        title="대시보드"
        description={`${now.getUTCFullYear()}년 현황`}
        action={
          <Link href="/organizations/new" className="btn btn-primary">
            + 고객사 등록
          </Link>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="올해 매출"
          value={formatKRWShort(revenueYTD)}
          note={`완료 교육 ${completedThisYear.length}건`}
          href="/trainings?status=완료"
        />
        <Stat
          label="올해 교육 인원"
          value={`${traineesYTD.toLocaleString("ko-KR")}명`}
          note="수료 기준"
          href="/trainings"
        />
        <Stat
          label="진행 중 영업"
          value={formatKRWShort(pipelineValue)}
          note={`${openDeals.length}건 · 가중 ${formatKRWShort(Math.round(weightedPipeline))}`}
          href="/deals"
        />
        <Stat
          label="고객사"
          value={`${orgCount}개`}
          note={`거래중 ${activeOrgCount}개`}
          href="/organizations"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="월별 매출">
            <MonthlyRevenueChart data={monthly} />
          </Card>
        </div>

        <Card title="파이프라인 단계별" padded={false}>
          {openDeals.length === 0 ? (
            <EmptyState
              message="진행 중인 영업 기회가 없습니다."
              actionLabel="영업건 등록"
              actionHref="/deals/new"
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {stageCounts.map((s) => (
                <li
                  key={s.stage}
                  className="flex items-center justify-between gap-2 px-4 py-2.5"
                >
                  <span className="flex items-center gap-2">
                    <Badge tone={DEAL_STAGE_TONE[s.stage] ?? "gray"}>{s.stage}</Badge>
                    <span className="tnum text-sm text-muted">{s.count}건</span>
                  </span>
                  <span className="tnum text-sm font-semibold">
                    {formatKRWShort(s.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card
          title="후속 조치 할 일"
          action={
            <Link
              href="/activities?todo=1"
              className="text-sm font-semibold text-accent hover:underline"
            >
              전체
            </Link>
          }
          padded={false}
        >
          {todos.length === 0 ? (
            <EmptyState message="처리할 후속 조치가 없습니다." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {todos.map((t) => {
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
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
                      <Link
                        href={`/organizations/${t.organization.id}`}
                        className="text-muted hover:underline"
                      >
                        {t.organization.name}
                      </Link>
                      {t.nextActionDate && (
                        <span
                          className={`tnum ${overdue ? "font-semibold text-[var(--danger)]" : "text-faint"}`}
                        >
                          {formatDate(t.nextActionDate)}
                          {overdue
                            ? ` · ${Math.abs(d)}일 지남`
                            : d === 0
                              ? " · 오늘"
                              : d != null && d <= 7
                                ? ` · D-${d}`
                                : ""}
                        </span>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card
          title="예정된 교육"
          action={
            <Link
              href="/trainings"
              className="text-sm font-semibold text-accent hover:underline"
            >
              전체
            </Link>
          }
          padded={false}
        >
          {upcomingTrainings.length === 0 ? (
            <EmptyState
              message="예정된 교육이 없습니다."
              actionLabel="교육 등록"
              actionHref="/trainings/new"
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {upcomingTrainings.map((t) => (
                <li key={t.id} className="px-4 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/trainings/${t.id}/edit`}
                      className="text-sm font-medium hover:underline"
                    >
                      {t.title}
                    </Link>
                    <Badge tone={TRAINING_STATUS_TONE[t.status] ?? "gray"}>
                      {t.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs">
                    <Link
                      href={`/organizations/${t.organization.id}`}
                      className="text-muted hover:underline"
                    >
                      {t.organization.name}
                    </Link>
                    <span className="tnum text-faint">
                      {" · "}
                      {formatDate(t.startDate)}
                      {t.headcount > 0 && ` · ${t.headcount}명`}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="최근 활동"
          action={
            <Link
              href="/activities"
              className="text-sm font-semibold text-accent hover:underline"
            >
              전체
            </Link>
          }
          padded={false}
        >
          {recentActivities.length === 0 ? (
            <EmptyState
              message="기록된 활동이 없습니다."
              actionLabel="활동 기록"
              actionHref="/activities/new"
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {recentActivities.map((a) => (
                <li key={a.id} className="px-4 py-2.5">
                  <div className="flex items-start gap-2">
                    <Badge tone={ACTIVITY_TYPE_TONE[a.type] ?? "gray"}>{a.type}</Badge>
                    <Link
                      href={`/activities/${a.id}/edit`}
                      className="text-sm font-medium hover:underline"
                    >
                      {a.summary}
                    </Link>
                  </div>
                  <p className="mt-0.5 text-xs">
                    <Link
                      href={`/organizations/${a.organization.id}`}
                      className="text-muted hover:underline"
                    >
                      {a.organization.name}
                    </Link>
                    <span className="tnum text-faint">
                      {" · "}
                      {formatDate(a.occurredAt)}
                    </span>
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

function Stat({
  label,
  value,
  note,
  href,
}: {
  label: string;
  value: string;
  note?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-line bg-surface p-4 hover:border-line-strong"
    >
      <p className="text-xs font-semibold text-faint">{label}</p>
      <p className="tnum mt-1 text-2xl font-bold">{value}</p>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
    </Link>
  );
}
