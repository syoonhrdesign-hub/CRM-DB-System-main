/**
 * 로그인하지 않은 접근을 모두 막는다.
 *
 * 페이지마다 검사를 넣으면 새 페이지를 만들 때 빠뜨리기 쉽다.
 * 여기서 기본을 "차단"으로 두고 로그인 화면만 예외로 연다.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session-token";

/** 로그인 없이 열어 두는 경로 */
const PUBLIC_PATHS = ["/login"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await readSessionToken(token);
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isPublic) {
    // 이미 로그인한 사람이 로그인 화면에 오면 대시보드로 보낸다.
    if (session) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!session) {
    const url = new URL("/login", request.url);
    // 로그인 후 원래 가려던 곳으로 되돌려 보내기 위해 남겨 둔다.
    if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);

    const response = NextResponse.redirect(url);
    // 만료·위조된 쿠키가 남아 매 요청마다 검증을 실패시키지 않도록 지운다.
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  /*
   * 정적 파일과 Next 내부 경로는 검사하지 않는다.
   * 로그인 화면 자체가 스타일 없이 뜨는 것을 막기 위해서다.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.png$).*)"],
};
