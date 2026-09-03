import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui";
import { SourceAddForm } from "@/components/trend-source-form";
import { SourceTestButton } from "@/components/trend-buttons";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { KEYWORD_KINDS, STARTER_SOURCES, categoryTone, hasNaverKeys } from "@/lib/trends";
import { deleteSource, seedSources, toggleSource } from "@/lib/trend-actions";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  rss: "RSS",
  google: "구글 뉴스",
  naver: "네이버 뉴스",
  manual: "직접 등록",
};

export default async function TrendSourcesPage() {
  await requireUser();

  const sources = await db.trendSource.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: { _count: { select: { items: true } } },
  });

  const naverReady = hasNaverKeys();
  const usesNaver = sources.some((s) => s.kind === "naver" && s.isActive);

  return (
    <>
      <PageHeader
        title="소스 관리"
        description="어디를 볼지 정합니다. 주소가 바뀌거나 안 되는 곳은 꺼 두면 됩니다."
        action={
          <Link href="/trends" className="btn btn-secondary">
            트렌드 보기
          </Link>
        }
      />

      {!naverReady && usesNaver && (
        <div className="mb-6 rounded-card border border-line bg-surface p-4">
          <h2 className="text-sm font-bold">네이버 뉴스 키가 없습니다</h2>
          <p className="mt-1 text-sm text-muted">
            네이버 뉴스로 찾는 소스는 당분간 같은 검색어로 <b>구글 뉴스</b>를 대신 봅니다.
            네이버까지 쓰려면 네이버 클라우드 플랫폼(ncloud.com) 콘솔에서{" "}
            <b>NAVER API HUB → Application 등록</b>(검색 API 선택) 후 &ldquo;인증 정보&rdquo;의
            Client ID / Client Secret 을{" "}
            <code className="rounded bg-surface-2 px-1">.env</code> 에 아래처럼 넣고 서버를
            다시 시작하면 됩니다. 현재 검색 API 는 무료 구간이 넉넉합니다.
          </p>
          <pre className="mt-2 overflow-x-auto rounded-md bg-surface-2 p-3 text-xs">
{`NAVER_APIHUB_KEY_ID="Client ID"
NAVER_APIHUB_KEY="Client Secret"`}
          </pre>
        </div>
      )}

      {sources.length === 0 && (
        <div className="mb-6 rounded-card border border-accent bg-accent-soft p-4">
          <h2 className="text-sm font-bold text-accent">추천 소스로 시작하기</h2>
          <p className="mt-1 text-sm text-muted">
            국내 HRD({STARTER_SOURCES.filter((s) => s.category === "HRD").length}) · 채용 · 경제 ·
            AI · 글로벌까지 {STARTER_SOURCES.length}곳을 한 번에 넣습니다. 넣은 뒤 필요 없는 곳은
            끄면 됩니다.
          </p>
          <form action={seedSources} className="mt-3">
            <button type="submit" className="btn btn-primary">
              추천 소스 {STARTER_SOURCES.length}곳 넣기
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title={`등록된 소스 (${sources.length})`} padded={false}>
            {sources.length === 0 ? (
              <p className="p-4 text-sm text-muted">아직 없습니다.</p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {sources.map((s) => (
                  <li key={s.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={categoryTone(s.category)}>{s.category}</Badge>
                      <span className="text-sm font-semibold">{s.name}</span>
                      <Badge tone="gray">{KIND_LABEL[s.kind] ?? s.kind}</Badge>
                      {!s.isActive && <Badge tone="amber">꺼짐</Badge>}
                      {s.kind === "naver" && !naverReady && (
                        <Badge tone="gray">키 없음 → 구글 뉴스로 대신</Badge>
                      )}
                    </div>

                    <p className="mt-1 break-all text-xs text-faint">
                      {KEYWORD_KINDS.includes(s.kind) ? `검색어: ${s.keyword}` : s.url}
                    </p>

                    {s.lastError ? (
                      <p className="mt-1 text-xs text-[var(--danger)]">
                        마지막 시도 실패 — {s.lastError}
                      </p>
                    ) : (
                      s.lastFetchedAt && (
                        <p className="tnum mt-1 text-xs text-faint">
                          {formatDate(s.lastFetchedAt)} 확인 · 모은 글 {s._count.items}건
                        </p>
                      )
                    )}

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.kind !== "manual" && <SourceTestButton id={s.id} />}
                      <form action={toggleSource.bind(null, s.id)}>
                        <button type="submit" className="btn btn-secondary">
                          {s.isActive ? "끄기" : "켜기"}
                        </button>
                      </form>
                      <form action={deleteSource.bind(null, s.id)}>
                        <button type="submit" className="btn btn-secondary">
                          삭제
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid gap-6">
          <Card title="소스 추가">
            <SourceAddForm />
          </Card>

          <Card title="왜 이곳들인가">
            <ul className="grid gap-3">
              {STARTER_SOURCES.map((s) => (
                <li key={s.name}>
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{s.why}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-xs text-faint">
              잡코리아·사람인은 이용약관상 자동 수집이 안 되어 넣지 않았습니다. 채용 정보는
              고용24(워크넷) 공공 API 와 기업 채용페이지로 대신합니다.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
