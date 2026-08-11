"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { lookupCode, type LookupResult } from "@/lib/distribution-actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending}>
      {pending ? "찾는 중…" : "내 코드 찾기"}
    </button>
  );
}

const VERIFY_LABEL: Record<string, string> = {
  phone4: "휴대폰 뒤 4자리",
  employeeId: "사번",
};

/**
 * 교육생이 이름으로 자기 코드를 찾는 화면.
 *
 * 휴대폰에서 보는 경우가 많다. 코드를 손으로 옮겨 적다 틀리면 진단을 못 보므로
 * 복사 버튼을 크게 두고, 복사한 뒤에야 진단 사이트로 넘어가게 한다.
 */
export function CodeLookup({
  slug,
  verifyField,
  targetUrl,
}: {
  slug: string;
  verifyField: string;
  targetUrl: string | null;
}) {
  const [result, action] = useActionState(lookupCode.bind(null, slug), null);
  const [copied, setCopied] = useState(false);

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // 구형 브라우저나 http 환경에서는 clipboard API 가 막힌다
      const el = document.createElement("textarea");
      el.value = code;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const needVerify =
    verifyField !== "none" || result?.status === "needVerify";

  return (
    <div className="grid gap-4">
      <form action={action} className="grid gap-3">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-semibold">
            이름
          </label>
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder="예: 홍길동"
            className="input"
          />
        </div>

        {needVerify && (
          <div>
            <label htmlFor="verify" className="mb-1 block text-sm font-semibold">
              {VERIFY_LABEL[verifyField] ?? "확인 값"}
            </label>
            <input
              id="verify"
              name="verify"
              inputMode="numeric"
              className="input"
              placeholder={verifyField === "phone4" ? "예: 1234" : "예: 20260101"}
            />
            <p className="mt-1 text-xs text-faint">
              같은 이름이 여러 명이라 한 가지만 더 확인합니다.
            </p>
          </div>
        )}

        <Submit />
      </form>

      {result?.status === "found" && (
        <div className="rounded-card border border-accent bg-accent-soft p-4">
          <p className="text-sm text-muted">
            {result.name}
            {result.department && ` · ${result.department}`}
          </p>

          <p className="tnum mt-2 select-all break-all text-2xl font-bold tracking-tight text-accent">
            {result.code}
          </p>

          <button
            type="button"
            onClick={() => copy(result.code)}
            className="btn btn-primary mt-3 w-full"
          >
            {copied ? "복사했습니다" : "코드 복사"}
          </button>

          {targetUrl && (
            <a
              href={targetUrl}
              target="_blank"
              rel="noreferrer noopener"
              className={`btn mt-2 w-full ${copied ? "btn-secondary" : "btn-secondary opacity-60"}`}
            >
              진단 사이트로 이동
            </a>
          )}

          <p className="mt-3 text-xs text-faint">
            코드를 복사한 뒤 진단 사이트에서 붙여넣어 주세요.
          </p>
        </div>
      )}

      {result?.status === "notFound" && (
        <p
          role="alert"
          className="rounded-md bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
        >
          해당하는 이름을 찾지 못했습니다. 띄어쓰기 없이 정확히 입력해 주세요.
        </p>
      )}

      {result?.status === "needVerify" && (
        <p
          role="alert"
          className="rounded-md bg-surface-2 px-3 py-2.5 text-sm text-muted"
        >
          같은 이름이 여러 명입니다. 위 항목을 함께 입력해 주세요.
        </p>
      )}

      {result?.status === "closed" && (
        <p
          role="alert"
          className="rounded-md bg-surface-2 px-3 py-2.5 text-sm text-muted"
        >
          {result.reason}
        </p>
      )}
    </div>
  );
}
