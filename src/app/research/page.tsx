import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, TableWrap, Td, Th } from "@/components/ui";
import { BulkAutoButton, BulkNpsButton } from "@/components/auto-research-buttons";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { NPS_TARGET_WHERE, researchGaps } from "@/lib/research";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ResearchListPage() {
  await requireUser();

  const withoutResearch = await db.organization.count({ where: { research: null } });

  // 국민연금 조회 대상: DART 직원현황도 가입자 수도 없고, "미확인" 처리도 안 된 곳
  const npsTargets = await db.companyResearch.count({ where: NPS_TARGET_WHERE });

  const list = await db.companyResearch.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      organization: { select: { id: true, name: true } },
      _count: { select: { sources: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="기업 리서치"
        description="상담 전에 훑어보는 고객사 조사 자료입니다. 통화로 알아낸 것(기업 프로파일)과 따로 둡니다."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/research/import" className="btn btn-secondary">
              조사 파일 올리기
            </Link>
            <Link href="/research/new" className="btn btn-primary">
              + 새 조사
            </Link>
          </div>
        }
      />

      <BulkAutoButton withoutResearch={withoutResearch} />
      <BulkNpsButton targets={npsTargets} />

      <Card padded={false}>
        {list.length === 0 ? (
          <EmptyState
            message="아직 조사한 회사가 없습니다. 회사명만 있으면 시작할 수 있습니다."
            actionLabel="새 조사 시작"
            actionHref="/research/new"
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>회사</Th>
                <Th>고객사 연결</Th>
                <Th align="right">채운 항목</Th>
                <Th align="right">근거</Th>
                <Th>조사일</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
                const g = researchGaps(r as unknown as Record<string, unknown>);
                return (
                  <tr key={r.id} className="hover:bg-surface-2">
                    <Td>
                      <Link
                        href={`/research/${r.id}`}
                        className="font-semibold text-accent hover:underline"
                      >
                        {r.companyName}
                      </Link>
                      {r.summary && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-faint">{r.summary}</p>
                      )}
                    </Td>
                    <Td className="text-muted">
                      {r.organization ? (
                        <Link
                          href={`/organizations/${r.organization.id}`}
                          className="hover:underline"
                        >
                          {r.organization.name}
                        </Link>
                      ) : (
                        <Badge tone="gray">미등록</Badge>
                      )}
                    </Td>
                    <Td align="right" className="tnum">
                      {g.filled}/{g.total}
                      <span className="ml-1 text-xs text-faint">({g.percent}%)</span>
                    </Td>
                    <Td align="right" className="tnum text-muted">
                      {r._count.sources}
                    </Td>
                    <Td className="tnum text-muted">{formatDate(r.researchedAt)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  );
}
