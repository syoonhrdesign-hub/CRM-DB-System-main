import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLink } from "@/components/copy-link";
import { Badge, Card, EmptyState, PageHeader, TableWrap, Td, Th } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DistributionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const dist = await db.codeDistribution.findUnique({
    where: { id },
    include: {
      organization: { select: { id: true, name: true } },
      participants: { orderBy: [{ viewedAt: "asc" }, { name: "asc" }] },
    },
  });

  if (!dist) notFound();

  const total = dist.participants.length;
  const viewed = dist.participants.filter((p) => p.viewedAt).length;
  const notViewed = dist.participants.filter((p) => !p.viewedAt);
  const percent = total > 0 ? Math.round((viewed / total) * 100) : 0;

  return (
    <>
      <PageHeader
        title={dist.title}
        description={[
          dist.organization?.name,
          `교육생 ${total}명`,
          dist.opensAt || dist.closesAt
            ? `${formatDate(dist.opensAt)} ~ ${formatDate(dist.closesAt)}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        action={
          <Link href="/distributions" className="btn btn-secondary">
            목록
          </Link>
        }
      />

      {/* 링크 — 이 화면의 목적 */}
      <div className="mb-6">
        <CopyLink slug={dist.slug} isActive={dist.isActive} />
      </div>

      {/* 확인 현황 — 알림톡 대신 이걸로 챙긴다 */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card title="확인 현황">
          <div className="flex items-baseline gap-2">
            <span className="tnum text-3xl font-bold text-accent">{viewed}</span>
            <span className="tnum text-sm text-muted">/ {total}명</span>
            <span className="tnum ml-auto text-sm font-semibold">{percent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-muted">
            {notViewed.length > 0
              ? `${notViewed.length}명이 아직 코드를 확인하지 않았습니다.`
              : "전원이 코드를 확인했습니다."}
          </p>
        </Card>

        <div className="lg:col-span-2">
          <Card title={`아직 확인하지 않은 사람 (${notViewed.length})`} padded={false}>
            {notViewed.length === 0 ? (
              <EmptyState message="전원이 확인했습니다." />
            ) : (
              <div className="max-h-56 overflow-auto p-4">
                <p className="flex flex-wrap gap-1.5">
                  {notViewed.map((p) => (
                    <span
                      key={p.id}
                      className="rounded-md bg-amber-50 px-2 py-0.5 text-sm text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
                    >
                      {p.name}
                      {p.department && (
                        <span className="ml-1 text-xs opacity-70">{p.department}</span>
                      )}
                    </span>
                  ))}
                </p>
                <p className="mt-3 text-xs text-faint">
                  교육 전에 이 사람들만 따로 챙기면 됩니다.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 전체 명단 */}
      <Card title={`교육생 명단 (${total})`} padded={false}>
        <TableWrap>
          <thead>
            <tr>
              <Th>이름</Th>
              <Th>부서</Th>
              <Th>코드</Th>
              <Th>확인</Th>
            </tr>
          </thead>
          <tbody>
            {dist.participants.map((p) => (
              <tr key={p.id} className="hover:bg-surface-2">
                <Td className="font-medium">{p.name}</Td>
                <Td className="text-muted">{p.department ?? "-"}</Td>
                <Td className="tnum">{p.code}</Td>
                <Td>
                  {p.viewedAt ? (
                    <span className="tnum text-sm text-muted">
                      {formatDate(p.viewedAt)}
                      {p.viewCount > 1 && (
                        <span className="ml-1 text-xs text-faint">
                          ({p.viewCount}회)
                        </span>
                      )}
                    </span>
                  ) : (
                    <Badge tone="amber">미확인</Badge>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </>
  );
}
