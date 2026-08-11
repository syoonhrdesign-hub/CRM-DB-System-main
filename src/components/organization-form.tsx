import type { Organization } from "@prisma/client";
import Link from "next/link";
import {
  INDUSTRIES,
  MEET_CHANNELS,
  ORG_STATUSES,
  ORG_TYPES,
  SIZE_TIERS,
} from "@/lib/constants";
import { formatBizRegNo, toDateInput } from "@/lib/format";
import { SubmitButton } from "./buttons";
import { Field, FormActions, FormGrid, Select, Textarea, TextInput } from "./form";

export function OrganizationForm({
  action,
  organization,
}: {
  action: (fd: FormData) => Promise<void>;
  organization?: Organization;
}) {
  return (
    <form action={action}>
      <FormGrid>
        <Field label="기관명 *" htmlFor="name">
          <TextInput
            name="name"
            required
            defaultValue={organization?.name}
            placeholder="예: 한국전력공사"
          />
        </Field>

        <Field label="약칭" htmlFor="shortName">
          <TextInput
            name="shortName"
            defaultValue={organization?.shortName}
            placeholder="예: 한전"
          />
        </Field>

        <Field label="기관 유형" htmlFor="orgType">
          <Select
            name="orgType"
            options={ORG_TYPES}
            defaultValue={organization?.orgType ?? "기업"}
          />
        </Field>

        <Field label="거래 상태" htmlFor="status">
          <Select
            name="status"
            options={ORG_STATUSES}
            defaultValue={organization?.status ?? "잠재고객"}
          />
        </Field>

        <Field
          label="사업자등록번호"
          htmlFor="bizRegNo"
          hint="숫자만 입력해도 됩니다."
        >
          <TextInput
            name="bizRegNo"
            defaultValue={
              organization?.bizRegNo ? formatBizRegNo(organization.bizRegNo) : ""
            }
            placeholder="000-00-00000"
          />
        </Field>

        <Field label="업종" htmlFor="industry">
          <Select
            name="industry"
            options={INDUSTRIES}
            defaultValue={organization?.industry}
            placeholder="선택 안 함"
          />
        </Field>

        <Field label="규모" htmlFor="sizeTier">
          <Select
            name="sizeTier"
            options={SIZE_TIERS}
            defaultValue={organization?.sizeTier}
            placeholder="선택 안 함"
          />
        </Field>

        <Field
          label="임직원 수"
          htmlFor="employeeCount"
          hint="교육 규모 산정에 사용합니다."
        >
          <TextInput
            name="employeeCount"
            type="number"
            min={0}
            defaultValue={organization?.employeeCount}
          />
        </Field>

        <Field label="대표 전화" htmlFor="phone">
          <TextInput name="phone" defaultValue={organization?.phone} />
        </Field>

        <Field label="홈페이지" htmlFor="website">
          <TextInput
            name="website"
            defaultValue={organization?.website}
            placeholder="https://"
          />
        </Field>

        <Field label="주소" htmlFor="address" span={2}>
          <TextInput name="address" defaultValue={organization?.address} />
        </Field>

        <Field
          label="사내 컨택 담당자"
          htmlFor="ownerName"
          hint="우리 회사에서 이 고객사를 맡은 사람"
        >
          <TextInput
            name="ownerName"
            defaultValue={organization?.ownerName}
            placeholder="예: 김서윤"
          />
        </Field>

        <h3 className="mt-2 border-b border-line pb-1.5 text-sm font-bold sm:col-span-2">
          고객사 창구 부서
        </h3>

        <Field
          label="담당 부서"
          htmlFor="clientDepartment"
          hint="담당자는 바뀌어도 부서는 남습니다. 재접촉할 때 실마리가 됩니다."
        >
          <TextInput
            name="clientDepartment"
            defaultValue={organization?.clientDepartment}
            placeholder="예: 인재개발원, 인사팀 교육파트"
          />
        </Field>

        <Field label="부서 업무" htmlFor="departmentRole">
          <TextInput
            name="departmentRole"
            defaultValue={organization?.departmentRole}
            placeholder="예: 전사 교육 기획·운영, 승진자 과정 주관"
          />
        </Field>

        <h3 className="mt-2 border-b border-line pb-1.5 text-sm font-bold sm:col-span-2">
          최초 접촉
        </h3>

        <Field label="처음 접촉한 날" htmlFor="firstContactAt">
          <TextInput
            name="firstContactAt"
            type="date"
            defaultValue={toDateInput(organization?.firstContactAt)}
          />
        </Field>

        <Field
          label="유입 경로"
          htmlFor="acquisitionChannel"
          hint="어디서 이 고객사를 알게 됐는지 — 어떤 채널이 실제로 매출로 이어지는지 나중에 확인할 수 있습니다."
        >
          <Select
            name="acquisitionChannel"
            options={MEET_CHANNELS}
            defaultValue={organization?.acquisitionChannel}
            placeholder="선택 안 함"
          />
        </Field>

        <Field label="소개해 준 사람 · 기관" htmlFor="referredBy" span={2}>
          <TextInput name="referredBy" defaultValue={organization?.referredBy} />
        </Field>

        <Field label="메모" htmlFor="memo" span={2}>
          <Textarea
            name="memo"
            defaultValue={organization?.memo}
            placeholder="교육 니즈, 예산 시즌, 의사결정 구조 등"
          />
        </Field>
      </FormGrid>

      <FormActions>
        <SubmitButton />
        <Link
          href={organization ? `/organizations/${organization.id}` : "/organizations"}
          className="btn btn-secondary"
        >
          취소
        </Link>
      </FormActions>
    </form>
  );
}
