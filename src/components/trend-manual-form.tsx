"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addManualItem, type TrendState } from "@/lib/trend-actions";
import { TREND_CATEGORIES } from "@/lib/trends";

const EMPTY: TrendState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "저장 중…" : "등록"}
    </button>
  );
}

export function ManualItemForm() {
  const [state, action] = useActionState(addManualItem, EMPTY);

  return (
    <form action={action} className="grid gap-4">
      {state.error && (
        <p
          role="alert"
          data-form-message="error"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300"
        >
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-semibold">
          제목 *
        </label>
        <input
          id="title"
          name="title"
          required
          className="input"
          placeholder="예: HRD 이슈브리프 2026-15호 — 생성형 AI와 직무역량"
        />
      </div>

      <div>
        <label htmlFor="url" className="mb-1 block text-sm font-semibold">
          주소 *
        </label>
        <input id="url" name="url" required className="input" placeholder="https://" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="publisher" className="mb-1 block text-sm font-semibold">
            출처
          </label>
          <input id="publisher" name="publisher" className="input" placeholder="예: KRIVET" />
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-semibold">
            갈래
          </label>
          <select id="category" name="category" className="select" defaultValue="HRD">
            {TREND_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="publishedAt" className="mb-1 block text-sm font-semibold">
            발행일
          </label>
          <input id="publishedAt" name="publishedAt" type="date" className="input" />
        </div>
      </div>

      <div>
        <label htmlFor="summary" className="mb-1 block text-sm font-semibold">
          메모
        </label>
        <textarea
          id="summary"
          name="summary"
          className="textarea"
          placeholder="왜 봐 둘 만한지 한두 줄"
        />
      </div>

      <div>
        <Submit />
      </div>
    </form>
  );
}
