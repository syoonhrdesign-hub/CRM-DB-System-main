import type { Activity } from "@prisma/client";
import Link from "next/link";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { toDateInput } from "@/lib/format";
import { SubmitButton } from "./buttons";
import {
  Checkbox,
  Field,
  FormActions,
  FormGrid,
  Select,
  Textarea,
  TextInput,
} from "./form";

export function ActivityForm({
  action,
  activity,
  organizations,
  contacts,
  deals,
  defaultOrganizationId,
}: {
  action: (fd: FormData) => Promise<void>;
  activity?: Activity;
  organizations: { id: string; name: string }[];
  contacts: { id: string; name: string; organizationName: string }[];
  deals: { id: string; title: string; organizationName: string }[];
  defaultOrganizationId?: string;
}) {
  const orgId = activity?.organizationId ?? defaultOrganizationId;

  return (
    <form action={action}>
      <FormGrid>
        <Field label="고객사 *" htmlFor="organizationId">
          <Select
            name="organizationId"
            required
            options={organizations.map((o) => ({ value: o.id, label: o.name }))}
            defaultValue={orgId}
            placeholder="고객사를 선택하세요"
          />
        </Field>

        <Field label="활동 유형" htmlFor="type">
          <Select
            name="type"
            options={ACTIVITY_TYPES}
            defaultValue={activity?.type ?? "전화"}
          />
        </Field>

        <Field label="담당자" htmlFor="contactId">
          <Select
            name="contactId"
            options={contacts.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.organizationName})`,
            }))}
            defaultValue={activity?.contactId}
            placeholder="선택 안 함"
          />
        </Field>

        <Field label="관련 영업건" htmlFor="dealId">
          <Select
            name="dealId"
            options={deals.map((d) => ({
              value: d.id,
              label: `${d.title} (${d.organizationName})`,
            }))}
            defaultValue={activity?.dealId}
            placeholder="선택 안 함"
          />
        </Field>

        <Field label="활동 일자 *" htmlFor="occurredAt">
          <TextInput
            name="occurredAt"
            type="date"
            required
            defaultValue={toDateInput(activity?.occurredAt ?? new Date())}
          />
        </Field>

        <Field label="담당 직원" htmlFor="ownerName">
          <TextInput name="ownerName" defaultValue={activity?.ownerName} />
        </Field>

        <Field label="요약 *" htmlFor="summary" span={2}>
          <TextInput
            name="summary"
            required
            defaultValue={activity?.summary}
            placeholder="예: 하반기 리더십 교육 예산 협의"
          />
        </Field>

        <Field label="상세 내용" htmlFor="content" span={2}>
          <Textarea name="content" defaultValue={activity?.content} />
        </Field>

        <Field
          label="후속 조치"
          htmlFor="nextAction"
          hint="입력하면 대시보드의 할 일 목록에 올라옵니다."
        >
          <TextInput
            name="nextAction"
            defaultValue={activity?.nextAction}
            placeholder="예: 제안서 발송"
          />
        </Field>

        <Field label="후속 조치 기한" htmlFor="nextActionDate">
          <TextInput
            name="nextActionDate"
            type="date"
            defaultValue={toDateInput(activity?.nextActionDate)}
          />
        </Field>

        <div className="sm:col-span-2">
          <Checkbox
            name="isDone"
            label="후속 조치 완료"
            defaultChecked={activity?.isDone}
          />
        </div>
      </FormGrid>

      <FormActions>
        <SubmitButton />
        <Link
          href={orgId ? `/organizations/${orgId}` : "/activities"}
          className="btn btn-secondary"
        >
          취소
        </Link>
      </FormActions>
    </form>
  );
}
