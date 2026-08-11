"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children = "저장" }: { children?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "저장 중…" : children}
    </button>
  );
}

/**
 * 삭제 버튼. 되돌릴 수 없는 동작이라 확인을 한 번 받는다.
 * 서버 액션은 form action 으로 넘겨받아 클라이언트 번들에 DB 코드가 딸려오지 않게 한다.
 */
export function DeleteButton({
  action,
  label = "삭제",
  confirmMessage = "삭제하면 되돌릴 수 없습니다. 계속할까요?",
}: {
  action: () => Promise<void>;
  label?: string;
  confirmMessage?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <DeleteInner label={label} />
    </form>
  );
}

function DeleteInner({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-danger" disabled={pending}>
      {pending ? "삭제 중…" : label}
    </button>
  );
}
