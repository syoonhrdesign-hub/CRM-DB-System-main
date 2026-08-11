import Link from "next/link";
import { notFound } from "next/navigation";
import { ACTIVITY_TYPE_TONE, CONTACT_STATUS_TONE } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import {
  Badge,
  Card,
  DefItem,
  DefList,
  EmptyState,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contact = await db.contact.findUnique({
    where: { id },
    include: {
      organization: { select: { id: true, name: true } },
      businessCards: { orderBy: { receivedAt: "desc" } },
      successor: { select: { id: true, name: true, department: true, position: true } },
      predecessor: {
        select: { id: true, name: true, department: true, position: true },
      },
      activities: {
        orderBy: { occurredAt: "desc" },
        take: 10,
      },
      deals: { orderBy: { updatedAt: "desc" }, take: 10 },
    },
  });

  if (!contact) notFound();

  const cards = contact.businessCards;

  // 명함이 여러 장이면 직함·소속이 어떻게 바뀌었는지 비교해 보여 준다.
  const changes: string[] = [];
  for (let i = 0; i < cards.length - 1; i++) {
    const newer = cards[i];
    const older = cards[i + 1];
    if (newer.companyName && older.companyName && newer.companyName !== older.companyName) {
      changes.push(`${older.companyName} → ${newer.companyName} (${formatDate(newer.receivedAt)})`);
    } else if (newer.position && older.position && newer.position !== older.position) {
      changes.push(`${older.position} → ${newer.position} (${formatDate(newer.receivedAt)})`);
    }
  }

  return (
    <>
      <div className="mb-6">
        <Link
          href={`/organizations/${contact.organization.id}`}
          className="text-sm text-muted hover:underline"
        >
          ← {contact.organization.name}
        </Link>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{contact.name}</h1>
              {contact.isPrimary && <Badge tone="blue">대표</Badge>}
              <Badge tone={CONTACT_STATUS_TONE[contact.status] ?? "gray"}>
                {contact.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {[contact.department, contact.position].filter(Boolean).join(" · ") ||
                "부서·직급 미입력"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={`/contacts/${contact.id}/edit`} className="btn btn-secondary">
              정보 수정
            </Link>
            <Link
              href={`/contacts/${contact.id}/cards/new`}
              className="btn btn-primary"
            >
              + 명함 등록
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid gap-6 lg:col-span-1">
          <Card title="연락처">
            <DefList>
              <DefItem label="휴대폰">{contact.mobile ?? "-"}</DefItem>
              <DefItem label="직통">{contact.phone ?? "-"}</DefItem>
              <div className="sm:col-span-2">
                <DefItem label="이메일">{contact.email ?? "-"}</DefItem>
              </div>
              <div className="sm:col-span-2">
                <DefItem label="메모">
                  <span className="whitespace-pre-wrap">{contact.memo ?? "-"}</span>
                </DefItem>
              </div>
            </DefList>
          </Card>

          <Card title="첫 만남">
            <DefList>
              <DefItem label="처음 만난 날">{formatDate(contact.firstMetAt)}</DefItem>
              <DefItem label="경로">{contact.firstMetChannel ?? "-"}</DefItem>
              <div className="sm:col-span-2">
                <DefItem label="장소 · 행사">{contact.firstMetPlace ?? "-"}</DefItem>
              </div>
              <div className="sm:col-span-2">
                <DefItem label="소개해 준 사람">{contact.referredBy ?? "-"}</DefItem>
              </div>
            </DefList>
          </Card>

          {(contact.predecessor ||
            contact.successor ||
            contact.status !== "재직") && (
            <Card title="인수인계">
              <DefList>
                <div className="sm:col-span-2">
                  <DefItem label="전임 담당자">
                    {contact.predecessor ? (
                      <Link
                        href={`/contacts/${contact.predecessor.id}`}
                        className="text-accent hover:underline"
                      >
                        {contact.predecessor.name}
                        {contact.predecessor.position &&
                          ` ${contact.predecessor.position}`}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </DefItem>
                </div>
                <div className="sm:col-span-2">
                  <DefItem label="후임 담당자">
                    {contact.successor ? (
                      <Link
                        href={`/contacts/${contact.successor.id}`}
                        className="text-accent hover:underline"
                      >
                        {contact.successor.name}
                        {contact.successor.position && ` ${contact.successor.position}`}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </DefItem>
                </div>
                <DefItem label="담당 기간">
                  {contact.assignedFrom || contact.assignedUntil
                    ? `${formatDate(contact.assignedFrom)} ~ ${formatDate(contact.assignedUntil)}`
                    : "-"}
                </DefItem>
                <DefItem label="변경 사유">{contact.changeReason ?? "-"}</DefItem>
                <div className="sm:col-span-2">
                  <DefItem label="인계 내용">
                    <span className="whitespace-pre-wrap">
                      {contact.handoverNote ?? "-"}
                    </span>
                  </DefItem>
                </div>
              </DefList>
            </Card>
          )}
        </div>

        <div className="grid gap-6 lg:col-span-2">
          <Card
            title={`명함 이력 (${cards.length})`}
            action={
              <Link
                href={`/contacts/${contact.id}/cards/new`}
                className="text-sm font-semibold text-accent hover:underline"
              >
                + 등록
              </Link>
            }
            padded={false}
          >
            {cards.length === 0 ? (
              <EmptyState
                message="등록된 명함이 없습니다."
                actionLabel="명함 등록"
                actionHref={`/contacts/${contact.id}/cards/new`}
              />
            ) : (
              <>
                {changes.length > 0 && (
                  <div className="border-b border-line bg-surface-2 px-4 py-2.5">
                    <p className="text-xs font-semibold text-faint">변동 이력</p>
                    <ul className="mt-1 grid gap-0.5">
                      {changes.map((c) => (
                        <li key={c} className="text-sm">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <ol className="divide-y divide-[var(--border)]">
                  {cards.map((card, i) => (
                    <li key={card.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tnum text-sm font-bold">
                          {formatDate(card.receivedAt)}
                        </span>
                        {i === 0 && <Badge tone="green">최신</Badge>}
                        {card.receivedChannel && (
                          <Badge>{card.receivedChannel}</Badge>
                        )}
                        <Link
                          href={`/contacts/${contact.id}/cards/${card.id}/edit`}
                          className="ml-auto text-xs text-muted hover:underline"
                        >
                          수정
                        </Link>
                      </div>

                      <p className="mt-1 text-sm">
                        {[card.companyName, card.department, card.position]
                          .filter(Boolean)
                          .join(" · ") || "내용 없음"}
                      </p>

                      <p className="mt-0.5 text-sm text-faint">
                        {[card.mobile, card.phone, card.email]
                          .filter(Boolean)
                          .join(" · ") || "연락처 없음"}
                      </p>

                      {card.receivedPlace && (
                        <p className="mt-0.5 text-xs text-muted">
                          받은 곳: {card.receivedPlace}
                        </p>
                      )}

                      {card.memo && (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                          {card.memo}
                        </p>
                      )}

                      {card.imageUrl && (
                        <a
                          href={card.imageUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-1 inline-block text-xs text-accent hover:underline"
                        >
                          명함 이미지 열기
                        </a>
                      )}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </Card>

          <Card title={`관련 영업건 (${contact.deals.length})`} padded={false}>
            {contact.deals.length === 0 ? (
              <EmptyState message="연결된 영업건이 없습니다." />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>제목</Th>
                    <Th>단계</Th>
                    <Th align="right">예상 매출</Th>
                  </tr>
                </thead>
                <tbody>
                  {contact.deals.map((d) => (
                    <tr key={d.id} className="hover:bg-surface-2">
                      <Td>
                        <Link
                          href={`/deals/${d.id}/edit`}
                          className="text-accent hover:underline"
                        >
                          {d.title}
                        </Link>
                      </Td>
                      <Td>{d.stage}</Td>
                      <Td align="right" className="tnum">
                        {d.expectedAmount.toLocaleString("ko-KR")}원
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Card>

          <Card title="최근 활동" padded={false}>
            {contact.activities.length === 0 ? (
              <EmptyState message="이 담당자와의 활동 기록이 없습니다." />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {contact.activities.map((a) => (
                  <li key={a.id} className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={ACTIVITY_TYPE_TONE[a.type] ?? "gray"}>
                        {a.type}
                      </Badge>
                      <Link
                        href={`/activities/${a.id}/edit`}
                        className="text-sm font-medium hover:underline"
                      >
                        {a.summary}
                      </Link>
                      <span className="tnum ml-auto text-xs text-faint">
                        {formatDate(a.occurredAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
