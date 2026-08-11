import type { AccountProfile } from "@prisma/client";
import Link from "next/link";
import {
  BUDGET_CYCLES,
  EXPANSION_LEVELS,
  MONTHS,
  WORKFORCE_TYPES,
} from "@/lib/constants";
import { parseMonths } from "@/lib/agenda";
import { SubmitButton } from "./buttons";
import { Field, FormActions, FormGrid, Select, Textarea, TextInput } from "./form";

/** 월 다중 선택 — "3,9" 문자열로 저장된다. */
function MonthPicker({
  name,
  selected,
}: {
  name: string;
  selected: number[];
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {MONTHS.map((m) => {
        const id = `${name}-${m}`;
        return (
          <label
            key={m}
            htmlFor={id}
            className="relative cursor-pointer select-none"
          >
            <input
              id={id}
              type="checkbox"
              name={name}
              value={m}
              defaultChecked={selected.includes(m)}
              className="peer sr-only"
            />
            <span className="tnum block rounded-md border border-line-strong px-2.5 py-1 text-xs text-muted peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
              {m}월
            </span>
          </label>
        );
      })}
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="mt-2 border-b border-line pb-1.5 text-sm font-bold sm:col-span-2">
      {children}
    </h3>
  );
}

export function ProfileForm({
  action,
  profile,
  organizationName,
  organizationId,
}: {
  action: (fd: FormData) => Promise<void>;
  profile: AccountProfile | null;
  organizationName: string;
  organizationId: string;
}) {
  return (
    <form action={action}>
      <FormGrid>
        <SectionTitle>조직 구조</SectionTitle>

        <Field
          label="인력 구성"
          htmlFor="workforceType"
          hint="현장직이 많으면 교대조 편성이나 온라인 과정이 필요합니다."
        >
          <Select
            name="workforceType"
            options={WORKFORCE_TYPES}
            defaultValue={profile?.workforceType}
            placeholder="파악 안 됨"
          />
        </Field>

        <Field label="현장직 비율 (%)" htmlFor="fieldRatio">
          <TextInput
            name="fieldRatio"
            type="number"
            min={0}
            max={100}
            defaultValue={profile?.fieldRatio}
          />
        </Field>

        <Field
          label="HR 조직 구조"
          htmlFor="hrStructure"
          hint="인재개발원 별도 / 인사팀 내 교육파트 / 전담 없음"
        >
          <TextInput name="hrStructure" defaultValue={profile?.hrStructure} />
        </Field>

        <Field label="교육 담당 인원" htmlFor="hrHeadcount">
          <TextInput
            name="hrHeadcount"
            type="number"
            min={0}
            defaultValue={profile?.hrHeadcount}
          />
        </Field>

        <Field
          label="의사결정 구조"
          htmlFor="decisionProcess"
          span={2}
          hint="어느 선까지 결재가 올라가는지 — 제안 대상과 자료 수준이 달라집니다."
        >
          <TextInput
            name="decisionProcess"
            defaultValue={profile?.decisionProcess}
            placeholder="예: 실무자 검토 → 팀장 전결 (3천만원 초과 시 임원 보고)"
          />
        </Field>

        <SectionTitle>예산</SectionTitle>

        <Field
          label="예산 편성 월"
          htmlFor="budgetMonth"
          hint="다음 해 예산을 짜는 달. 제안 타이밍의 핵심입니다."
        >
          <Select
            name="budgetMonth"
            options={MONTHS.map((m) => ({ value: String(m), label: `${m}월` }))}
            defaultValue={profile?.budgetMonth ? String(profile.budgetMonth) : null}
            placeholder="파악 안 됨"
          />
        </Field>

        <Field label="회계연도 시작 월" htmlFor="fiscalStartMonth">
          <Select
            name="fiscalStartMonth"
            options={MONTHS.map((m) => ({ value: String(m), label: `${m}월` }))}
            defaultValue={
              profile?.fiscalStartMonth ? String(profile.fiscalStartMonth) : null
            }
            placeholder="파악 안 됨"
          />
        </Field>

        <Field label="예산 확정 주기" htmlFor="budgetCycle">
          <Select
            name="budgetCycle"
            options={BUDGET_CYCLES}
            defaultValue={profile?.budgetCycle}
            placeholder="파악 안 됨"
          />
        </Field>

        <Field label="연간 교육 예산 (원)" htmlFor="budgetScale">
          <TextInput
            name="budgetScale"
            type="number"
            min={0}
            defaultValue={profile?.budgetScale}
          />
        </Field>

        <Field label="예산 관련 메모" htmlFor="budgetNote" span={2}>
          <TextInput
            name="budgetNote"
            defaultValue={profile?.budgetNote}
            placeholder="예: 11월에 초안, 12월 확정. 이월 예산은 2월까지 집행 가능."
          />
        </Field>

        <SectionTitle>시즌</SectionTitle>

        <Field label="채용 시즌" htmlFor="hiringMonths" span={2}>
          <MonthPicker
            name="hiringMonths"
            selected={parseMonths(profile?.hiringMonths)}
          />
        </Field>

        <Field label="채용 관련 메모" htmlFor="hiringNote" span={2}>
          <TextInput
            name="hiringNote"
            defaultValue={profile?.hiringNote}
            placeholder="예: 3월 공채 200명, 9월 경력 수시"
          />
        </Field>

        <Field label="교육 집중 시즌" htmlFor="trainingMonths" span={2}>
          <MonthPicker
            name="trainingMonths"
            selected={parseMonths(profile?.trainingMonths)}
          />
        </Field>

        <Field label="시즌별 교육 내용" htmlFor="trainingNote" span={2}>
          <TextInput
            name="trainingNote"
            defaultValue={profile?.trainingNote}
            placeholder="예: 3~4월 신입 입문, 10~11월 승진자 과정"
          />
        </Field>

        <SectionTitle>교육 · 문화</SectionTitle>

        <Field label="정기 교육" htmlFor="regularPrograms" span={2}>
          <Textarea
            name="regularPrograms"
            defaultValue={profile?.regularPrograms}
            placeholder="매년 반복하는 교육 — 신입 입문, 승진자 과정, 법정의무교육 등"
          />
        </Field>

        <Field label="조직문화 활동" htmlFor="cultureActivities" span={2}>
          <Textarea
            name="cultureActivities"
            defaultValue={profile?.cultureActivities}
            placeholder="워크숍, 타운홀, 조직문화 진단 서베이 등"
          />
        </Field>

        <Field
          label="기존 거래 업체 · 경쟁사"
          htmlFor="competitors"
          span={2}
        >
          <TextInput name="competitors" defaultValue={profile?.competitors} />
        </Field>

        <SectionTitle>확장 가능성</SectionTitle>

        <Field label="타 부서 확장 가능성" htmlFor="expansionLevel">
          <Select
            name="expansionLevel"
            options={EXPANSION_LEVELS}
            defaultValue={profile?.expansionLevel}
            placeholder="파악 안 됨"
          />
        </Field>

        <Field
          label="확장 가능 부서"
          htmlFor="expansionDepartments"
          hint="담당자가 소개해 줄 수 있는 부서"
        >
          <TextInput
            name="expansionDepartments"
            defaultValue={profile?.expansionDepartments}
            placeholder="예: 영업본부, 생산기술팀"
          />
        </Field>

        <Field label="기타 메모" htmlFor="notes" span={2}>
          <Textarea name="notes" defaultValue={profile?.notes} />
        </Field>
      </FormGrid>

      <FormActions>
        <SubmitButton>프로파일 저장</SubmitButton>
        <Link href={`/organizations/${organizationId}`} className="btn btn-secondary">
          취소
        </Link>
        <span className="text-xs text-faint">{organizationName}</span>
      </FormActions>
    </form>
  );
}
