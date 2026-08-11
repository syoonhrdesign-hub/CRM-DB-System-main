import { LoginForm } from "@/components/auth-forms";
import { BrandMark, BrandStripe } from "@/components/brand";

export const dynamic = "force-dynamic";

export const metadata = { title: "로그인 · neoize CRM" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "/" } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <BrandMark className="mx-auto h-12 w-12" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">neoize CRM</h1>
        <p className="mt-1 text-sm text-muted">Respect differences</p>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-[var(--shadow-md)]">
        <BrandStripe className="rounded-none" />
        <div className="p-6">
          <LoginForm next={next} />
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-faint">
        계정이 없으면 관리자에게 요청해 주세요.
      </p>
    </main>
  );
}
