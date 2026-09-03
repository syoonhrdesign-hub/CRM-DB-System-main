/**
 * 로그인 실패 잠금.
 *
 * 같은 이메일로 비밀번호를 연달아 틀리면 잠시 막는다. 비밀번호를 무한히
 * 대입해 보는 공격을 느리게 만드는 것이 목적이다.
 *
 * 메모리에만 둔다 — 서버를 다시 켜면 풀린다. 서버 PC 한 대에서 도는 3인
 * 규모라 DB 표까지 만들 이유가 없고, 켜자마자 잠긴 상태로 시작하는 쪽이
 * 오히려 더 불편하다.
 */

export const MAX_FAILURES = 5;
export const LOCK_MINUTES = 10;

type Entry = { failures: number; lockedUntil: number | null };

/*
 * 개발 서버는 파일을 고칠 때마다 모듈을 다시 읽어 Map 이 비워진다.
 * globalThis 에 매달아 두면 그 사이에도 유지된다.
 */
const store: Map<string, Entry> =
  (globalThis as { __loginThrottle?: Map<string, Entry> }).__loginThrottle ??
  ((globalThis as { __loginThrottle?: Map<string, Entry> }).__loginThrottle = new Map());

/** 잠겨 있으면 남은 분 수(1 이상), 아니면 0 */
export function lockedMinutes(email: string, now = Date.now()): number {
  const e = store.get(email);
  if (!e?.lockedUntil) return 0;
  if (e.lockedUntil <= now) {
    store.delete(email);
    return 0;
  }
  return Math.max(1, Math.ceil((e.lockedUntil - now) / 60_000));
}

/** 실패를 하나 더한다. 잠기는 순간이면 true */
export function recordFailure(email: string, now = Date.now()): boolean {
  const e = store.get(email) ?? { failures: 0, lockedUntil: null };
  e.failures += 1;
  if (e.failures >= MAX_FAILURES) {
    e.lockedUntil = now + LOCK_MINUTES * 60_000;
    e.failures = 0;
    store.set(email, e);
    return true;
  }
  store.set(email, e);
  return false;
}

export function clearFailures(email: string): void {
  store.delete(email);
}
