"use client";

import Link from "next/link";
import { OrgPicker } from "./org-picker";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createDistribution,
  type DistributionState,
} from "@/lib/distribution-actions";

const EMPTY: DistributionState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "만드는 중…" : "안내 페이지 만들기"}
    </button>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  span,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  span?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={span ? "sm:col-span-2" : undefined}>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}

export function DistributionForm({
  organizations,
}: {
  organizations: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(createDistribution, EMPTY);

  return (
    <form action={action} className="grid gap-6">
      {state.error && (
        <p
          role="alert"
          data-form-message="error"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300"
        >
          {state.error}
        </p>
      )}

      {/* 1. 명단 — 이게 없으면 페이지를 만들 이유가 없다 */}
      <section className="rounded-card border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
        <h2 className="text-sm font-bold">1. 교육생 명단</h2>
        <p className="mt-1 text-sm text-muted">
          <strong>이름</strong>과 <strong>코드</strong> 두 열만 있으면 됩니다. 열 이름은
          성명·검사코드처럼 달라도 알아서 찾습니다.
        </p>

        <a href="/api/distributions/template" className="btn btn-secondary mt-3">
          명단 양식 내려받기
        </a>

        <div className="mt-3">
          <input
            type="file"
            name="file"
            accept=".xlsx"
            required
            className="input max-w-sm file:mr-3 file:rounded file:border-0 file:bg-accent-soft file:px-3 file:py-1 file:text-sm file:font-semibold file:text-accent"
          />
        </div>
      </section>

      {/* 2. 안내문 */}
      <section className="rounded-card border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
        <h2 className="mb-4 text-sm font-bold">2. 안내문</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="윗줄 문구" htmlFor="headline" span>
            <input
              id="headline"
              name="headline"
              className="input"
              placeholder="예: 팀원 간 행동유형과 강점을 이해하여"
            />
          </Field>

          <Field label="제목 *" htmlFor="title" span>
            <input
              id="title"
              name="title"
              required
              className="input"
              placeholder="예: k-DISC 진단 및 교육을 진행합니다"
            />
          </Field>

          <Field label="아랫줄 문구" htmlFor="subtitle" span>
            <input
              id="subtitle"
              name="subtitle"
              className="input"
              placeholder="예: 사전 진단을 반드시 완료해 주세요"
            />
          </Field>

          <Field label="고객사" htmlFor="organizationId">
            <OrgPicker organizations={organizations} />
          </Field>

          <Field
            label="진단 사이트 주소"
            htmlFor="targetUrl"
            hint="코드를 복사한 뒤 이동할 곳"
          >
            <input
              id="targetUrl"
              name="targetUrl"
              className="input"
              placeholder="https://"
            />
          </Field>
        </div>
      </section>

      {/* 3. 교육 정보 */}
      <section className="rounded-card border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
        <h2 className="mb-4 text-sm font-bold">3. 교육 정보</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="교육 일자" htmlFor="eventAt">
            <input id="eventAt" name="eventAt" type="date" className="input" />
          </Field>

          <Field label="교육 시간" htmlFor="eventTime">
            <input
              id="eventTime"
              name="eventTime"
              className="input"
              placeholder="예: 09:30~11:30 (2시간)"
            />
          </Field>

          <Field label="교육 장소" htmlFor="venue">
            <input
              id="venue"
              name="venue"
              className="input"
              placeholder="예: 롯데GRS 아카데미 503호"
            />
          </Field>

          <Field label="대상" htmlFor="audience">
            <input
              id="audience"
              name="audience"
              className="input"
              placeholder="예: 인재육성팀 전원 (17명)"
            />
          </Field>

          <Field label="강사" htmlFor="instructor" span>
            <input
              id="instructor"
              name="instructor"
              className="input"
              placeholder="예: 정하늘 (neoize 전문강사)"
            />
          </Field>
        </div>
      </section>

      {/* 4. 기간과 확인 */}
      <section className="rounded-card border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
        <h2 className="mb-4 text-sm font-bold">4. 진단 기간 · 본인 확인</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="시작일" htmlFor="opensAt">
            <input id="opensAt" name="opensAt" type="date" className="input" />
          </Field>

          <Field
            label="종료일"
            htmlFor="closesAt"
            hint="기간을 벗어나면 조회되지 않습니다"
          >
            <input id="closesAt" name="closesAt" type="date" className="input" />
          </Field>

          <Field
            label="추가 확인"
            htmlFor="verifyField"
            span
            hint="동명이인이 있으면 자동으로 한 번 더 물어봅니다. 항상 물어보게 하려면 선택하세요."
          >
            <select id="verifyField" name="verifyField" className="select">
              <option value="none">이름만으로 조회</option>
              <option value="phone4">휴대폰 뒤 4자리도 확인</option>
              <option value="employeeId">사번도 확인</option>
            </select>
          </Field>
        </div>
      </section>

      {/* 5. 유의사항 */}
      <section className="rounded-card border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
        <h2 className="mb-4 text-sm font-bold">5. 유의사항 · 문의</h2>
        <div className="grid gap-4">
          <Field label="안내 문구" htmlFor="guide">
            <textarea
              id="guide"
              name="guide"
              className="textarea"
              placeholder="예: 사전 진단은 교육 내용 이해도를 높이고 개인별 맞춤 피드백을 위한 필수 과정입니다."
            />
          </Field>

          <Field
            label="유의사항"
            htmlFor="notices"
            hint="한 줄에 하나씩 적으면 목록으로 보입니다"
          >
            <textarea
              id="notices"
              name="notices"
              className="textarea"
              placeholder={"회원가입 및 로그인은 필수입니다.\n다른 사람의 코드를 사용하지 않도록 주의해 주세요."}
            />
          </Field>

          <Field label="문의처" htmlFor="inquiry">
            <input
              id="inquiry"
              name="inquiry"
              className="input"
              placeholder="예: 인재육성팀 정소영 프로 (02-709-1085)"
            />
          </Field>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Submit />
        <Link href="/distributions" className="btn btn-secondary">
          취소
        </Link>
      </div>
    </form>
  );
}
