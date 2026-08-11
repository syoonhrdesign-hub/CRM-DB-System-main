/**
 * 서버 컴포넌트·서버 액션에서 현재 로그인한 사용자를 읽는다.
 *
 * 미들웨어가 이미 토큰을 검증해 미로그인 접근을 막지만, 여기서 DB 를 한 번 더 확인한다.
 * 계정을 비활성화했는데 발급된 토큰이 남아 있으면 그대로 통과해 버리기 때문이다.
 */

import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, readSessionToken } from "./session-token";
import { db } from "./db";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
};

/**
 * 한 요청 안에서 여러 번 불러도 DB 조회는 한 번만 한다.
 * (레이아웃과 페이지가 각각 호출하기 때문)
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await readSessionToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
    },
  });

  if (!user || !user.isActive) return null;

  const { isActive: _isActive, ...rest } = user;
  return rest;
});

/** 로그인하지 않았으면 로그인 화면으로 보낸다. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** 관리자가 아니면 되돌려 보낸다. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
