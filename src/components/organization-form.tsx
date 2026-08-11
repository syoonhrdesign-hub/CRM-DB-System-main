import type { Organization } from "@prisma/client";
import Link from "next/link";
import {
  INDUSTRIES,
  ORG_STATUSES,
  ORG_TYPES,
  SIZE_TIERS,
} from "@/lib/constants";
import { formatBizRegNo } from "@/lib/format";
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

        <Field label="사내 영업 담당자" htmlFor="ownerName">
          <TextInput
            name="ownerName"
            defaultValue={organization?.ownerName}
            placeholder="예: 김영업"
          />
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
