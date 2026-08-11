"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  changeOwnPassword,
  createUser,
  login,
  resetUserPassword,
  updateUser,
  type FormState,
} from "@/lib/auth-actions";

const EMPTY: FormState = {};

function Submit({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending}>
      {pending ? "처리 중…" : children}
    </button>
  );
}

function Message({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p
        role="alert"
        data-form-message="error"
        className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300"
      >
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p
        role="status"
        data-form-message="ok"
        className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      >
        {state.ok}
      </p>
    );
  }
  return null;
}

function Label({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold">
      {children}
    </label>
  );
}

/* -------------------------------------------------------------------------- */

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, EMPTY);

  return (
    <form action={action} className="grid gap-4">
      <Message state={state} />
      <input type="hidden" name="next" value={next} />

      <div>
        <Label htmlFor="email">이메일</Label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className="input"
        />
      </div>

      <div>
        <Label htmlFor="password">비밀번호</Label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>

      <Submit>로그인</Submit>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, action] = useActionState(changeOwnPassword, EMPTY);

  return (
    <form action={action} className="grid max-w-md gap-4">
      <Message state={state} />

      {forced && !state.error && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
          관리자가 정해 준 비밀번호를 쓰고 있습니다. 본인만 아는 값으로 바꿔 주세요.
        </p>
      )}

      <div>
        <Label htmlFor="currentPassword">현재 비밀번호</Label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>

      <div>
        <Label htmlFor="newPassword">새 비밀번호</Label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
          className="input"
        />
        <p className="mt-1 text-xs text-faint">영문자와 숫자를 포함해 10자 이상</p>
      </div>

      <div>
        <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="input"
        />
      </div>

      <Submit>비밀번호 변경</Submit>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

export function CreateUserForm() {
  const [state, action] = useActionState(createUser, EMPTY);

  return (
    <form action={action} className="grid max-w-md gap-4">
      <Message state={state} />

      <div>
        <Label htmlFor="name">이름</Label>
        <input id="name" name="name" required className="input" />
      </div>

      <div>
        <Label htmlFor="email">이메일</Label>
        <input id="email" name="email" type="email" required className="input" />
      </div>

      <div>
        <Label htmlFor="role">권한</Label>
        <select id="role" name="role" defaultValue="member" className="select">
          <option value="member">일반 — CRM 사용</option>
          <option value="admin">관리자 — 사용자 관리까지</option>
        </select>
      </div>

      <div>
        <Label htmlFor="password">초기 비밀번호</Label>
        <input
          id="password"
          name="password"
          type="text"
          required
          autoComplete="off"
          className="input"
        />
        <p className="mt-1 text-xs text-faint">
          영문자와 숫자를 포함해 10자 이상. 본인이 첫 로그인 때 바꾸게 됩니다.
        </p>
      </div>

      <Submit>사용자 추가</Submit>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

export function EditUserForm({
  user,
  isSelf,
}: {
  user: { id: string; name: string; email: string; role: string; isActive: boolean };
  isSelf: boolean;
}) {
  const [state, action] = useActionState(updateUser.bind(null, user.id), EMPTY);

  return (
    <form action={action} className="grid max-w-md gap-4">
      <Message state={state} />

      <div>
        <Label htmlFor="name">이름</Label>
        <input id="name" name="name" defaultValue={user.name} required className="input" />
      </div>

      <div>
        <Label htmlFor="email-display">이메일</Label>
        <input
          id="email-display"
          value={user.email}
          disabled
          className="input opacity-60"
        />
        <p className="mt-1 text-xs text-faint">이메일은 변경할 수 없습니다.</p>
      </div>

      <div>
        <Label htmlFor="role">권한</Label>
        <select id="role" name="role" defaultValue={user.role} className="select">
          <option value="member">일반 — CRM 사용</option>
          <option value="admin">관리자 — 사용자 관리까지</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={user.isActive}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        계정 활성화 (해제하면 로그인할 수 없습니다)
      </label>

      {isSelf && (
        <p className="text-xs text-faint">
          본인 계정이라 관리자 권한 해제와 비활성화는 막혀 있습니다.
        </p>
      )}

      <Submit>저장</Submit>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, action] = useActionState(
    resetUserPassword.bind(null, userId),
    EMPTY,
  );

  return (
    <form action={action} className="grid max-w-md gap-3">
      <Message state={state} />

      <div>
        <Label htmlFor="password">새 비밀번호</Label>
        <input
          id="password"
          name="password"
          type="text"
          required
          autoComplete="off"
          className="input"
        />
        <p className="mt-1 text-xs text-faint">
          영문자와 숫자를 포함해 10자 이상. 본인이 다음 로그인 때 바꾸게 됩니다.
        </p>
      </div>

      <button type="submit" className="btn btn-secondary justify-self-start">
        비밀번호 초기화
      </button>
    </form>
  );
}
