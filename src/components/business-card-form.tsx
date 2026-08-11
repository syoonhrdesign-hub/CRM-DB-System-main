import type { BusinessCard } from "@prisma/client";
import Link from "next/link";
import { MEET_CHANNELS } from "@/lib/constants";
import { toDateInput } from "@/lib/format";
import { SubmitButton } from "./buttons";
import { Field, FormActions, FormGrid, Select, Textarea, TextInput } from "./form";

/**
 * 명함 등록 폼.
 *
 * 담당자의 "현재 정보"가 아니라 "그 명함에 적혀 있던 사실"을 남긴다.
 * 가장 최근 명함이면 담당자 레코드도 함께 갱신되므로 같은 값을 두 번 넣지 않아도 된다.
 */
export function BusinessCardForm({
  action,
  card,
  contact,
}: {
  action: (fd: FormData) => Promise<void>;
  card?: BusinessCard;
  contact: {
    id: string;
    name: string;
    department: string | null;
    position: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    organizationName: string;
  };
}) {
  return (
    <form action={action}>
      <input type="hidden" name="contactId" value={contact.id} />

      <FormGrid>
        <Field label="명함 받은 날 *" htmlFor="receivedAt">
          <TextInput
            name="receivedAt"
            type="date"
            required
            defaultValue={toDateInput(card?.receivedAt ?? new Date())}
          />
        </Field>

        <Field
          label="소속 회사"
          htmlFor="companyName"
          hint="이직했다면 명함에 적힌 새 회사명을 그대로 적습니다."
        >
          <TextInput
            name="companyName"
            defaultValue={card?.companyName ?? contact.organizationName}
          />
        </Field>

        <Field label="부서" htmlFor="department">
          <TextInput
            name="department"
            defaultValue={card?.department ?? contact.department}
          />
        </Field>

        <Field label="직함" htmlFor="position">
          <TextInput
            name="position"
            defaultValue={card?.position ?? contact.position}
          />
        </Field>

        <Field label="이메일" htmlFor="email">
          <TextInput
            name="email"
            type="email"
            defaultValue={card?.email ?? contact.email}
          />
        </Field>

        <Field label="직통 전화" htmlFor="phone">
          <TextInput name="phone" defaultValue={card?.phone ?? contact.phone} />
        </Field>

        <Field label="휴대폰" htmlFor="mobile">
          <TextInput name="mobile" defaultValue={card?.mobile ?? contact.mobile} />
        </Field>

        <Field label="주소" htmlFor="address">
          <TextInput name="address" defaultValue={card?.address} />
        </Field>

        <Field label="받은 경로" htmlFor="receivedChannel">
          <Select
            name="receivedChannel"
            options={MEET_CHANNELS}
            defaultValue={card?.receivedChannel}
            placeholder="선택 안 함"
          />
        </Field>

        <Field label="받은 장소 · 행사명" htmlFor="receivedPlace">
          <TextInput
            name="receivedPlace"
            defaultValue={card?.receivedPlace}
            placeholder="예: 2026 HRD 컨퍼런스"
          />
        </Field>

        <Field
          label="명함 이미지 링크"
          htmlFor="imageUrl"
          span={2}
          hint="사내 드라이브 등에 올린 스캔본 주소를 넣어 두면 원본을 바로 열 수 있습니다."
        >
          <TextInput
            name="imageUrl"
            defaultValue={card?.imageUrl}
            placeholder="https://"
          />
        </Field>

        <Field label="메모" htmlFor="memo" span={2}>
          <Textarea
            name="memo"
            defaultValue={card?.memo}
            placeholder="명함을 주고받을 때의 상황, 나눈 이야기"
          />
        </Field>
      </FormGrid>

      <FormActions>
        <SubmitButton>명함 저장</SubmitButton>
        <Link href={`/contacts/${contact.id}`} className="btn btn-secondary">
          취소
        </Link>
      </FormActions>
    </form>
  );
}
