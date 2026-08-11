import type { Contact } from "@prisma/client";
import Link from "next/link";
import {
  CONTACT_CHANGE_REASONS,
  CONTACT_STATUSES,
  MEET_CHANNELS,
} from "@/lib/constants";
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

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="mt-2 border-b border-line pb-1.5 text-sm font-bold sm:col-span-2">
      {children}
    </h3>
  );
}

export function ContactForm({
  action,
  contact,
  organizations,
  siblings = [],
  defaultOrganizationId,
}: {
  action: (fd: FormData) => Promise<void>;
  contact?: Contact;
  organizations: { id: string; name: string }[];
  /** 같은 고객사의 다른 담당자 — 후임 지정 목록 */
  siblings?: { id: string; name: string; department: string | null }[];
  defaultOrganizationId?: string;
}) {
  const orgId = contact?.organizationId ?? defaultOrganizationId;

  return (
    <form action={action}>
      <FormGrid>
        <Field label="고객사 *" htmlFor="organizationId" span={2}>
          <Select
            name="organizationId"
            required
            options={organizations.map((o) => ({ value: o.id, label: o.name }))}
            defaultValue={orgId}
            placeholder="고객사를 선택하세요"
          />
        </Field>

        <Field label="이름 *" htmlFor="name">
          <TextInput name="name" required defaultValue={contact?.name} />
        </Field>

        <Field label="부서" htmlFor="department">
          <TextInput
            name="department"
            defaultValue={contact?.department}
            placeholder="예: 인재개발원"
          />
        </Field>

        <Field label="직급" htmlFor="position">
          <TextInput
            name="position"
            defaultValue={contact?.position}
            placeholder="예: 팀장"
          />
        </Field>

        <Field label="이메일" htmlFor="email">
          <TextInput name="email" type="email" defaultValue={contact?.email} />
        </Field>

        <Field label="직통 전화" htmlFor="phone">
          <TextInput name="phone" defaultValue={contact?.phone} />
        </Field>

        <Field label="휴대폰" htmlFor="mobile">
          <TextInput name="mobile" defaultValue={contact?.mobile} />
        </Field>

        <Field label="메모" htmlFor="memo" span={2}>
          <Textarea
            name="memo"
            defaultValue={contact?.memo}
            placeholder="선호 연락 시간, 의사결정 권한 등"
          />
        </Field>

        <div className="sm:col-span-2">
          <Checkbox
            name="isPrimary"
            label="대표 담당자로 지정 (고객사당 1명)"
            defaultChecked={contact?.isPrimary}
          />
        </div>

        <SectionTitle>첫 만남</SectionTitle>

        <Field label="처음 만난 날" htmlFor="firstMetAt">
          <TextInput
            name="firstMetAt"
            type="date"
            defaultValue={toDateInput(contact?.firstMetAt)}
          />
        </Field>

        <Field label="만난 경로" htmlFor="firstMetChannel">
          <Select
            name="firstMetChannel"
            options={MEET_CHANNELS}
            defaultValue={contact?.firstMetChannel}
            placeholder="선택 안 함"
          />
        </Field>

        <Field
          label="장소 · 행사명"
          htmlFor="firstMetPlace"
          hint="다음에 같은 행사에서 다시 만날 수 있습니다."
        >
          <TextInput
            name="firstMetPlace"
            defaultValue={contact?.firstMetPlace}
            placeholder="예: 2025 HRD 컨퍼런스 (코엑스)"
          />
        </Field>

        <Field label="소개해 준 사람" htmlFor="referredBy">
          <TextInput name="referredBy" defaultValue={contact?.referredBy} />
        </Field>

        <SectionTitle>재직 상태 · 인수인계</SectionTitle>

        <Field
          label="재직 상태"
          htmlFor="status"
          hint="'재직'이 아니면 고객사 화면의 담당자 변경 이력에 자동으로 올라갑니다."
        >
          <Select
            name="status"
            options={CONTACT_STATUSES}
            defaultValue={contact?.status ?? "재직"}
          />
        </Field>

        <Field label="변경 사유" htmlFor="changeReason">
          <Select
            name="changeReason"
            options={CONTACT_CHANGE_REASONS}
            defaultValue={contact?.changeReason}
            placeholder="선택 안 함"
          />
        </Field>

        <Field label="담당 시작일" htmlFor="assignedFrom">
          <TextInput
            name="assignedFrom"
            type="date"
            defaultValue={toDateInput(contact?.assignedFrom)}
          />
        </Field>

        <Field label="담당 종료일" htmlFor="assignedUntil">
          <TextInput
            name="assignedUntil"
            type="date"
            defaultValue={toDateInput(contact?.assignedUntil)}
          />
        </Field>

        {siblings.length > 0 && (
          <Field
            label="후임 담당자"
            htmlFor="successorId"
            hint="이 사람의 업무를 이어받은 담당자를 지정하면 인수인계 흐름이 이어집니다."
          >
            <Select
              name="successorId"
              options={siblings.map((s) => ({
                value: s.id,
                label: s.department ? `${s.name} (${s.department})` : s.name,
              }))}
              defaultValue={contact?.successorId}
              placeholder="선택 안 함"
            />
          </Field>
        )}

        <Field label="인계 내용" htmlFor="handoverNote" span={2}>
          <Textarea
            name="handoverNote"
            defaultValue={contact?.handoverNote}
            placeholder="진행 중이던 건, 전달받은 맥락, 새 담당자가 알아야 할 사항"
          />
        </Field>
      </FormGrid>

      <FormActions>
        <SubmitButton />
        <Link
          href={orgId ? `/organizations/${orgId}` : "/contacts"}
          className="btn btn-secondary"
        >
          취소
        </Link>
      </FormActions>
    </form>
  );
}
