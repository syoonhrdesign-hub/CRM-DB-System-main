import type { Contact } from "@prisma/client";
import Link from "next/link";
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

export function ContactForm({
  action,
  contact,
  organizations,
  defaultOrganizationId,
}: {
  action: (fd: FormData) => Promise<void>;
  contact?: Contact;
  organizations: { id: string; name: string }[];
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
