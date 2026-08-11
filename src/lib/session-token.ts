/**
 * 세션 토큰 — 서명과 검증.
 *
 * 미들웨어는 Edge 런타임에서 돌기 때문에 node:crypto 를 쓸 수 없다.
 * 그래서 토큰 관련 코드만 여기로 떼어 두고 Web Crypto 기반인 jose 만 쓴다.
 * 비밀번호 해싱(node:crypto)은 auth.ts 에 있고, 서버에서만 불린다.
 */

import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "crm_session";

/** 세션 유효기간 — 담당자가 매일 로그인하지 않아도 되게 넉넉히 둔다. */
export const SESSION_DAYS = 14;

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: string;
};

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET 환경변수가 없거나 너무 짧습니다(32자 이상). " +
        "`openssl rand -base64 32` 로 만들어 .env 에 넣어 주세요.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

/** 토큰이 유효하면 내용을, 아니면 null. 예외를 던지지 않는다. */
export async function readSessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const { userId, email, name, role } = payload as Record<string, unknown>;
    if (typeof userId !== "string" || typeof email !== "string") return null;
    return {
      userId,
      email,
      name: typeof name === "string" ? name : email,
      role: typeof role === "string" ? role : "member",
    };
  } catch {
    return null;
  }
}
