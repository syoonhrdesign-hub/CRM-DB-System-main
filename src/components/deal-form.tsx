import type { Deal } from "@prisma/client";
import Link from "next/link";
import { DEAL_STAGES, LOST_REASONS } from "@/lib/constants";
import { toDateInput } from "@/lib/format";
import { SubmitButton } from "./buttons";
import { Field, FormActions, FormGrid, Select, Textarea, TextInput } from "./form";

export function DealForm({
  action,
  deal,
  organizations,
  contacts,
  defaultOrganizationId,
  currentUserName,
}: {
  action: (fd: FormData) => Promise<void>;
  deal?: Deal;
  organizations: { id: string; name: string }[];
  /** 고객사 전체의 담당자 — 선택 목록에 소속 기관을 함께 보여 준다. */
  contacts: { id: string; name: string; organizationName: string }[];
  defaultOrganizationId?: string;
  /** 로그인한 사용자 이름 — 새 영업건의 담당자 기본값 */
  currentUserName?: string;
}) {
  const orgId = deal?.organizationId ?? defaultOrganizationId;

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

        <Field label="담당자" htmlFor="contactId">
          <Select
            name="contactId"
            options={contacts.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.organizationName})`,
            }))}
            defaultValue={deal?.contactId}
            placeholder="선택 안 함"
          />
        </Field>

        <Field label="영업건 제목 *" htmlFor="title" span={2}>
          <TextInput
            name="title"
            required
            defaultValue={deal?.title}
            placeholder="예: 2026 상반기 리더십 교육 제안"
          />
        </Field>

        <Field label="단계" htmlFor="stage">
          <Select
            name="stage"
            options={DEAL_STAGES}
            defaultValue={deal?.stage ?? "문의"}
          />
        </Field>

        <Field
          label="성사 확률 (%)"
          htmlFor="probability"
          hint="비워 두면 단계별 기본값이 들어갑니다."
        >
          <TextInput
            name="probability"
            type="number"
            min={0}
            max={100}
            defaultValue={deal?.probability}
          />
        </Field>

        <Field label="예상 매출 (원)" htmlFor="expectedAmount">
          <TextInput
            name="expectedAmount"
            type="number"
            min={0}
            defaultValue={deal?.expectedAmount ?? 0}
          />
        </Field>

        <Field label="예상 마감일" htmlFor="expectedCloseDate">
          <TextInput
            name="expectedCloseDate"
            type="date"
            defaultValue={toDateInput(deal?.expectedCloseDate)}
          />
        </Field>

        <Field
          label="실패 사유"
          htmlFor="lostReason"
          hint="단계를 '실패'로 둘 때만 저장됩니다."
        >
          <Select
            name="lostReason"
            options={LOST_REASONS}
            defaultValue={deal?.lostReason}
            placeholder="선택 안 함"
          />
        </Field>

        <Field
          label="사내 컨택 담당자"
          htmlFor="ownerName"
          hint="비워 두면 로그인한 본인 이름이 들어갑니다."
        >
          <TextInput
            name="ownerName"
            defaultValue={deal?.ownerName ?? currentUserName}
          />
        </Field>

        <Field label="메모" htmlFor="memo" span={2}>
          <Textarea
            name="memo"
            defaultValue={deal?.memo}
            placeholder="경쟁 상황, 예산 규모, 의사결정 일정 등"
          />
        </Field>
      </FormGrid>

      <FormActions>
        <SubmitButton />
        <Link href="/deals" className="btn btn-secondary">
          취소
        </Link>
      </FormActions>
    </form>
  );
}
