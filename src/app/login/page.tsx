import { LoginForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";

export const metadata = { title: "로그인 · 교육사업 CRM" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "/" } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <span className="grid h-12 w-12 mx-auto place-items-center rounded-xl bg-accent text-xl font-bold text-white">
          E
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">교육사업 CRM</h1>
        <p className="mt-1 text-sm text-muted">고객사 정보를 다루는 시스템입니다.</p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-6">
        <LoginForm next={next} />
      </div>

      <p className="mt-6 text-center text-xs text-faint">
        계정이 없으면 관리자에게 요청해 주세요.
      </p>
    </main>
  );
}
