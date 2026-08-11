import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, TableWrap, Td, Th } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DistributionsPage() {
  await requireUser();

  const list = await db.codeDistribution.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { name: true } },
      _count: { select: { participants: true } },
      participants: { where: { viewedAt: { not: null } }, select: { id: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="진단 코드 배부"
        description="교육생이 스스로 자기 코드를 찾아가는 안내 페이지를 만듭니다."
        action={
          <Link href="/distributions/new" className="btn btn-primary">
            + 안내 페이지 만들기
          </Link>
        }
      />

      <Card padded={false}>
        {list.length === 0 ? (
          <EmptyState
            message="아직 만든 안내 페이지가 없습니다. 교육생 명단만 있으면 바로 만들 수 있습니다."
            actionLabel="안내 페이지 만들기"
            actionHref="/distributions/new"
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>제목</Th>
                <Th>고객사</Th>
                <Th align="right">인원</Th>
                <Th align="right">확인</Th>
                <Th>기간</Th>
                <Th>상태</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => {
                const viewed = d.participants.length;
                const total = d._count.participants;
                const percent = total > 0 ? Math.round((viewed / total) * 100) : 0;
                return (
                  <tr key={d.id} className="hover:bg-surface-2">
                    <Td>
                      <Link
                        href={`/distributions/${d.id}`}
                        className="font-semibold text-accent hover:underline"
                      >
                        {d.title}
                      </Link>
                    </Td>
                    <Td className="text-muted">{d.organization?.name ?? "-"}</Td>
                    <Td align="right" className="tnum">{total}</Td>
                    <Td align="right" className="tnum">
                      {viewed}
                      <span className="ml-1 text-xs text-faint">({percent}%)</span>
                    </Td>
                    <Td className="tnum text-muted">
                      {d.opensAt || d.closesAt
                        ? `${formatDate(d.opensAt)} ~ ${formatDate(d.closesAt)}`
                        : "-"}
                    </Td>
                    <Td>
                      {d.isActive ? (
                        <Badge tone="green">공개중</Badge>
                      ) : (
                        <Badge tone="gray">중지</Badge>
                      )}
                    </Td>
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
