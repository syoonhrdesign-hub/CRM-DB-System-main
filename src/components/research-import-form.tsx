"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { importResearch, type ResearchState } from "@/lib/research-actions";

const EMPTY: ResearchState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "넣는 중…" : "올리기"}
    </button>
  );
}

export function ResearchImportForm() {
  const [state, action] = useActionState(importResearch, EMPTY);

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
      {state.ok && (
        <p
          role="status"
          data-form-message="ok"
          className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
        >
          {state.ok}{" "}
          <Link href="/research" className="font-semibold underline">
            목록 보기
          </Link>
        </p>
      )}

      <input
        type="file"
        name="file"
        accept=".json,application/json"
        required
        className="input max-w-sm file:mr-3 file:rounded file:border-0 file:bg-accent-soft file:px-3 file:py-1 file:text-sm file:font-semibold file:text-accent"
      />

      <div>
        <Submit />
      </div>
    </form>
  );
}
