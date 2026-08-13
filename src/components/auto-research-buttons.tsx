"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  autoFillResearch,
  bulkAutoResearch,
  bulkNpsResearch,
  npsFillResearch,
  type AutoFillResult,
} from "@/lib/auto-research-actions";

const EMPTY: AutoFillResult = {};

function Submit({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? busy : label}
    </button>
  );
}

function Messages({ state }: { state: AutoFillResult }) {
  return (
    <>
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
      {state.failures && (
        <ul className="grid gap-1 text-xs text-red-700 dark:text-red-300">
          {state.failures.map((f) => (
            <li key={f}>· {f}</li>
          ))}
        </ul>
      )}
    </>
  );
}

/** 리서치 상세 — 이 회사 하나 채우기 */
export function AutoFillButton({ researchId }: { researchId: string }) {
  const [state, action] = useActionState(autoFillResearch.bind(null, researchId), EMPTY);
  return (
    <form action={action} className="grid gap-2">
      <Messages state={state} />
      <div>
        <Submit label="공시(DART)에서 채우기" busy="공시 조회 중…" />
      </div>
      <p className="text-xs text-faint">
        비어 있는 칸만 채웁니다. 직접 적은 값은 바뀌지 않습니다.
      </p>
    </form>
  );
}

/** 리서치 상세 — 국민연금으로 이 회사 가입자 수 채우기 */
export function NpsFillButton({ researchId }: { researchId: string }) {
  const [state, action] = useActionState(npsFillResearch.bind(null, researchId), EMPTY);
  return (
    <form action={action} className="grid gap-2">
      <Messages state={state} />
      <div>
        <Submit label="국민연금에서 채우기" busy="국민연금 조회 중…" />
      </div>
      <p className="text-xs text-faint">
        가입자 수(≒ 상시 직원 수)와 기준월을 채웁니다. 본사·지점이 나뉜 회사는 합산합니다.
      </p>
    </form>
  );
}

/** 리서치 목록 — 직원 규모 없는 리서치 전체를 국민연금으로 처리 */
export function BulkNpsButton({ targets }: { targets: number }) {
  const [state, action] = useActionState(bulkNpsResearch, EMPTY);

  if (targets === 0 && !state.ok && !state.error) return null;

  const done = state.remaining === 0;

  return (
    <div className="mb-6 rounded-card border border-line bg-surface p-4">
      <h2 className="text-sm font-bold">국민연금 일괄 조회 — 직원 규모 채우기</h2>
      <p className="mt-1 text-sm text-muted">
        공시(DART)에 직원현황이 없는 리서치 {targets}곳의 국민연금 가입자 수(≒ 상시 직원
        수)를 조회합니다. 한 번에 50곳씩 처리합니다.
      </p>
      <div className="mt-3 grid gap-2">
        <Messages state={state} />
        {!done && (
          <form action={action}>
            <Submit
              label={state.ok ? "이어서 처리 (50곳)" : "국민연금 일괄 조회 (50곳)"}
              busy="국민연금 조회 중… (1~2분 걸립니다)"
            />
          </form>
        )}
      </div>
    </div>
  );
}

/** 리서치 목록 — 리서치 없는 고객사 전체 처리 */
export function BulkAutoButton({ withoutResearch }: { withoutResearch: number }) {
  const [state, action] = useActionState(bulkAutoResearch, EMPTY);

  if (withoutResearch === 0 && !state.ok && !state.error) return null;

  const done = state.remaining === 0;

  return (
    <div className="mb-6 rounded-card border border-accent bg-accent-soft p-4">
      <h2 className="text-sm font-bold text-accent">
        고객사 일괄 조사 — 공시(DART) 자동 채우기
      </h2>
      <p className="mt-1 text-sm text-muted">
        리서치가 없는 고객사 {withoutResearch}곳에 조사 카드를 만들고, 금감원 공시에서
        대표자·주소·설립연도·사업자번호와 (상장·외감 기업은) 정규직/기간제 인원·평균
        근속연수를 채웁니다. 한 번에 100곳씩 처리합니다.
      </p>
      <div className="mt-3 grid gap-2">
        <Messages state={state} />
        {!done && (
          <form action={action}>
            <Submit
              label={state.ok ? "이어서 처리 (100곳)" : "일괄 조사 시작 (100곳)"}
              busy="공시 조회 중… (1~2분 걸립니다)"
            />
          </form>
        )}
      </div>
    </div>
  );
}
