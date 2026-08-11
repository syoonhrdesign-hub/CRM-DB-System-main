import type { Metadata } from "next";
import localFont from "next/font/local";
import { Nav } from "@/components/nav";
import { getCurrentUser } from "@/lib/session";
import "./globals.css";

/**
 * Pretendard — 한글 UI 폰트.
 *
 * 파일을 저장소에 넣어 두고 직접 불러온다. 외부 CDN 을 쓰면 사무실 서버가
 * 인터넷에 연결돼 있어야 글꼴이 뜨는데, 사내망 전용으로 쓸 수도 있기 때문이다.
 * 가변 폰트 하나로 100~900 굵기를 모두 처리한다.
 */
const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
  preload: true,
});

export const metadata: Metadata = {
  title: "교육사업 CRM",
  description: "기업·기관 고객사와 교육 진행 이력을 관리하는 CRM",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
   * 로그인 화면은 자체 레이아웃을 쓰므로 여기서 Nav 를 그리지 않는다.
   * 미들웨어가 미로그인 접근을 이미 막으므로, user 가 없다는 건 로그인 화면이라는 뜻이다.
   */
  const user = await getCurrentUser();

  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="min-h-screen bg-bg text-ink">
        {user ? (
          <>
            <Nav user={user} />
            <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
          </>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
