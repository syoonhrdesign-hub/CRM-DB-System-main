import Link from "next/link";
import { db } from "@/lib/db";
import { ORG_STATUS_TONE, ORG_STATUSES, ORG_TYPES } from "@/lib/constants";
import { GRADE_TONE, GRADES, calculateGrade } from "@/lib/grade";
import { formatKRWShort } from "@/lib/format";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";

export const dynamic = "force-dynamic";

type Search = { q?: string; status?: string; type?: string; grade?: string };

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const {
    q = "",
    status = "",
    type = "",
    grade: gradeFilter = "",
  } = await searchParams;

  // SQLite 의 Prisma 커넥터는 mode:"insensitive" 를 지원하지 않는다.
  // 한글에는 대소문자가 없으므로 contains 만으로 충분하고,
  // 영문 기관명을 위해 소문자 변환본도 함께 훑는다.
  const where = {
    ...(status ? { status } : {}),
    ...(type ? { orgType: type } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { name: { contains: q.toLowerCase() } },
            { shortName: { contains: q } },
            { industry: { contains: q } },
            { ownerName: { contains: q } },
          ],
        }
      : {}),
  };

  const organizations = await db.organization.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    include: {
      _count: { select: { contacts: true, trainings: true, deals: true } },
      trainings: {
        where: { status: "완료" },
        select: { totalAmount: true },
      },
    },
  });

  const rows = organizations
    .map((o) => ({
      ...o,
      revenue: o.trainings.reduce((sum, t) => sum + t.totalAmount, 0),
      grade: calculateGrade(o, o.gradeOverride).grade,
    }))
    .filter((o) => (gradeFilter ? o.grade === gradeFilter : true));

  const hasFilter = Boolean(q || status || type || gradeFilter);

  return (
    <>
      <PageHeader
        title="고객사"
        description={`총 ${rows.length}개 기관${hasFilter ? " (필터 적용됨)" : ""}`}
        action={
          <Link href="/organizations/new" className="btn btn-primary">
            + 고객사 등록
          </Link>
        }
      />

      <form className="mb-4 flex flex-wrap gap-2" action="/organizations">
        <input
          name="q"
          defaultValue={q}
          placeholder="기관명 · 업종 · 담당자 검색"
          className="input max-w-xs"
        />
        <select name="status" defaultValue={status} className="select max-w-40">
          <option value="">전체 상태</option>
          {ORG_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="type" defaultValue={type} className="select max-w-40">
          <option value="">전체 유형</option>
          {ORG_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select name="grade" defaultValue={gradeFilter} className="select max-w-32">
          <option value="">전체 등급</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}등급
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-secondary">
          검색
        </button>
        {hasFilter && (
          <Link href="/organizations" className="btn btn-secondary">
            초기화
          </Link>
        )}
      </form>

      <Card padded={false}>
        {rows.length === 0 ? (
          <EmptyState
            message={
              hasFilter
                ? "조건에 맞는 고객사가 없습니다."
                : "아직 등록된 고객사가 없습니다."
            }
            actionLabel="고객사 등록"
            actionHref="/organizations/new"
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th align="center">등급</Th>
                <Th>기관명</Th>
                <Th>유형</Th>
                <Th>업종</Th>
                <Th>상태</Th>
                <Th align="right">담당자</Th>
                <Th align="right">교육</Th>
                <Th align="right">영업건</Th>
                <Th align="right">누적 매출</Th>
                <Th>영업담당</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-surface-2">
                  <Td align="center">
                    {o.grade ? (
                      <Badge tone={GRADE_TONE[o.grade]}>{o.grade}</Badge>
                    ) : (
                      <span className="text-xs text-faint">미평가</span>
                    )}
                  </Td>
                  <Td>
                    <Link
                      href={`/organizations/${o.id}`}
                      className="font-semibold text-accent hover:underline"
                    >
                      {o.name}
                    </Link>
                    {o.shortName && (
                      <span className="ml-1.5 text-xs text-faint">
                        {o.shortName}
                      </span>
                    )}
                  </Td>
                  <Td>{o.orgType}</Td>
                  <Td>{o.industry ?? "-"}</Td>
                  <Td>
                    <Badge tone={ORG_STATUS_TONE[o.status] ?? "gray"}>
                      {o.status}
                    </Badge>
                  </Td>
                  <Td align="right" className="tnum">
                    {o._count.contacts}
                  </Td>
                  <Td align="right" className="tnum">
                    {o._count.trainings}
                  </Td>
                  <Td align="right" className="tnum">
                    {o._count.deals}
                  </Td>
                  <Td align="right" className="tnum font-semibold">
                    {o.revenue > 0 ? formatKRWShort(o.revenue) : "-"}
                  </Td>
                  <Td>{o.ownerName ?? "-"}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  );
}
