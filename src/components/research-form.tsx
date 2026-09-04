"use client";

import Link from "next/link";
import { OrgPicker } from "./org-picker";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { RESEARCH_SECTIONS } from "@/lib/research";
import type { ResearchState } from "@/lib/research-actions";

const EMPTY: ResearchState = {};

type Action = (prev: ResearchState, fd: FormData) => Promise<ResearchState>;

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "저장 중…" : label}
    </button>
  );
}

export function ResearchForm({
  action,
  research,
  organizations,
  submitLabel = "저장",
}: {
  action: Action;
  research?: Record<string, unknown> | null;
  organizations: { id: string; name: string }[];
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY);

  const val = (key: string): string => {
    const v = research?.[key];
    return v === null || v === undefined ? "" : String(v);
  };

  return (
    <form action={formAction} className="grid gap-6">
      {state.error && (
        <p
          role="alert"
          data-form-message="error"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300"
        >
          {state.error}
        </p>
      )}

      {/* 머리 — 회사명과 한 줄 요약 */}
      <section className="rounded-card border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="companyName" className="mb-1 block text-sm font-semibold">
              회사명 *
            </label>
            <input
              id="companyName"
              name="companyName"
              required
              defaultValue={val("companyName")}
              className="input"
              placeholder="예: 롯데지알에스"
            />
          </div>

          <div>
            <label htmlFor="organizationId" className="mb-1 block text-sm font-semibold">
              고객사 연결
            </label>
            <OrgPicker
              organizations={organizations}
              defaultValue={val("organizationId")}
              emptyLabel="연결 안 함"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="summary" className="mb-1 block text-sm font-semibold">
              한 줄 요약
            </label>
            <input
              id="summary"
              name="summary"
              defaultValue={val("summary")}
              className="input"
              placeholder="상담 화면 맨 위에 뜹니다. 예: 외식 프랜차이즈 대기업, 신입 유입 많음"
            />
          </div>
        </div>
      </section>

      {RESEARCH_SECTIONS.map((section) => (
        <section
          key={section.id}
          className="rounded-card border border-line bg-surface p-5 shadow-[var(--shadow-sm)]"
        >
          <h2 className="text-sm font-bold">{section.title}</h2>
          {section.note && <p className="mt-1 text-sm text-muted">{section.note}</p>}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {section.fields.map((f) => {
              const isWide = f.kind === "textarea";
              return (
                <div key={f.key} className={isWide ? "sm:col-span-2" : undefined}>
                  <label htmlFor={f.key} className="mb-1 block text-sm font-semibold">
                    {f.label}
                  </label>
                  {isWide ? (
                    <textarea
                      id={f.key}
                      name={f.key}
                      defaultValue={val(f.key)}
                      className="textarea"
                    />
                  ) : (
                    <input
                      id={f.key}
                      name={f.key}
                      defaultValue={val(f.key)}
                      inputMode={
                        f.kind === "number" || f.kind === "decimal" ? "numeric" : undefined
                      }
                      className="input"
                    />
                  )}
                  {f.hint && <p className="mt-1 text-xs text-faint">{f.hint}</p>}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* 확인 안 된 항목 */}
      <section className="rounded-card border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
        <h2 className="text-sm font-bold">확인 안 된 것</h2>
        <p className="mt-1 text-sm text-muted">
          찾아봤지만 공개되지 않아 못 채운 항목을 한 줄에 하나씩 적어 둡니다. 빈칸(아직 안
          찾아봄)과 구분하려는 것입니다.
        </p>
        <textarea
          id="gaps"
          name="gaps"
          defaultValue={val("gaps")}
          className="textarea mt-3"
          placeholder={"퇴직율 — 비공개\n최근 3년 신입 채용 인원 — 공시 없음"}
        />
      </section>

      <div className="flex flex-wrap gap-2">
        <Submit label={submitLabel} />
        <Link href="/research" className="btn btn-secondary">
          취소
        </Link>
      </div>
    </form>
  );
}
