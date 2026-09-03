"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createSource, type TrendState } from "@/lib/trend-actions";
import { KEYWORD_KINDS, TREND_CATEGORIES, TREND_KINDS } from "@/lib/trends";

const EMPTY: TrendState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "추가 중…" : "추가"}
    </button>
  );
}

export function SourceAddForm() {
  const [state, action] = useActionState(createSource, EMPTY);
  const [kind, setKind] = useState<string>("rss");

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

      <div>
        <label htmlFor="ts-name" className="mb-1 block text-sm font-semibold">
          이름 *
        </label>
        <input id="ts-name" name="name" required className="input" placeholder="예: 월간HRD" />
      </div>

      <div>
        <label htmlFor="ts-kind" className="mb-1 block text-sm font-semibold">
          가져오는 방식
        </label>
        <select
          id="ts-kind"
          name="kind"
          className="select"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          {Object.entries(TREND_KINDS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {KEYWORD_KINDS.includes(kind) ? (
        <div>
          <label htmlFor="ts-keyword" className="mb-1 block text-sm font-semibold">
            검색어 *
          </label>
          <input
            id="ts-keyword"
            name="keyword"
            className="input"
            placeholder="예: 기업교육 HRD"
          />
          <p className="mt-1 text-xs text-faint">
            {kind === "google"
              ? "구글 뉴스에서 이 말로 찾습니다. 키가 필요 없고 매체를 가리지 않습니다."
              : "네이버 뉴스에서 이 말로 찾습니다. 키가 없으면 구글 뉴스로 대신 찾습니다."}
          </p>
        </div>
      ) : (
        <div>
          <label htmlFor="ts-url" className="mb-1 block text-sm font-semibold">
            주소 {kind === "rss" ? "*" : ""}
          </label>
          <input
            id="ts-url"
            name="url"
            className="input"
            placeholder={kind === "rss" ? "https://.../feed/" : "https://"}
          />
          {kind === "rss" && (
            <p className="mt-1 text-xs text-faint">
              RSS 주소입니다. 추가한 뒤 “연결 확인”으로 되는지 보세요.
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="ts-category" className="mb-1 block text-sm font-semibold">
          갈래
        </label>
        <select id="ts-category" name="category" className="select" defaultValue="HRD">
          {TREND_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" />
        바로 켜기
      </label>

      <div>
        <Submit />
      </div>
    </form>
  );
}
