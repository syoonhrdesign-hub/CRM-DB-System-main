import Link from "next/link";
import { ACTIVITY_TYPE_TONE, ACTIVITY_TYPES } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
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

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; todo?: string }>;
}) {
  const { q = "", type = "", todo = "" } = await searchParams;

  const activities = await db.activity.findMany({
    where: {
      ...(type ? { type } : {}),
      // 미완료 후속조치만 보기
      ...(todo === "1" ? { isDone: false, nextAction: { not: null } } : {}),
      ...(q
        ? {
            OR: [
              { summary: { contains: q } },
              { content: { contains: q } },
              { nextAction: { contains: q } },
              { ownerName: { contains: q } },
              { organization: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    orderBy: { occurredAt: "desc" },
    take: 300,
    include: {
      organization: { select: { id: true, name: true } },
      contact: { select: { name: true } },
    },
  });

  const hasFilter = Boolean(q || type || todo);

  return (
    <>
      <PageHeader
        title="활동 기록"
        description={`${activities.length}건${activities.length === 300 ? " (최근 300건)" : ""}`}
        action={
          <Link href="/activities/new" className="btn btn-primary">
            + 활동 기록
          </Link>
        }
      />

      <form className="mb-4 flex flex-wrap gap-2" action="/activities">
        <input
          name="q"
          defaultValue={q}
          placeholder="요약 · 내용 · 기관명 검색"
          className="input max-w-xs"
        />
        <select name="type" defaultValue={type} className="select max-w-40">
          <option value="">전체 유형</option>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select name="todo" defaultValue={todo} className="select max-w-44">
          <option value="">전체</option>
          <option value="1">미완료 후속조치만</option>
        </select>
        <button type="submit" className="btn btn-secondary">
          검색
        </button>
        {hasFilter && (
          <Link href="/activities" className="btn btn-secondary">
            초기화
          </Link>
        )}
      </form>

      <Card padded={false}>
        {activities.length === 0 ? (
          <EmptyState
            message={hasFilter ? "조건에 맞는 활동이 없습니다." : "기록된 활동이 없습니다."}
            actionLabel="활동 기록"
            actionHref="/activities/new"
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>일자</Th>
                <Th>유형</Th>
                <Th>고객사</Th>
                <Th>담당자</Th>
                <Th>요약</Th>
                <Th>후속 조치</Th>
                <Th>기록자</Th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => (
                <tr key={a.id} className="hover:bg-surface-2">
                  <Td className="tnum whitespace-nowrap">
                    {formatDate(a.occurredAt)}
                  </Td>
                  <Td>
                    <Badge tone={ACTIVITY_TYPE_TONE[a.type] ?? "gray"}>
                      {a.type}
                    </Badge>
                  </Td>
                  <Td>
                    <Link
                      href={`/organizations/${a.organization.id}`}
                      className="hover:underline"
                    >
                      {a.organization.name}
                    </Link>
                  </Td>
                  <Td>{a.contact?.name ?? "-"}</Td>
                  <Td>
                    <Link
                      href={`/activities/${a.id}/edit`}
                      className="font-medium text-accent hover:underline"
                    >
                      {a.summary}
                    </Link>
                  </Td>
                  <Td>
                    {a.nextAction ? (
                      <span className={a.isDone ? "text-faint line-through" : ""}>
                        {a.nextAction}
                        {a.nextActionDate && (
                          <span className="tnum text-faint">
                            {" "}
                            ({formatDate(a.nextActionDate)})
                          </span>
                        )}
                      </span>
                    ) : (
                      "-"
                    )}
                  </Td>
                  <Td>{a.ownerName ?? "-"}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  );
}
