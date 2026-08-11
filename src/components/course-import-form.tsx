"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  commitCourseImport,
  loadStarterCourses,
  previewCourseImport,
  type CourseImportState,
} from "@/lib/course-import-actions";
import { COURSE_COLUMNS } from "@/lib/excel";
import { STARTER_COURSES } from "@/lib/starter-courses";

const EMPTY: CourseImportState = {};

function Submit({ children, disabled }: { children: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending || disabled}>
      {pending ? "처리 중…" : children}
    </button>
  );
}

/** 기본 과정 세트 — 처음 시작할 때 과정을 하나씩 넣는 수고를 덜어 준다. */
function StarterCourses() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(
    null,
  );

  const byCategory = STARTER_COURSES.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="rounded-card border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
      <h2 className="text-sm font-bold">기본 과정 불러오기</h2>
      <p className="mt-1 text-sm text-muted">
        자주 쓰는 과정 {STARTER_COURSES.length}개를 한 번에 넣습니다.{" "}
        {Object.entries(byCategory)
          .map(([k, v]) => `${k} ${v}개`)
          .join(" · ")}
        . 시수와 단가는 초기값이니 넣은 뒤 실제에 맞게 고치시면 됩니다.
      </p>
      <p className="mt-1 text-xs text-faint">
        이미 있는 과정코드는 건드리지 않습니다. 여러 번 눌러도 안전합니다.
      </p>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-accent">
          어떤 과정인지 보기
        </summary>
        <ul className="mt-2 grid gap-1 text-sm text-muted">
          {STARTER_COURSES.map((c) => (
            <li key={c.code}>
              <span className="tnum text-faint">{c.code}</span> · {c.name}
              <span className="tnum text-faint">
                {" "}
                ({c.durationHours}시간 · {c.defaultPrice.toLocaleString("ko-KR")}원)
              </span>
            </li>
          ))}
        </ul>
      </details>

      <button
        type="button"
        className="btn btn-primary mt-3"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setResult(await loadStarterCourses());
          })
        }
      >
        {pending ? "불러오는 중…" : "기본 과정 불러오기"}
      </button>

      {result && (
        <p
          role="status"
          data-form-message="ok"
          className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
        >
          <strong className="tnum">{result.created}개</strong> 추가했습니다.
          {result.skipped > 0 && (
            <span> {result.skipped}개는 이미 있어 건너뛰었습니다.</span>
          )}{" "}
          <Link href="/courses" className="underline">
            과정 목록 보기
          </Link>
        </p>
      )}
    </section>
  );
}

export function CourseImportForm() {
  const [preview, previewAction] = useActionState(previewCourseImport, EMPTY);
  const [result, commitAction] = useActionState(commitCourseImport, EMPTY);

  const rows = preview.rows ?? [];
  const okRows = rows.filter((r) => r.errors.length === 0 && !r.duplicateOf);
  const dupRows = rows.filter((r) => r.errors.length === 0 && r.duplicateOf);
  const badRows = rows.filter((r) => r.errors.length > 0);

  if (result.done) {
    return (
      <div className="grid gap-4">
        <div className="rounded-card border border-line bg-surface p-6">
          <h2 className="text-lg font-bold">등록 완료</h2>
          <p className="mt-2 text-sm">
            <strong className="tnum text-accent">{result.done.created}개</strong> 과정을
            등록했습니다.
            {result.done.skipped > 0 && (
              <span className="text-muted"> · {result.done.skipped}개 건너뜀</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/courses" className="btn btn-primary">
            과정 목록 보기
          </Link>
          <Link href="/courses/import" className="btn btn-secondary">
            다시 올리기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <StarterCourses />

      <section className="rounded-card border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
        <h2 className="text-sm font-bold">엑셀로 올리기</h2>
        <p className="mt-1 text-sm text-muted">
          이미 정리해 둔 과정 목록이 있으면 양식에 맞춰 한 번에 올릴 수 있습니다.
          <strong> 과정코드와 과정명이 필수</strong>입니다.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/api/courses/template" className="btn btn-secondary">
            엑셀 양식 내려받기
          </a>
          <a href="/api/courses/export" className="btn btn-secondary">
            현재 과정 내보내기
          </a>
        </div>

        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-accent">열 목록 보기</summary>
          <ul className="mt-2 grid gap-1 text-sm text-muted sm:grid-cols-2">
            {COURSE_COLUMNS.map((c) => (
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

        <form action={previewAction} className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="file"
            name="file"
            accept=".xlsx"
            required
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

      {rows.length > 0 && (
        <section className="rounded-card border border-line bg-surface shadow-[var(--shadow-sm)]">
          <header className="border-b border-line px-5 py-3">
            <h2 className="text-sm font-bold">확인하고 등록</h2>
            <p className="tnum mt-1 text-sm">
              <span className="font-semibold text-[var(--success)]">
                {okRows.length}개 등록 가능
              </span>
              {dupRows.length > 0 && (
                <span className="text-muted"> · {dupRows.length}개 이미 있음</span>
              )}
              {badRows.length > 0 && (
                <span className="font-semibold text-[var(--danger)]">
                  {" "}
                  · {badRows.length}개 오류
                </span>
              )}
            </p>
          </header>

          <div className="max-h-[26rem] overflow-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr>
                  {["행", "과정코드", "과정명", "분류", "상태"].map((h) => (
                    <th
                      key={h}
                      className="sticky top-0 z-10 border-b border-line bg-surface-2 px-3 py-2 text-left text-xs font-semibold text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.rowNumber} className="border-b border-line">
                    <td className="tnum px-3 py-2 align-top text-faint">
                      {r.rowNumber}
                    </td>
                    <td className="tnum px-3 py-2 align-top font-medium">
                      {String(r.values.code ?? "-")}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {String(r.values.name ?? "-")}
                    </td>
                    <td className="px-3 py-2 align-top text-muted">
                      {String(r.values.category ?? "-")}
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
                  이미 있는 {dupRows.length}개는 어떻게 할까요?
                </legend>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="onDuplicate"
                    value="skip"
                    defaultChecked
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  건너뛰기
                </label>
                <label className="mt-1 flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="onDuplicate"
                    value="update"
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  덮어쓰기 (엑셀에 값이 있는 항목만 갱신)
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
