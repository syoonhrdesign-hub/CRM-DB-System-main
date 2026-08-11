import Link from "next/link";
import { CreateUserForm } from "@/components/auth-forms";
import { Card, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader
        title="사용자 추가"
        description="초기 비밀번호를 정해 전달하면, 본인이 첫 로그인 때 바꿉니다."
      />
      <Card>
        <CreateUserForm />
      </Card>
      <div className="mt-4">
        <Link href="/users" className="text-sm text-muted hover:underline">
          ← 사용자 목록
        </Link>
      </div>
    </>
  );
}
