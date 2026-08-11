import Link from "next/link";
import { BriefButton } from "@/components/brief-button";
import { BriefMarkdown } from "@/components/brief-md";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { hasAnthropicKey } from "@/lib/trend-brief";
import { deleteBrief } from "@/lib/trend-actions";

export const dynamic = "force-dynamic";

export default async function BriefPage() {
  await requireUser();

  const briefs = await db.trendBrief.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const keyReady = hasAnthropicKey();

  return (
    <>
      <PageHeader
        title="주간 브리핑"
        description="모아둔 기사를 AI 가 읽고 'neoize 가 다음에 무엇을 준비할지'까지 정리합니다."
        action={
          <Link href="/trends" className="btn btn-secondary">
            트렌드 보기
          </Link>
        }
      />

      <div className="mb-6">
        {keyReady ? (
          <Card title="새 브리핑">
            <p className="mb-3 text-sm text-muted">
              최근 7일치 기사를 요약합니다. 회당 소액의 API 비용이 듭니다 (기사 100건 기준
              몇백 원 수준).
            </p>
            <BriefButton />
          </Card>
        ) : (
          <Card title="브리핑을 쓰려면 Claude API 키가 필요합니다">
            <ol className="grid gap-2 text-sm text-muted">
              <li>1. console.anthropic.com 가입 후 API Keys 에서 키 발급</li>
              <li>
                2. 서버 PC 의 <code className="rounded bg-surface-2 px-1">.env</code> 에 한 줄
                추가: <code className="rounded bg-surface-2 px-1">ANTHROPIC_API_KEY="발급받은 키"</code>
              </li>
              <li>3. 서버 재시작 (start-crm.bat 창 닫고 다시 실행)</li>
            </ol>
            <p className="mt-3 text-xs text-faint">
              사용한 만큼만 과금됩니다. 주 1회 브리핑 기준 월 몇천 원 수준입니다.
            </p>
          </Card>
        )}
      </div>

      {briefs.length === 0 ? (
        <Card padded={false}>
          <EmptyState message="아직 브리핑이 없습니다." />
        </Card>
      ) : (
        <div className="grid gap-6">
          {briefs.map((b) => (
            <div key={b.id} id={b.id}>
              <Card
                title={`${formatDate(b.periodStart)} ~ ${formatDate(b.periodEnd)}`}
                action={
                  <span className="text-xs text-faint">
                    기사 {b.itemCount}건 · {b.createdBy ?? ""}
                  </span>
                }
              >
                <BriefMarkdown content={b.content} />
                <form action={deleteBrief.bind(null, b.id)} className="mt-4 border-t border-line pt-3">
                  <button type="submit" className="btn btn-secondary">
                    삭제
                  </button>
                </form>
              </Card>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
