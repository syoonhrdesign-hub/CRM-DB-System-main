import Link from "next/link";
import { CLOSED_STAGES, DEAL_STAGES } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatKRWShort } from "@/lib/format";
import { DealCard } from "@/components/deal-card";
import { EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ closed?: string }>;
}) {
  const { closed = "" } = await searchParams;
  // 기본은 진행 중만. 완료·실패는 해가 갈수록 쌓이기만 하므로 원할 때만 펼친다.
  const showClosed = closed === "1";

  const deals = await db.deal.findMany({
    orderBy: [{ expectedCloseDate: "asc" }, { updatedAt: "desc" }],
    include: { organization: { select: { id: true, name: true } } },
  });

  const byStage = new Map<string, typeof deals>();
  for (const stage of DEAL_STAGES) byStage.set(stage, []);
  for (const deal of deals) {
    // 상수 목록에 없는 값이 DB 에 남아 있어도 화면이 깨지지 않게 한다.
    if (!byStage.has(deal.stage)) byStage.set(deal.stage, []);
    byStage.get(deal.stage)!.push(deal);
  }

  const open = deals.filter(
    (d) => !CLOSED_STAGES.includes(d.stage as (typeof CLOSED_STAGES)[number]),
  );
  const pipelineValue = open.reduce((s, d) => s + d.expectedAmount, 0);
  // 확률 가중 예상 매출 — 실제로 들어올 가능성을 반영한 값
  const weighted = open.reduce(
    (s, d) => s + (d.expectedAmount * d.probability) / 100,
    0,
  );
  const won = deals
    .filter((d) => d.stage === "완료")
    .reduce((s, d) => s + d.expectedAmount, 0);
  const closedCount = deals.length - open.length;

  const columns = [...byStage.entries()].filter(
    ([stage]) =>
      showClosed || !CLOSED_STAGES.includes(stage as (typeof CLOSED_STAGES)[number]),
  );

  return (
    <>
      <PageHeader
        title="영업 파이프라인"
        description={`진행 중 ${open.length}건 · 예상 ${formatKRWShort(pipelineValue)} · 가중 ${formatKRWShort(Math.round(weighted))} · 수주 ${formatKRWShort(won)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href={showClosed ? "/deals" : "/deals?closed=1"}
              className="btn btn-secondary"
            >
              {showClosed ? "진행 중만 보기" : `완료·실패 ${closedCount}건 펼치기`}
            </Link>
            <Link href="/deals/new" className="btn btn-primary">
              + 영업건 등록
            </Link>
          </div>
        }
      />

      {deals.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface">
          <EmptyState
            message="등록된 영업 기회가 없습니다."
            actionLabel="영업건 등록"
            actionHref="/deals/new"
          />
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {columns.map(([stage, list]) => {
              const sum = list.reduce((s, d) => s + d.expectedAmount, 0);
              return (
                <div key={stage} className="w-64 shrink-0">
                  <div className="mb-2 flex items-baseline justify-between px-1">
                    <h2 className="text-sm font-bold">
                      {stage}
                      <span className="ml-1.5 text-xs font-normal text-faint">
                        {list.length}
                      </span>
                    </h2>
                    <span className="tnum text-xs text-muted">
                      {formatKRWShort(sum)}
                    </span>
                  </div>

                  <div className="grid gap-2 rounded-xl bg-surface-2 p-2">
                    {list.length === 0 ? (
                      <p className="px-1 py-6 text-center text-xs text-faint">
                        없음
                      </p>
                    ) : (
                      list.map((d) => <DealCard key={d.id} deal={d} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
