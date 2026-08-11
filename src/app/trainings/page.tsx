import Link from "next/link";
import { TRAINING_STATUS_TONE, TRAINING_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDate, formatKRW, formatKRWShort } from "@/lib/format";
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

export default async function TrainingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; year?: string }>;
}) {
  const { q = "", status = "", year = "" } = await searchParams;

  const yearNum = Number.parseInt(year, 10);
  const hasYear = Number.isFinite(yearNum);

  const trainings = await db.training.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(hasYear
        ? {
            startDate: {
              gte: new Date(Date.UTC(yearNum, 0, 1)),
              lt: new Date(Date.UTC(yearNum + 1, 0, 1)),
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { instructor: { contains: q } },
              { organization: { name: { contains: q } } },
              { course: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    orderBy: { startDate: "desc" },
    include: {
      organization: { select: { id: true, name: true } },
      course: { select: { name: true } },
    },
  });

  const completed = trainings.filter((t) => t.status === "완료");
  const revenue = completed.reduce((s, t) => s + t.totalAmount, 0);
  const trainees = completed.reduce((s, t) => s + t.headcount, 0);

  // 연도 목록은 필터와 무관하게 전체에서 뽑는다.
  // (필터 결과에서 뽑으면 2025년을 고른 순간 다른 연도가 목록에서 사라진다)
  const allDates = await db.training.findMany({ select: { startDate: true } });
  const years = Array.from(
    new Set(allDates.map((t) => t.startDate.getUTCFullYear())),
  ).sort((a, b) => b - a);

  const hasFilter = Boolean(q || status || year);

  return (
    <>
      <PageHeader
        title="교육 진행"
        description={`${trainings.length}건 · 완료 기준 매출 ${formatKRWShort(revenue)} · 수료 ${trainees.toLocaleString("ko-KR")}명`}
        action={
          <Link href="/trainings/new" className="btn btn-primary">
            + 교육 등록
          </Link>
        }
      />

      <form className="mb-4 flex flex-wrap gap-2" action="/trainings">
        <input
          name="q"
          defaultValue={q}
          placeholder="교육명 · 기관명 · 강사 검색"
          className="input max-w-xs"
        />
        <select name="status" defaultValue={status} className="select max-w-40">
          <option value="">전체 상태</option>
          {TRAINING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="year" defaultValue={year} className="select max-w-32">
          <option value="">전체 연도</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-secondary">
          검색
        </button>
        {hasFilter && (
          <Link href="/trainings" className="btn btn-secondary">
            초기화
          </Link>
        )}
      </form>

      <Card padded={false}>
        {trainings.length === 0 ? (
          <EmptyState
            message={
              hasFilter
                ? "조건에 맞는 교육이 없습니다."
                : "등록된 교육이 없습니다."
            }
            actionLabel="교육 등록"
            actionHref="/trainings/new"
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>일자</Th>
                <Th>고객사</Th>
                <Th>교육명</Th>
                <Th>과정</Th>
                <Th align="right">인원</Th>
                <Th align="right">금액</Th>
                <Th>강사</Th>
                <Th align="right">만족도</Th>
                <Th>상태</Th>
              </tr>
            </thead>
            <tbody>
              {trainings.map((t) => (
                <tr key={t.id} className="hover:bg-surface-2">
                  <Td className="tnum whitespace-nowrap">
                    {formatDate(t.startDate)}
                  </Td>
                  <Td>
                    <Link
                      href={`/organizations/${t.organization.id}`}
                      className="hover:underline"
                    >
                      {t.organization.name}
                    </Link>
                  </Td>
                  <Td>
                    <Link
                      href={`/trainings/${t.id}/edit`}
                      className="font-semibold text-accent hover:underline"
                    >
                      {t.title}
                    </Link>
                  </Td>
                  <Td>{t.course?.name ?? "-"}</Td>
                  <Td align="right" className="tnum">
                    {t.headcount}
                  </Td>
                  <Td align="right" className="tnum">
                    {formatKRW(t.totalAmount)}
                  </Td>
                  <Td>{t.instructor ?? "-"}</Td>
                  <Td align="right" className="tnum">
                    {t.satisfaction ? t.satisfaction.toFixed(1) : "-"}
                  </Td>
                  <Td>
                    <Badge tone={TRAINING_STATUS_TONE[t.status] ?? "gray"}>
                      {t.status}
                    </Badge>
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
