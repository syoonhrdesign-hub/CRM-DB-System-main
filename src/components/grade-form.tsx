import type { Organization } from "@prisma/client";
import Link from "next/link";
import {
  GRADE_AXES,
  GRADE_CONTACT_CYCLE_WEEKS,
  GRADES,
  calculateGrade,
  suggestPurchaseScore,
} from "@/lib/grade";
import { SubmitButton } from "./buttons";
import { Field, FormActions, Select, Textarea, TextInput } from "./form";

/**
 * 등급 평가 폼.
 *
 * 각 축마다 1~5점의 뜻을 문장으로 보여 준다. "3점"이 사람마다 다르게 해석되면
 * 등급은 아무 의미가 없기 때문에, 기준을 화면에 붙여 둔다.
 */
export function GradeForm({
  action,
  organization,
  completedTrainings,
}: {
  action: (fd: FormData) => Promise<void>;
  organization: Organization;
  completedTrainings: { startDate: Date }[];
}) {
  const current = calculateGrade(organization, organization.gradeOverride);
  const suggestion = suggestPurchaseScore(completedTrainings);

  return (
    <form action={action}>
      <div className="grid gap-5">
        {GRADE_AXES.map((axis) => {
          const value = organization[axis.key];
          return (
            <fieldset key={axis.key} className="rounded-lg border border-line p-4">
              <legend className="px-1.5 text-sm font-bold">
                {axis.label}
                <span className="ml-1.5 text-xs font-normal text-faint">
                  가중치 {Math.round(axis.weight * 100)}%
                </span>
              </legend>

              <p className="mb-3 text-xs text-muted">{axis.hint}</p>

              {axis.key === "scorePurchase" && (
                <p className="mb-3 rounded-md bg-accent-soft px-2.5 py-1.5 text-xs text-accent">
                  실적 기반 참고값: <strong>{suggestion.score}점</strong> (
                  {suggestion.reason})
                </p>
              )}

              <div className="grid gap-1.5">
                {axis.levels.map((levelText, i) => {
                  const point = i + 1;
                  const id = `${axis.key}-${point}`;
                  return (
                    <label
                      key={point}
                      htmlFor={id}
                      className="flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-surface-2"
                    >
                      <input
                        id={id}
                        type="radio"
                        name={axis.key}
                        value={point}
                        defaultChecked={value === point}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
                      />
                      <span className="tnum w-4 shrink-0 font-bold text-faint">
                        {point}
                      </span>
                      <span>{levelText}</span>
                    </label>
                  );
                })}

                <label
                  htmlFor={`${axis.key}-none`}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-faint hover:bg-surface-2"
                >
                  <input
                    id={`${axis.key}-none`}
                    type="radio"
                    name={axis.key}
                    value=""
                    defaultChecked={value == null}
                    className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                  />
                  <span className="w-4 shrink-0" />
                  <span>아직 판단 못 함 (평균 계산에서 제외)</span>
                </label>
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field
          label="등급 직접 지정"
          htmlFor="gradeOverride"
          hint={
            current.computedGrade
              ? `점수로 계산한 등급은 ${current.computedGrade} 입니다. 비워 두면 계산값을 씁니다.`
              : "비워 두면 점수로 계산한 등급을 씁니다."
          }
        >
          <Select
            name="gradeOverride"
            options={[...GRADES]}
            defaultValue={organization.gradeOverride}
            placeholder="계산값 사용"
          />
        </Field>

        <Field
          label="접촉 주기 (주)"
          htmlFor="contactCycleWeeks"
          hint={`비워 두면 등급별 기본값 (S ${GRADE_CONTACT_CYCLE_WEEKS.S}주 / A ${GRADE_CONTACT_CYCLE_WEEKS.A}주 / B ${GRADE_CONTACT_CYCLE_WEEKS.B}주 / C ${GRADE_CONTACT_CYCLE_WEEKS.C}주 / D ${GRADE_CONTACT_CYCLE_WEEKS.D}주)`}
        >
          <TextInput
            name="contactCycleWeeks"
            type="number"
            min={1}
            max={52}
            defaultValue={organization.contactCycleWeeks}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="평가 근거 메모" htmlFor="gradeMemo">
            <Textarea
              name="gradeMemo"
              defaultValue={organization.gradeMemo}
              placeholder="왜 이 등급으로 봤는지, 다음 평가 때 무엇을 다시 확인할지"
            />
          </Field>
        </div>
      </div>

      <FormActions>
        <SubmitButton>등급 저장</SubmitButton>
        <Link href={`/organizations/${organization.id}`} className="btn btn-secondary">
          취소
        </Link>
      </FormActions>
    </form>
  );
}
