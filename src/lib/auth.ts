/**
 * 비밀번호 해싱과 검증.
 *
 * Node 내장 scrypt 를 쓴다. bcrypt 처럼 네이티브 빌드가 필요한 의존성을 피하려는 것이고,
 * scrypt 는 Node 표준 라이브러리에 있으면서 메모리 하드해서 이 용도에 충분하다.
 *
 * node:crypto 를 쓰므로 이 파일은 서버에서만 불러야 한다.
 * 미들웨어(Edge 런타임)에서 필요한 토큰 검증은 session-token.ts 에 따로 있다.
 */

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const derived = await scryptAsync(password, Buffer.from(saltHex, "hex"), KEY_LENGTH);
  const expected = Buffer.from(hashHex, "hex");

  // 길이가 다르면 timingSafeEqual 이 예외를 던지므로 먼저 확인한다.
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

/** 비밀번호 규칙 — 통과하면 null, 아니면 사용자에게 보여 줄 문구를 돌려준다. */
export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "비밀번호는 10자 이상이어야 합니다.";
  if (!/[a-zA-Z]/.test(password)) return "영문자를 포함해 주세요.";
  if (!/[0-9]/.test(password)) return "숫자를 포함해 주세요.";
  return null;
}
