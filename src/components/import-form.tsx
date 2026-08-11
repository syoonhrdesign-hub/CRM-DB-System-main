"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  commitImport,
  previewImport,
  type ImportState,
} from "@/lib/import-actions";
import { ORG_COLUMNS } from "@/lib/excel";

const EMPTY: ImportState = {};

function Submit({ children, disabled }: { children: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn-primary"
      disabled={pending || disabled}
    >
      {pending ? "처리 중…" : children}
    </button>
  );
}

export function ImportForm() {
  const [preview, previewAction] = useActionState(previewImport, EMPTY);
  const [result, commitAction] = useActionState(commitImport, EMPTY);

  // 미리보기와 등록이 같은 파일을 써야 해서 input 을 공유한다
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  const rows = preview.rows ?? [];
  const okRows = rows.filter((r) => r.errors.length === 0 && !r.duplicateOf);
  const dupRows = rows.filter((r) => r.errors.length === 0 && r.duplicateOf);
  const badRows = rows.filter((r) => r.errors.length > 0);

  /* ------------------------------ 등록 완료 ------------------------------ */
  if (result.done) {
    return (
      <div className="grid gap-4">
        <div className="rounded-card border border-line bg-surface p-6">
          <h2 className="text-lg font-bold">등록 완료</h2>
          <p className="mt-2 text-sm">
            <strong className="tnum text-accent">{result.done.created}건</strong>{" "}
            등록했습니다.
            {result.done.skipped > 0 && (
              <span className="text-muted">
                {" "}
                · {result.done.skipped}건은 건너뛰었습니다
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/organizations" className="btn btn-primary">
            고객사 목록 보기
          </Link>
          <Link href="/organizations/import" className="btn btn-secondary">
            다시 올리기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* ------------------------------ 1단계 ------------------------------ */}
      <section className="rounded-card border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
        <h2 className="text-sm font-bold">1. 양식 내려받기</h2>
        <p className="mt-1 text-sm text-muted">
          이 양식의 <strong>열 이름</strong>에 맞춰 채워 주세요. 순서는 바뀌어도 되고,
          안 쓰는 열은 지우셔도 됩니다. <strong>기관명만 필수</strong>입니다.
        </p>
        <a
          href="/api/organizations/template"
          className="btn btn-secondary mt-3 inline-flex"
        >
          엑셀 양식 내려받기
        </a>

        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-accent">
            열 목록 보기
          </summary>
          <ul className="mt-2 grid gap-1 text-sm text-muted sm:grid-cols-2">
            {ORG_COLUMNS.map((c) => (
              <li key={c.key}>
                · {c.header}
                {"required" in c && c.required && (
                  <span className="ml-1 font-semibold text-[var(--danger)]">필수</span>
                )}
                {"choices" in c && c.choices && (
                  <span className="ml-1 text-xs text-faint">
                    ({c.choices.join(" / ")})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </details>
      </section>

      {/* ------------------------------ 2단계 ------------------------------ */}
      <section className="rounded-card border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
        <h2 className="text-sm font-bold">2. 파일 올리고 확인</h2>
        <p className="mt-1 text-sm text-muted">
          바로 저장하지 않습니다. 먼저 무엇이 등록될지 보여 드립니다.
        </p>

        <form action={previewAction} className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            name="file"
            accept=".xlsx"
            required
            onChange={(e) => setFileName(e.target.value)}
            className="input max-w-sm file:mr-3 file:rounded file:border-0 file:bg-accent-soft file:px-3 file:py-1 file:text-sm file:font-semibold file:text-accent"
          />
          <Submit>내용 확인</Submit>
        </form>

        {preview.error && (
          <p
            role="alert"
            data-form-message="error"
            className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300"
          >
            {preview.error}
          </p>
        )}
      </section>

      {/* ------------------------------ 3단계 ------------------------------ */}
      {rows.length > 0 && (
        <section className="rounded-card border border-line bg-surface shadow-[var(--shadow-sm)]">
          <header className="border-b border-line px-5 py-3">
            <h2 className="text-sm font-bold">3. 확인하고 등록</h2>
            <p className="tnum mt-1 text-sm">
              <span className="font-semibold text-[var(--success)]">
                {okRows.length}건 등록 가능
              </span>
              {dupRows.length > 0 && (
                <span className="text-muted"> · {dupRows.length}건 이미 있음</span>
              )}
              {badRows.length > 0 && (
                <span className="font-semibold text-[var(--danger)]">
                  {" "}
                  · {badRows.length}건 오류
                </span>
              )}
            </p>
          </header>

          <div className="max-h-[28rem] overflow-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr>
                  <th className="sticky top-0 z-10 border-b border-line bg-surface-2 px-3 py-2 text-left text-xs font-semibold text-muted">
                    행
                  </th>
                  <th className="sticky top-0 z-10 border-b border-line bg-surface-2 px-3 py-2 text-left text-xs font-semibold text-muted">
                    기관명
                  </th>
                  <th className="sticky top-0 z-10 border-b border-line bg-surface-2 px-3 py-2 text-left text-xs font-semibold text-muted">
                    유형 · 업종
                  </th>
                  <th className="sticky top-0 z-10 border-b border-line bg-surface-2 px-3 py-2 text-left text-xs font-semibold text-muted">
                    담당 부서
                  </th>
                  <th className="sticky top-0 z-10 border-b border-line bg-surface-2 px-3 py-2 text-left text-xs font-semibold text-muted">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.rowNumber} className="border-b border-line">
                    <td className="tnum px-3 py-2 align-top text-faint">
                      {r.rowNumber}
                    </td>
                    <td className="px-3 py-2 align-top font-medium">
                      {String(r.values.name ?? "-")}
                    </td>
                    <td className="px-3 py-2 align-top text-muted">
                      {[r.values.orgType, r.values.industry]
                        .filter(Boolean)
                        .join(" · ") || "-"}
                    </td>
                    <td className="px-3 py-2 align-top text-muted">
                      {String(r.values.clientDepartment ?? "-")}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {r.errors.length > 0 ? (
                        <span className="font-semibold text-[var(--danger)]">
                          {r.errors.join(", ")}
                        </span>
                      ) : r.duplicateOf ? (
                        <span className="text-amber-700 dark:text-amber-300">
                          이미 있음 — {r.duplicateOf}
                        </span>
                      ) : (
                        <span className="text-[var(--success)]">등록 가능</span>
                      )}
                      {r.warnings.length > 0 && (
                        <span className="block text-xs text-faint">
                          {r.warnings.join(", ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form action={commitAction} className="border-t border-line p-5">
            {/* 미리보기에 쓴 파일을 그대로 다시 보낸다 */}
            <input
              type="file"
              name="file"
              accept=".xlsx"
              required
              className="input mb-3 max-w-sm file:mr-3 file:rounded file:border-0 file:bg-accent-soft file:px-3 file:py-1 file:text-sm file:font-semibold file:text-accent"
            />
            <p className="mb-3 text-xs text-faint">
              방금 확인한 파일을 한 번 더 선택해 주세요. 저장 직전에 다시 검증합니다.
            </p>

            {dupRows.length > 0 && (
              <fieldset className="mb-4">
                <legend className="mb-1.5 text-sm font-semibold">
                  이미 있는 {dupRows.length}건은 어떻게 할까요?
                </legend>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="onDuplicate"
                    value="skip"
                    defaultChecked
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  건너뛰기 (기존 정보를 그대로 둡니다)
                </label>
                <label className="mt-1 flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="onDuplicate"
                    value="update"
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  덮어쓰기 (엑셀에 값이 있는 항목만 갱신합니다)
                </label>
              </fieldset>
            )}

            {result.error && (
              <p
                role="alert"
                data-form-message="error"
                className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300"
              >
                {result.error}
              </p>
            )}

            <Submit disabled={okRows.length === 0 && dupRows.length === 0}>
              등록하기
            </Submit>
          </form>
        </section>
      )}
    </div>
  );
}
