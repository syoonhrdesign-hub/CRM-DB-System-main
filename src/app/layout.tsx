import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { getCurrentUser } from "@/lib/session";
import "./globals.css";

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
    <html lang="ko">
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
