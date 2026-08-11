import type { AccountProfile } from "@prisma/client";
import Link from "next/link";
import { EXPANSION_TONE } from "@/lib/constants";
import { formatMonths, parseMonths } from "@/lib/agenda";
import {
  GRADE_AXES,
  GRADE_DESCRIPTION,
  contactCycleWeeks,
  type GradeResult,
} from "@/lib/grade";
import { GradeChip } from "./grade-chip";
import { LIFECYCLE_ACTION, LIFECYCLE_STAGES, LIFECYCLE_TONE } from "@/lib/lifecycle";
import type { LifecycleStage } from "@/lib/lifecycle";
import { formatKRWShort } from "@/lib/format";
import { profileCompleteness } from "@/lib/profile";
import { Badge, Card, DefItem, DefList } from "./ui";

/* -------------------------------------------------------------------------- */
/*  등급 카드                                                                   */
/* -------------------------------------------------------------------------- */

export function GradeCard({
  organizationId,
  result,
  scores,
  cycleOverride,
  gradeMemo,
}: {
  organizationId: string;
  result: GradeResult;
  scores: Record<string, number | null>;
  cycleOverride: number | null;
  gradeMemo: string | null;
}) {
  const cycle = contactCycleWeeks(result.grade, cycleOverride);

  return (
    <Card
      title="고객사 등급"
      action={
        <Link
          href={`/organizations/${organizationId}/grade`}
          className="text-sm font-semibold text-accent hover:underline"
        >
          평가하기
        </Link>
      }
    >
      {result.grade == null ? (
        <p className="text-sm text-muted">
          아직 평가하지 않았습니다.{" "}
          <Link
            href={`/organizations/${organizationId}/grade`}
            className="text-accent hover:underline"
          >
            5개 축을 평가
          </Link>
          하면 등급과 접촉 주기가 정해집니다.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <GradeChip grade={result.grade} size="lg" />
            <div className="min-w-0">
              <p className="text-sm">{GRADE_DESCRIPTION[result.grade]}</p>
              <p className="tnum mt-0.5 text-xs text-faint">
                가중 평균 {result.score ?? "-"}점 · {result.ratedCount}/
                {GRADE_AXES.length}개 축 평가
                {result.isOverridden && " · 수동 지정"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {GRADE_AXES.map((axis) => {
              const value = scores[axis.key];
              return (
                <div key={axis.key} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-xs text-muted">
                    {axis.label}
                  </span>
                  <span className="flex gap-0.5" aria-label={`${value ?? 0}점`}>
                    {[1, 2, 3, 4, 5].map((p) => (
                      <span
                        key={p}
                        className={`h-1.5 w-5 rounded-sm ${
                          value != null && p <= value
                            ? "bg-accent"
                            : "bg-[var(--border)]"
                        }`}
                      />
                    ))}
                  </span>
                  <span className="tnum w-8 text-right text-xs text-faint">
                    {value ?? "-"}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="tnum mt-4 border-t border-line pt-3 text-sm">
            접촉 주기{" "}
            <strong>{cycle}주</strong>
            <span className="text-faint">
              {cycleOverride ? " (직접 지정)" : " (등급 기본값)"}
            </span>
          </p>

          {gradeMemo && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{gradeMemo}</p>
          )}
        </>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  생애주기                                                                    */
/* -------------------------------------------------------------------------- */

export function LifecycleCard({
  stage,
  monthsSinceLast,
  dealCount,
}: {
  stage: LifecycleStage;
  monthsSinceLast: number | null;
  dealCount: number;
}) {
  // 정상 흐름 4단계를 스텝으로 보여 주고, 이탈위험·휴면은 별도 경고로 표시한다.
  const flow = LIFECYCLE_STAGES.slice(0, 4);
  const isWarning = stage === "이탈위험" || stage === "휴면";
  const activeIndex = flow.indexOf(stage as (typeof flow)[number]);

  return (
    <Card title="생애주기">
      <div className="flex gap-1">
        {flow.map((s, i) => (
          <div key={s} className="min-w-0 flex-1">
            <div
              className={`h-1.5 rounded-full ${
                !isWarning && i <= activeIndex ? "bg-accent" : "bg-[var(--border)]"
              }`}
            />
            <p
              className={`mt-1 truncate text-center text-xs ${
                !isWarning && i === activeIndex
                  ? "font-bold text-accent"
                  : "text-faint"
              }`}
            >
              {s}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone={LIFECYCLE_TONE[stage]}>{stage}</Badge>
        <span className="tnum text-xs text-faint">
          완료 거래 {dealCount}건
          {monthsSinceLast != null && ` · 마지막 거래 ${monthsSinceLast}개월 전`}
        </span>
      </div>

      <p className="mt-2 text-sm text-muted">{LIFECYCLE_ACTION[stage]}</p>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  기업 프로파일                                                               */
/* -------------------------------------------------------------------------- */

export function ProfileCard({
  organizationId,
  profile,
}: {
  organizationId: string;
  profile: AccountProfile | null;
}) {
  const c = profileCompleteness(profile);

  return (
    <Card
      title="기업 프로파일"
      action={
        <Link
          href={`/organizations/${organizationId}/profile`}
          className="text-sm font-semibold text-accent hover:underline"
        >
          {profile ? "수정" : "작성"}
        </Link>
      }
    >
      <div className="mb-4">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-semibold text-muted">파악 정도</span>
          <span className="tnum font-bold">
            {c.filled}/{c.total} ({c.percent}%)
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${c.percent}%` }}
          />
        </div>
      </div>

      <DefList>
        <DefItem label="인력 구성">
          {profile?.workforceType
            ? profile.fieldRatio != null
              ? `${profile.workforceType} (현장직 ${profile.fieldRatio}%)`
              : profile.workforceType
            : "-"}
        </DefItem>
        <DefItem label="HR 조직">
          {profile?.hrStructure
            ? profile.hrHeadcount != null
              ? `${profile.hrStructure} (${profile.hrHeadcount}명)`
              : profile.hrStructure
            : "-"}
        </DefItem>

        <DefItem label="예산 편성월">
          {profile?.budgetMonth ? `${profile.budgetMonth}월` : "-"}
        </DefItem>
        <DefItem label="예산 규모">
          {profile?.budgetScale ? formatKRWShort(profile.budgetScale) : "-"}
        </DefItem>

        <DefItem label="채용 시즌">
          {formatMonths(parseMonths(profile?.hiringMonths))}
        </DefItem>
        <DefItem label="교육 시즌">
          {formatMonths(parseMonths(profile?.trainingMonths))}
        </DefItem>

        <div className="sm:col-span-2">
          <DefItem label="의사결정 구조">{profile?.decisionProcess ?? "-"}</DefItem>
        </div>

        <div className="sm:col-span-2">
          <DefItem label="정기 교육">
            <span className="whitespace-pre-wrap">
              {profile?.regularPrograms ?? "-"}
            </span>
          </DefItem>
        </div>

        <div className="sm:col-span-2">
          <DefItem label="조직문화 활동">
            <span className="whitespace-pre-wrap">
              {profile?.cultureActivities ?? "-"}
            </span>
          </DefItem>
        </div>

        <DefItem label="타 부서 확장">
          {profile?.expansionLevel ? (
            <span className="inline-flex items-center gap-1.5">
              <Badge tone={EXPANSION_TONE[profile.expansionLevel] ?? "gray"}>
                {profile.expansionLevel}
              </Badge>
              {profile.expansionDepartments}
            </span>
          ) : (
            "-"
          )}
        </DefItem>
        <DefItem label="기존 거래 업체">{profile?.competitors ?? "-"}</DefItem>
      </DefList>

      {c.missing.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-xs font-semibold text-faint">
            다음 통화에서 확인할 것 ({c.missing.length})
          </p>
          <ul className="mt-1.5 grid gap-1">
            {c.missing.slice(0, 4).map((item) => (
              <li key={String(item.key)} className="text-sm text-muted">
                · {item.question}
              </li>
            ))}
            {c.missing.length > 4 && (
              <li className="text-xs text-faint">
                외 {c.missing.length - 4}개 —{" "}
                <Link
                  href={`/organizations/${organizationId}/profile`}
                  className="text-accent hover:underline"
                >
                  전체 보기
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </Card>
  );
}
