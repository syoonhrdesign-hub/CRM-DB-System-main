import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { TREND_CATEGORIES, categoryTone } from "@/lib/trends";
import { togglePin } from "@/lib/trend-actions";
import { CollectNowButton } from "@/components/trend-buttons";

export const dynamic = "force-dynamic";

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; pinned?: string }>;
}) {
  await requireUser();
  const { category, pinned } = await searchParams;

  const onlyPinned = pinned === "1";
  const activeCategory =
    category && (TREND_CATEGORIES as readonly string[]).includes(category) ? category : null;

  const [items, sourceCount, counts, lastRun] = await Promise.all([
    db.trendItem.findMany({
      where: {
        ...(activeCategory ? { category: activeCategory } : {}),
        ...(onlyPinned ? { isPinned: true } : {}),
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 120,
      include: { source: { select: { name: true } } },
    }),
    db.trendSource.count(),
    db.trendItem.groupBy({ by: ["category"], _count: { _all: true } }),
    // 마지막으로 모은 시각 — "언제 봤는지"를 버튼 옆에 보여 준다
    db.trendSource.aggregate({ _max: { lastFetchedAt: true } }),
  ]);
  const lastFetchedAt = lastRun._max.lastFetchedAt;

  const countOf = (c: string) =>
    counts.find((x) => x.category === c)?._count._all ?? 0;

  const pinnedCount = await db.trendItem.count({ where: { isPinned: true } });

  return (
    <>
      <PageHeader
        title="HRD 트렌드"
        description="HRD·채용·경제·AI 소식을 한곳에서 봅니다. 우리가 어디로 갈지 정하는 재료입니다."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/trends/brief" className="btn btn-secondary">
              주간 브리핑
            </Link>
            <Link href="/trends/new" className="btn btn-secondary">
              직접 등록
            </Link>
            <Link href="/trends/sources" className="btn btn-secondary">
              소스 관리
            </Link>
          </div>
        }
      />

      {/* 수집 — 결과가 버튼 옆에 바로 뜬다 */}
      <div className="mb-5 rounded-card border border-line bg-surface px-4 py-3">
        <CollectNowButton
          hint={
            sourceCount === 0
              ? "소스를 먼저 넣어야 모을 수 있습니다."
              : lastFetchedAt
                ? `마지막 수집 ${formatDate(lastFetchedAt)} · 소스 ${sourceCount}곳`
                : "아직 한 번도 모으지 않았습니다."
          }
        />
      </div>

      {sourceCount === 0 && (
        <div className="mb-6 rounded-card border border-accent bg-accent-soft p-4">
          <h2 className="text-sm font-bold text-accent">먼저 볼 곳을 정해야 합니다</h2>
          <p className="mt-1 text-sm text-muted">
            추천 소스(KRIVET·월간HRD·고용노동부·경제·AI·글로벌)를 한 번에 넣을 수 있습니다.
          </p>
          <Link href="/trends/sources" className="btn btn-primary mt-3">
            소스 관리로 이동
          </Link>
        </div>
      )}

      {/* 갈래 */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        <Link
          href="/trends"
          className={`btn ${!activeCategory && !onlyPinned ? "btn-primary" : "btn-secondary"}`}
        >
          전체
        </Link>
        {TREND_CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/trends?category=${encodeURIComponent(c)}`}
            className={`btn ${activeCategory === c ? "btn-primary" : "btn-secondary"}`}
          >
            {c}
            <span className="tnum ml-1 text-xs opacity-70">{countOf(c)}</span>
          </Link>
        ))}
        <Link
          href="/trends?pinned=1"
          className={`btn ${onlyPinned ? "btn-primary" : "btn-secondary"}`}
        >
          담아둔 것
          <span className="tnum ml-1 text-xs opacity-70">{pinnedCount}</span>
        </Link>
      </div>

      <Card padded={false}>
        {items.length === 0 ? (
          <EmptyState
            message={
              sourceCount === 0
                ? "소스를 먼저 등록해 주세요."
                : "아직 모인 소식이 없습니다. '지금 수집'을 눌러 보세요."
            }
          />
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {items.map((it) => (
              <li key={it.id} className="flex gap-3 px-4 py-3 hover:bg-surface-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={categoryTone(it.category)}>{it.category}</Badge>
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm font-semibold hover:text-accent hover:underline"
                    >
                      {it.title}
                    </a>
                  </div>

                  {it.summary && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{it.summary}</p>
                  )}

                  <p className="tnum mt-1 text-xs text-faint">
                    {[
                      it.publisher,
                      it.publishedAt ? formatDate(it.publishedAt) : null,
                      it.source.name,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <form action={togglePin.bind(null, it.id)} className="shrink-0">
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    title={it.isPinned ? "담아둔 것에서 빼기" : "담아두기"}
                  >
                    {it.isPinned ? "담김" : "담기"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
