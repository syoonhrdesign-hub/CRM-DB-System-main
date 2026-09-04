import type { Training } from "@prisma/client";
import Link from "next/link";
import { TRAINING_STATUSES } from "@/lib/constants";
import { toDateInput } from "@/lib/format";
import { SubmitButton } from "./buttons";
import { OrgPicker } from "./org-picker";
import { Field, FormActions, FormGrid, Select, Textarea, TextInput } from "./form";

export function TrainingForm({
  action,
  training,
  organizations,
  courses,
  defaultOrganizationId,
}: {
  action: (fd: FormData) => Promise<void>;
  training?: Training;
  organizations: { id: string; name: string }[];
  courses: { id: string; code: string; name: string }[];
  defaultOrganizationId?: string;
}) {
  const orgId = training?.organizationId ?? defaultOrganizationId;

  return (
    <form action={action}>
      <FormGrid>
        <Field label="고객사 *" htmlFor="organizationId">
          <OrgPicker organizations={organizations} defaultValue={orgId} required />
        </Field>

        <Field
          label="교육 과정"
          htmlFor="courseId"
          hint="과정 마스터에 없는 단발성 교육이면 비워 두세요."
        >
          <Select
            name="courseId"
            options={courses.map((c) => ({
              value: c.id,
              label: `[${c.code}] ${c.name}`,
            }))}
            defaultValue={training?.courseId}
            placeholder="선택 안 함"
          />
        </Field>

        <Field
          label="교육명 (차수) *"
          htmlFor="title"
          span={2}
          hint="예: 2026년 상반기 신임팀장 과정 1차"
        >
          <TextInput name="title" required defaultValue={training?.title} />
        </Field>

        <Field label="시작일 *" htmlFor="startDate">
          <TextInput
            name="startDate"
            type="date"
            required
            defaultValue={toDateInput(training?.startDate ?? new Date())}
          />
        </Field>

        <Field label="종료일" htmlFor="endDate">
          <TextInput
            name="endDate"
            type="date"
            defaultValue={toDateInput(training?.endDate)}
          />
        </Field>

        <Field label="인원 (명)" htmlFor="headcount">
          <TextInput
            name="headcount"
            type="number"
            min={0}
            defaultValue={training?.headcount ?? 0}
          />
        </Field>

        <Field label="1인당 단가 (원)" htmlFor="pricePerHead">
          <TextInput
            name="pricePerHead"
            type="number"
            min={0}
            defaultValue={training?.pricePerHead ?? 0}
          />
        </Field>

        <Field
          label="총 계약금액 (원)"
          htmlFor="totalAmount"
          hint="비워 두면 인원 × 단가로 자동 계산합니다."
        >
          <TextInput
            name="totalAmount"
            type="number"
            min={0}
            defaultValue={training?.totalAmount}
          />
        </Field>

        <Field label="진행 상태" htmlFor="status">
          <Select
            name="status"
            options={TRAINING_STATUSES}
            defaultValue={training?.status ?? "예정"}
          />
        </Field>

        <Field label="장소" htmlFor="location">
          <TextInput
            name="location"
            defaultValue={training?.location}
            placeholder="예: 고객사 연수원 / 온라인"
          />
        </Field>

        <Field label="담당 강사" htmlFor="instructor">
          <TextInput name="instructor" defaultValue={training?.instructor} />
        </Field>

        <Field label="만족도 (5점 만점)" htmlFor="satisfaction">
          <TextInput
            name="satisfaction"
            type="number"
            step="0.1"
            min={0}
            max={5}
            defaultValue={training?.satisfaction}
          />
        </Field>

        <Field label="메모" htmlFor="memo" span={2}>
          <Textarea
            name="memo"
            defaultValue={training?.memo}
            placeholder="현장 이슈, 재의뢰 가능성 등"
          />
        </Field>
      </FormGrid>

      <FormActions>
        <SubmitButton />
        <Link
          href={orgId ? `/organizations/${orgId}` : "/trainings"}
          className="btn btn-secondary"
        >
          취소
        </Link>
      </FormActions>
    </form>
  );
}
