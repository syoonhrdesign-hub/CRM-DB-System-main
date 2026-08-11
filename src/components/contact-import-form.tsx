"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  commitContactImport,
  previewContactImport,
  type ContactImportState,
} from "@/lib/contact-import-actions";
import { CONTACT_COLUMNS } from "@/lib/excel";

const EMPTY: ContactImportState = {};

function Submit({ children, disabled }: { children: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending || disabled}>
      {pending ? "처리 중…" : children}
    </button>
  );
}

export function ContactImportForm() {
  const [preview, previewAction] = useActionState(previewContactImport, EMPTY);
  const [result, commitAction] = useActionState(commitContactImport, EMPTY);

  const rows = preview.rows ?? [];
  const okRows = rows.filter((r) => r.errors.length === 0 && !r.duplicateOf);
  const dupRows = rows.filter((r) => r.errors.length === 0 && r.duplicateOf);
  const badRows = rows.filter((r) => r.errors.length > 0);
  const missingOrg = okRows.filter((r) => !r.matchedOrgId);

  if (result.done) {
    const d = result.done;
    return (
      <div className="grid gap-4">
        <div className="rounded-card border border-line bg-surface p-6">
          <h2 className="text-lg font-bold">등록 완료</h2>
          <ul className="mt-3 grid gap-1 text-sm">
            <li>
              담당자 <strong className="tnum text-accent">{d.created}명</strong> 등록
            </li>
            <li className="text-muted">
              명함 이력 <span className="tnum">{d.cards}건</span> 함께 기록
            </li>
            {d.newOrgs > 0 && (
              <li className="text-muted">
                고객사 <span className="tnum">{d.newOrgs}개</span> 새로 생성
              </li>
            )}
            {d.skipped > 0 && (
              <li className="text-muted">
                <span className="tnum">{d.skipped}건</span> 건너뜀
              </li>
            )}
          </ul>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/contacts" className="btn btn-primary">
            담당자 목록 보기
          </Link>
          <Link href="/contacts/import" className="btn btn-secondary">
            다시 올리기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-card border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
        <h2 className="text-sm font-bold">리멤버 파일을 그대로 올리셔도 됩니다</h2>
        <p className="mt-1 text-sm text-muted">
          리멤버에서 내려받은 엑셀의 열 이름을 알아서 찾아 맞춥니다. 파일을 고치지
          않아도 됩니다. <strong>회사명과 이름</strong> 두 열만 있으면 읽습니다.
        </p>
        <p className="mt-2 text-sm text-muted">
          회사명으로 <strong>등록된 고객사와 자동 연결</strong>합니다.
          <span className="text-faint">
            {" "}
            ((주)·주식회사 표기 차이와 약칭도 맞춰 봅니다)
          </span>
        </p>
        <p className="mt-2 text-xs text-faint">
          담당자를 만들면서 <strong>명함 이력도 한 장 같이 남깁니다.</strong> 나중에
          승진하거나 이직해도 그때의 소속·직함이 보존됩니다.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/api/contacts/template" className="btn btn-secondary">
            엑셀 양식 내려받기
          </a>
        </div>

        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-accent">
            알아보는 열 이름 보기
          </summary>
          <ul className="mt-2 grid gap-1 text-sm text-muted">
            {CONTACT_COLUMNS.map((c) => (
              <li key={c.key}>
                <span className="font-medium text-ink">{c.header}</span>
                {"required" in c && c.required && (
                  <span className="ml-1 font-semibold text-[var(--danger)]">필수</span>
                )}
                <span className="text-faint"> — {c.aliases.join(", ")}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-faint">
            여기 없는 이름을 쓰고 계시면 알려 주세요. 목록에 추가하겠습니다.
          </p>
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
                {okRows.length}명 등록 가능
              </span>
              {dupRows.length > 0 && (
                <span className="text-muted"> · {dupRows.length}명 이미 있음</span>
              )}
              {badRows.length > 0 && (
                <span className="font-semibold text-[var(--danger)]">
                  {" "}
                  · {badRows.length}건 오류
                </span>
              )}
            </p>
            {missingOrg.length > 0 && (
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                {missingOrg.length}명은 등록되지 않은 회사입니다
              </p>
            )}
          </header>

          <div className="max-h-[26rem] overflow-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr>
                  {["행", "이름", "회사 · 부서", "연락처", "상태"].map((h) => (
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
                    <td className="px-3 py-2 align-top font-medium">
                      {String(r.values.name ?? "-")}
                      {r.values.position && (
                        <span className="ml-1 text-xs text-faint">
                          {String(r.values.position)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {r.matchedOrgId ? (
                        <span className="text-accent">{r.matchedOrgName}</span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-300">
                          {String(r.values.companyName ?? "-")}
                          <span className="ml-1 text-xs">(미등록)</span>
                        </span>
                      )}
                      {r.values.department && (
                        <span className="block text-xs text-muted">
                          {String(r.values.department)}
                        </span>
                      )}
                    </td>
                    <td className="tnum px-3 py-2 align-top text-muted">
                      {[r.values.mobile, r.values.email]
                        .filter(Boolean)
                        .join(" · ") || "-"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {r.errors.length > 0 ? (
                        <span className="font-semibold text-[var(--danger)]">
                          {r.errors.join(", ")}
                        </span>
                      ) : r.duplicateOf ? (
                        <span className="text-amber-700 dark:text-amber-300">
                          이미 있음
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

            {missingOrg.length > 0 && (
              <fieldset className="mb-4">
                <legend className="mb-1.5 text-sm font-semibold">
                  등록되지 않은 회사 {missingOrg.length}건은 어떻게 할까요?
                </legend>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="onMissingOrg"
                    value="create"
                    defaultChecked
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  고객사를 새로 만들고 연결 (잠재고객으로 등록됩니다)
                </label>
                <label className="mt-1 flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="onMissingOrg"
                    value="skip"
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  건너뛰기 (기존 고객사의 담당자만 등록)
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

            <Submit disabled={okRows.length === 0}>등록하기</Submit>
          </form>
        </section>
      )}
    </div>
  );
}
