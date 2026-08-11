import Link from "next/link";
import { db } from "@/lib/db";
import { formatKRW } from "@/lib/format";
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

export default async function CoursesPage() {
  const courses = await db.course.findMany({
    orderBy: [{ isActive: "desc" }, { category: "asc" }, { code: "asc" }],
    include: {
      trainings: {
        where: { status: "완료" },
        select: { headcount: true, totalAmount: true, satisfaction: true },
      },
    },
  });

  const rows = courses.map((c) => {
    const rated = c.trainings.filter((t) => t.satisfaction != null);
    return {
      ...c,
      runCount: c.trainings.length,
      trainees: c.trainings.reduce((s, t) => s + t.headcount, 0),
      revenue: c.trainings.reduce((s, t) => s + t.totalAmount, 0),
      avgSatisfaction:
        rated.length > 0
          ? rated.reduce((s, t) => s + (t.satisfaction ?? 0), 0) / rated.length
          : null,
    };
  });

  return (
    <>
      <PageHeader
        title="교육 과정"
        description={`총 ${rows.length}개 과정 · 운영 중 ${rows.filter((c) => c.isActive).length}개`}
        action={
          <Link href="/courses/new" className="btn btn-primary">
            + 과정 등록
          </Link>
        }
      />

      <Card padded={false}>
        {rows.length === 0 ? (
          <EmptyState
            message="등록된 교육 과정이 없습니다."
            actionLabel="과정 등록"
            actionHref="/courses/new"
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>코드</Th>
                <Th>과정명</Th>
                <Th>분류</Th>
                <Th>형태</Th>
                <Th align="right">시수</Th>
                <Th align="right">기본 단가</Th>
                <Th align="right">운영 횟수</Th>
                <Th align="right">누적 인원</Th>
                <Th align="right">만족도</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className={`hover:bg-surface-2 ${c.isActive ? "" : "opacity-50"}`}
                >
                  <Td className="tnum whitespace-nowrap">{c.code}</Td>
                  <Td>
                    <Link
                      href={`/courses/${c.id}/edit`}
                      className="font-semibold text-accent hover:underline"
                    >
                      {c.name}
                    </Link>
                    {!c.isActive && (
                      <span className="ml-1.5 text-xs text-faint">(중단)</span>
                    )}
                  </Td>
                  <Td>
                    <Badge>{c.category}</Badge>
                  </Td>
                  <Td>{c.format}</Td>
                  <Td align="right" className="tnum">
                    {c.durationHours}h
                  </Td>
                  <Td align="right" className="tnum">
                    {formatKRW(c.defaultPrice)}
                  </Td>
                  <Td align="right" className="tnum">
                    {c.runCount}
                  </Td>
                  <Td align="right" className="tnum">
                    {c.trainees.toLocaleString("ko-KR")}
                  </Td>
                  <Td align="right" className="tnum">
                    {c.avgSatisfaction ? c.avgSatisfaction.toFixed(1) : "-"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  );
}
