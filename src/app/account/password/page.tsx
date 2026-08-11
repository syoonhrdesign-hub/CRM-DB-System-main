import { ChangePasswordForm } from "@/components/auth-forms";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader
        title="비밀번호 변경"
        description={`${user.name} (${user.email})`}
      />
      <Card>
        <ChangePasswordForm forced={user.mustChangePassword} />
      </Card>
    </>
  );
}
