import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ACTIVITY_TYPE_TONE,
  CONTACT_STATUS_TONE,
  DEAL_STAGE_TONE,
  ORG_STATUS_TONE,
  TRAINING_STATUS_TONE,
} from "@/lib/constants";
import { db } from "@/lib/db";
import { formatBizRegNo, formatDate, formatKRW, formatKRWShort } from "@/lib/format";
import { calculateGrade } from "@/lib/grade";
import { GradeChip } from "@/components/grade-chip";
import { LIFECYCLE_TONE, calculateLifecycle } from "@/lib/lifecycle";
import { GradeCard, LifecycleCard, ProfileCard } from "@/components/org-intel";
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

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const org = await db.organization.findUnique({
    where: { id },
    include: {
      profile: true,
      contacts: {
        orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
        include: {
          successor: { select: { id: true, name: true } },
          _count: { select: { businessCards: true } },
        },
      },
      trainings: {
        orderBy: { startDate: "desc" },
        include: { course: { select: { name: true, category: true } } },
      },
      deals: { orderBy: { updatedAt: "desc" } },
      activities: {
        orderBy: { occurredAt: "desc" },
        take: 20,
        include: { contact: { select: { name: true } } },
      },
    },
  });

  if (!org) notFound();

  const completed = org.trainings.filter((t) => t.status === "완료");
  const totalRevenue = completed.reduce((s, t) => s + t.totalAmount, 0);
  const totalTrainees = completed.reduce((s, t) => s + t.headcount, 0);

  const rated = completed.filter((t) => t.satisfaction != null);
  const avgSatisfaction =
    rated.length > 0
      ? rated.reduce((s, t) => s + (t.satisfaction ?? 0), 0) / rated.length
      : null;

  const openDeals = org.deals.filter(
    (d) => d.stage !== "완료" && d.stage !== "실패",
  );
  const pipelineValue = openDeals.reduce((s, d) => s + d.expectedAmount, 0);

  const grade = calculateGrade(org, org.gradeOverride);
  const lifecycle = calculateLifecycle(
    completed.map((t) => ({
      startDate: t.startDate,
      courseCategory: t.course?.category ?? null,
    })),
  );

  // 현재 창구와 지나간 담당자를 나눈다. 지나간 쪽이 곧 담당자 변경 이력이다.
  const activeContacts = org.contacts.filter((c) => c.status === "재직");
  const formerContacts = org.contacts
    .filter((c) => c.status !== "재직")
    .sort(
      (a, b) =>
        (b.assignedUntil?.getTime() ?? 0) - (a.assignedUntil?.getTime() ?? 0),
    );

  return (
    <>
      {/* 헤더 */}
      <div className="mb-6">
        <Link href="/organizations" className="text-sm text-muted hover:underline">
          ← 고객사 목록
        </Link>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
              {grade.grade && <GradeChip grade={grade.grade} />}
              <Badge tone={LIFECYCLE_TONE[lifecycle.stage]}>{lifecycle.stage}</Badge>
              {/* 생애주기와 거래상태가 같은 말이면(휴면 등) 한 번만 보여 준다 */}
              {org.status !== lifecycle.stage && (
                <Badge tone={ORG_STATUS_TONE[org.status] ?? "gray"}>
                  {org.status}
                </Badge>
              )}
              <Badge>{org.orgType}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {[
                org.industry,
                org.sizeTier,
                org.clientDepartment,
                org.ownerName && `사내 담당 ${org.ownerName}`,
                org.acquisitionChannel && `유입 ${org.acquisitionChannel}`,
              ]
                .filter(Boolean)
                .join(" · ") || "추가 정보 없음"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={`/organizations/${org.id}/edit`} className="btn btn-secondary">
              정보 수정
            </Link>
            <Link
              href={`/activities/new?orgId=${org.id}`}
              className="btn btn-secondary"
            >
              + 활동 기록
            </Link>
            <Link href={`/trainings/new?orgId=${org.id}`} className="btn btn-primary">
              + 교육 등록
            </Link>
          </div>
        </div>
      </div>

      {/* 요약 지표 */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="누적 매출" value={formatKRWShort(totalRevenue)} note="완료 교육 기준" />
        <StatTile label="누적 교육 인원" value={`${totalTrainees.toLocaleString("ko-KR")}명`} note={`${completed.length}개 과정 완료`} />
        <StatTile
          label="평균 만족도"
          value={avgSatisfaction ? `${avgSatisfaction.toFixed(1)} / 5` : "-"}
          note={rated.length > 0 ? `${rated.length}건 평가` : "평가 없음"}
        />
        <StatTile
          label="진행 중 영업"
          value={formatKRWShort(pipelineValue)}
          note={`${openDeals.length}건 진행 중`}
        />
      </div>

      {/* 등급 · 생애주기 — 이 고객사를 어떻게 다뤄야 하는지 먼저 보여 준다 */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <GradeCard
          organizationId={org.id}
          result={grade}
          scores={{
            scorePurchase: org.scorePurchase,
            scoreRecurring: org.scoreRecurring,
            scoreRetrain: org.scoreRetrain,
            scoreSolution: org.scoreSolution,
            scoreTrust: org.scoreTrust,
          }}
          cycleOverride={org.contactCycleWeeks}
          gradeMemo={org.gradeMemo}
        />
        <LifecycleCard
          stage={lifecycle.stage}
          monthsSinceLast={lifecycle.monthsSinceLast}
          dealCount={lifecycle.dealCount}
        />
      </div>

      <div className="mb-6">
        <ProfileCard organizationId={org.id} profile={org.profile} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 왼쪽: 기본 정보 + 담당자 */}
        <div className="grid gap-6 lg:col-span-1">
          <Card title="기본 정보">
            <DefList>
              <DefItem label="사업자등록번호">{formatBizRegNo(org.bizRegNo)}</DefItem>
              <DefItem label="최초 접촉">{formatDate(org.firstContactAt)}</DefItem>
              <DefItem label="사내 컨택 담당자">{org.ownerName ?? "-"}</DefItem>
              <DefItem label="담당 부서">{org.clientDepartment ?? "-"}</DefItem>
              <div className="sm:col-span-2">
                <DefItem label="부서 업무">{org.departmentRole ?? "-"}</DefItem>
              </div>
              <DefItem label="유입 경로">{org.acquisitionChannel ?? "-"}</DefItem>
              <DefItem label="소개해 준 곳">{org.referredBy ?? "-"}</DefItem>
              <DefItem label="임직원 수">
                {org.employeeCount ? `${org.employeeCount.toLocaleString("ko-KR")}명` : "-"}
              </DefItem>
              <DefItem label="대표 전화">{org.phone ?? "-"}</DefItem>
              <DefItem label="홈페이지">
                {org.website ? (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-accent hover:underline"
                  >
                    바로가기
                  </a>
                ) : (
                  "-"
                )}
              </DefItem>
              <div className="sm:col-span-2">
                <DefItem label="주소">{org.address ?? "-"}</DefItem>
              </div>
              <div className="sm:col-span-2">
                <DefItem label="메모">
                  <span className="whitespace-pre-wrap">{org.memo ?? "-"}</span>
                </DefItem>
              </div>
            </DefList>
          </Card>

          <Card
            title={`담당자 (${activeContacts.length})`}
            action={
              <Link
                href={`/contacts/new?orgId=${org.id}`}
                className="text-sm font-semibold text-accent hover:underline"
              >
                + 추가
              </Link>
            }
            padded={false}
          >
            {activeContacts.length === 0 ? (
              <EmptyState
                message="현재 재직 중인 담당자가 없습니다."
                actionLabel="담당자 추가"
                actionHref={`/contacts/new?orgId=${org.id}`}
              />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {activeContacts.map((c) => (
                  <li key={c.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/contacts/${c.id}`}
                        className="font-semibold hover:underline"
                      >
                        {c.name}
                      </Link>
                      {c.isPrimary && <Badge tone="blue">대표</Badge>}
                      {c._count.businessCards > 0 && (
                        <span className="tnum ml-auto text-xs text-faint">
                          명함 {c._count.businessCards}장
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted">
                      {[c.department, c.position].filter(Boolean).join(" · ") || "-"}
                    </p>
                    <p className="mt-0.5 text-sm text-faint">
                      {[c.mobile, c.phone, c.email].filter(Boolean).join(" · ") || "연락처 없음"}
                    </p>
                    {c.firstMetPlace && (
                      <p className="mt-0.5 text-xs text-faint">
                        처음 만남: {c.firstMetPlace}
                        {c.firstMetAt && ` (${formatDate(c.firstMetAt)})`}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {formerContacts.length > 0 && (
            <Card
              title={`담당자 변경 이력 (${formerContacts.length})`}
              padded={false}
            >
              <ul className="divide-y divide-[var(--border)]">
                {formerContacts.map((c) => (
                  <li key={c.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/contacts/${c.id}`}
                        className="font-semibold hover:underline"
                      >
                        {c.name}
                      </Link>
                      <Badge tone={CONTACT_STATUS_TONE[c.status] ?? "gray"}>
                        {c.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted">
                      {[c.department, c.position].filter(Boolean).join(" · ") || "-"}
                    </p>

                    <p className="tnum mt-0.5 text-xs text-faint">
                      담당 {formatDate(c.assignedFrom)} ~ {formatDate(c.assignedUntil)}
                      {c.changeReason && ` · ${c.changeReason}`}
                    </p>

                    {c.successor && (
                      <p className="mt-1 text-sm">
                        <span className="text-faint">인계 → </span>
                        <Link
                          href={`/contacts/${c.successor.id}`}
                          className="font-medium text-accent hover:underline"
                        >
                          {c.successor.name}
                        </Link>
                      </p>
                    )}

                    {c.handoverNote && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                        {c.handoverNote}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* 오른쪽: 교육 이력 / 영업건 / 활동 */}
        <div className="grid gap-6 lg:col-span-2">
          <Card
            title={`교육 진행 이력 (${org.trainings.length})`}
            action={
              <Link
                href={`/trainings/new?orgId=${org.id}`}
                className="text-sm font-semibold text-accent hover:underline"
              >
                + 추가
              </Link>
            }
            padded={false}
          >
            {org.trainings.length === 0 ? (
              <EmptyState
                message="진행한 교육이 없습니다."
                actionLabel="교육 등록"
                actionHref={`/trainings/new?orgId=${org.id}`}
              />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>교육명</Th>
                    <Th>과정</Th>
                    <Th>일자</Th>
                    <Th align="right">인원</Th>
                    <Th align="right">금액</Th>
                    <Th align="right">만족도</Th>
                    <Th>상태</Th>
                  </tr>
                </thead>
                <tbody>
                  {org.trainings.map((t) => (
                    <tr key={t.id} className="hover:bg-surface-2">
                      <Td>
                        <Link
                          href={`/trainings/${t.id}/edit`}
                          className="font-medium text-accent hover:underline"
                        >
                          {t.title}
                        </Link>
                      </Td>
                      <Td>{t.course?.name ?? "-"}</Td>
                      <Td className="tnum whitespace-nowrap">{formatDate(t.startDate)}</Td>
                      <Td align="right" className="tnum">
                        {t.headcount}
                      </Td>
                      <Td align="right" className="tnum">
                        {formatKRWShort(t.totalAmount)}
                      </Td>
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

          <Card
            title={`영업 기회 (${org.deals.length})`}
            action={
              <Link
                href={`/deals/new?orgId=${org.id}`}
                className="text-sm font-semibold text-accent hover:underline"
              >
                + 추가
              </Link>
            }
            padded={false}
          >
            {org.deals.length === 0 ? (
              <EmptyState
                message="등록된 영업 기회가 없습니다."
                actionLabel="영업건 추가"
                actionHref={`/deals/new?orgId=${org.id}`}
              />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>제목</Th>
                    <Th>단계</Th>
                    <Th align="right">예상 매출</Th>
                    <Th align="right">확률</Th>
                    <Th>예상 마감</Th>
                  </tr>
                </thead>
                <tbody>
                  {org.deals.map((d) => (
                    <tr key={d.id} className="hover:bg-surface-2">
                      <Td>
                        <Link
                          href={`/deals/${d.id}/edit`}
                          className="font-medium text-accent hover:underline"
                        >
                          {d.title}
                        </Link>
                      </Td>
                      <Td>
                        <Badge tone={DEAL_STAGE_TONE[d.stage] ?? "gray"}>
                          {d.stage}
                        </Badge>
                      </Td>
                      <Td align="right" className="tnum">
                        {formatKRW(d.expectedAmount)}
                      </Td>
                      <Td align="right" className="tnum">
                        {d.probability}%
                      </Td>
                      <Td className="tnum whitespace-nowrap">
                        {formatDate(d.expectedCloseDate)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Card>

          <Card
            title="최근 활동"
            action={
              <Link
                href={`/activities/new?orgId=${org.id}`}
                className="text-sm font-semibold text-accent hover:underline"
              >
                + 기록
              </Link>
            }
            padded={false}
          >
            {org.activities.length === 0 ? (
              <EmptyState
                message="기록된 활동이 없습니다."
                actionLabel="활동 기록"
                actionHref={`/activities/new?orgId=${org.id}`}
              />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {org.activities.map((a) => (
                  <li key={a.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={ACTIVITY_TYPE_TONE[a.type] ?? "gray"}>
                        {a.type}
                      </Badge>
                      <Link
                        href={`/activities/${a.id}/edit`}
                        className="font-medium hover:underline"
                      >
                        {a.summary}
                      </Link>
                      <span className="tnum ml-auto text-xs text-faint">
                        {formatDate(a.occurredAt)}
                      </span>
                    </div>
                    {a.content && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                        {a.content}
                      </p>
                    )}
                    {a.nextAction && (
                      <p className="mt-1 text-sm">
                        <span className="font-semibold text-accent">후속</span>{" "}
                        {a.nextAction}
                        {a.nextActionDate && (
                          <span className="tnum text-faint">
                            {" "}
                            ({formatDate(a.nextActionDate)})
                          </span>
                        )}
                        {a.isDone && <span className="ml-1 text-faint">· 완료</span>}
                      </p>
                    )}
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

function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold text-faint">{label}</p>
      <p className="tnum mt-1 text-2xl font-bold">{value}</p>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
    </div>
  );
}
