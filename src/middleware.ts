/**
 * 로그인하지 않은 접근을 모두 막는다.
 *
 * 페이지마다 검사를 넣으면 새 페이지를 만들 때 빠뜨리기 쉽다.
 * 여기서 기본을 "차단"으로 두고 로그인 화면만 예외로 연다.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session-token";

/**
 * 로그인 없이 열어 두는 경로.
 *
 * /code 는 교육생이 자기 진단 코드를 확인하는 공개 페이지다.
 * 교육생은 이 CRM 의 사용자가 아니므로 로그인을 요구할 수 없다.
 * 대신 주소(slug)를 무작위로 만들고, 이름을 정확히 맞춰야만
 * 한 건이 나오도록 해서 명단이 통째로 새지 않게 한다.
 */
const PUBLIC_PATHS = ["/login", "/code"];

/**
 * 트렌드 자동 수집만 사람 없이 들어온다.
 *
 * 작업 스케줄러가 부르는 것이라 로그인할 방법이 없다. 대신 .env 의
 * TRENDS_CRON_TOKEN 과 맞는 요청만 통과시킨다. 토큰을 정해 두지 않았으면
 * 아무도 통과하지 못한다 — 값이 비었을 때 열리는 쪽이 훨씬 위험하다.
 */
const CRON_PATH = "/api/trends/collect";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === CRON_PATH) {
    const expected = process.env.TRENDS_CRON_TOKEN;
    const given = request.headers.get("x-cron-token");
    if (expected && given === expected) return NextResponse.next();
    return new NextResponse("unauthorized", { status: 401 });
  }

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
