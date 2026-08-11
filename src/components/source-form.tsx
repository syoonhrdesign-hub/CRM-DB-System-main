"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addSource, type ResearchState } from "@/lib/research-actions";
import { SOURCE_KINDS } from "@/lib/research";

const EMPTY: ResearchState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-secondary" disabled={pending}>
      {pending ? "추가 중…" : "근거 추가"}
    </button>
  );
}

/** 어디서 본 내용인지 한 줄 남긴다. 출처 없는 값은 상담에서 쓸 수 없다. */
export function SourceForm({ researchId }: { researchId: string }) {
  const [state, action] = useActionState(addSource.bind(null, researchId), EMPTY);

  return (
    <form action={action} className="grid gap-3">
      {state.error && (
        <p
          role="alert"
          data-form-message="error"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300"
        >
          {state.error}
        </p>
      )}
      {state.ok && (
        <p
          role="status"
          data-form-message="ok"
          className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
        >
          {state.ok}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
        <select name="kind" aria-label="근거 종류" className="select" defaultValue="기타">
          {SOURCE_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <input
          name="title"
          required
          className="input"
          placeholder="제목 (예: 2025 사업보고서 직원현황)"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <input name="publisher" className="input" placeholder="출처 (예: DART)" />
        <input name="url" className="input sm:col-span-1" placeholder="주소 (https://)" />
        <input name="publishedAt" type="date" aria-label="발행일" className="input" />
      </div>

      <div>
        <Submit />
      </div>
    </form>
  );
}
