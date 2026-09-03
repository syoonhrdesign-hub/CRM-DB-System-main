"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { collectNow, testSource, type TrendState } from "@/lib/trend-actions";

const EMPTY: TrendState = {};

/**
 * 결과를 버튼 바로 옆에 띄운다.
 * "눌렀는데 아무 일도 안 일어난 것 같다"는 느낌을 없애는 것이 목적이다.
 */
function Message({ state }: { state: TrendState }) {
  if (state.error) {
    return (
      <p role="alert" data-form-message="error" className="text-xs text-[var(--danger)]">
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p role="status" data-form-message="ok" className="text-xs text-[var(--success)]">
        {state.ok}
      </p>
    );
  }
  return null;
}

function Submit({
  idle,
  busy,
  primary,
}: {
  idle: string;
  busy: string;
  primary?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={`btn ${primary ? "btn-primary" : "btn-secondary"}`}
      disabled={pending}
    >
      {pending ? busy : idle}
    </button>
  );
}

/** 트렌드 화면 — 켜진 소스를 전부 지금 모은다 */
export function CollectNowButton({ hint }: { hint?: string | null }) {
  const [state, action] = useActionState(collectNow, EMPTY);

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <Submit idle="지금 수집" busy="모으는 중… (소스마다 몇 초씩 걸립니다)" primary />
      {state.ok || state.error ? (
        <Message state={state} />
      ) : (
        hint && <p className="text-xs text-faint">{hint}</p>
      )}
    </form>
  );
}

/** 소스 관리 화면 — 소스 한 곳만 시험 삼아 가져와 본다 */
export function SourceTestButton({ id }: { id: string }) {
  const [state, action] = useActionState(testSource.bind(null, id), EMPTY);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <Submit idle="연결 확인" busy="확인 중…" />
      <Message state={state} />
    </form>
  );
}
