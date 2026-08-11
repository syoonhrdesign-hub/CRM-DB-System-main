import Link from "next/link";
import { notFound } from "next/navigation";
import { EditUserForm, ResetPasswordForm } from "@/components/auth-forms";
import { Card, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireAdmin();
  const { id } = await params;

  const user = await db.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <>
      <PageHeader
        title={`${user.name} 계정`}
        description={`등록 ${formatDate(user.createdAt)} · 마지막 로그인 ${
          user.lastLoginAt ? formatDate(user.lastLoginAt) : "없음"
        }`}
      />

      <div className="grid gap-6">
        <Card title="계정 정보">
          <EditUserForm user={user} isSelf={me.id === user.id} />
        </Card>

        <Card
          title="비밀번호 초기화"
          action={
            <span className="text-xs text-faint">
              본인이 비밀번호를 잊었을 때만 사용
            </span>
          }
        >
          <ResetPasswordForm userId={user.id} />
        </Card>
      </div>

      <div className="mt-4">
        <Link href="/users" className="text-sm text-muted hover:underline">
          ← 사용자 목록
        </Link>
      </div>
    </>
  );
}
