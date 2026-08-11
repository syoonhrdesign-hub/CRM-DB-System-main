"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createBrief, type TrendState } from "@/lib/trend-actions";

const EMPTY: TrendState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "브리핑 작성 중… (30초쯤 걸립니다)" : "이번 주 브리핑 만들기"}
    </button>
  );
}

export function BriefButton() {
  const [state, action] = useActionState(createBrief, EMPTY);

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
      <div>
        <Submit />
      </div>
    </form>
  );
}
