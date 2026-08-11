import type { Course } from "@prisma/client";
import Link from "next/link";
import { COURSE_CATEGORIES, COURSE_FORMATS } from "@/lib/constants";
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

export function CourseForm({
  action,
  course,
}: {
  action: (fd: FormData) => Promise<void>;
  course?: Course;
}) {
  return (
    <form action={action}>
      <FormGrid>
        <Field label="과정코드 *" htmlFor="code" hint="예: LDR-001">
          <TextInput name="code" required defaultValue={course?.code} />
        </Field>

        <Field label="과정명 *" htmlFor="name">
          <TextInput
            name="name"
            required
            defaultValue={course?.name}
            placeholder="예: 신임팀장 리더십 과정"
          />
        </Field>

        <Field label="분류" htmlFor="category">
          <Select
            name="category"
            options={COURSE_CATEGORIES}
            defaultValue={course?.category ?? "직무"}
          />
        </Field>

        <Field label="교육 형태" htmlFor="format">
          <Select
            name="format"
            options={COURSE_FORMATS}
            defaultValue={course?.format ?? "집합"}
          />
        </Field>

        <Field label="총 시수" htmlFor="durationHours">
          <TextInput
            name="durationHours"
            type="number"
            step="0.5"
            min={0}
            defaultValue={course?.durationHours ?? 8}
          />
        </Field>

        <Field label="1인당 기본 단가 (원)" htmlFor="defaultPrice">
          <TextInput
            name="defaultPrice"
            type="number"
            min={0}
            defaultValue={course?.defaultPrice ?? 0}
          />
        </Field>

        <Field label="최소 개설 인원" htmlFor="minHeadcount">
          <TextInput
            name="minHeadcount"
            type="number"
            min={0}
            defaultValue={course?.minHeadcount}
          />
        </Field>

        <Field label="과정 소개" htmlFor="description" span={2}>
          <Textarea
            name="description"
            defaultValue={course?.description}
            placeholder="학습 목표, 주요 모듈 등"
          />
        </Field>

        <div className="sm:col-span-2">
          <Checkbox
            name="isActive"
            label="운영 중인 과정 (해제하면 목록에서 흐리게 표시됩니다)"
            defaultChecked={course?.isActive ?? true}
          />
        </div>
      </FormGrid>

      <FormActions>
        <SubmitButton />
        <Link href="/courses" className="btn btn-secondary">
          취소
        </Link>
      </FormActions>
    </form>
  );
}
