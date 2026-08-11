import { notFound } from "next/navigation";
import { OrganizationForm } from "@/components/organization-form";
import { DeleteButton } from "@/components/buttons";
import { Card, PageHeader } from "@/components/ui";
import { deleteOrganization, updateOrganization } from "@/lib/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditOrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const organization = await db.organization.findUnique({ where: { id } });
  if (!organization) notFound();

  const update = updateOrganization.bind(null, id);
  const remove = deleteOrganization.bind(null, id);

  return (
    <>
      <PageHeader title="고객사 수정" description={organization.name} />

      <Card>
        <OrganizationForm action={update} organization={organization} />
      </Card>

      <div className="mt-6 rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-bold">고객사 삭제</h2>
        <p className="mt-1 mb-3 text-sm text-muted">
          담당자·교육 이력·영업건·활동 기록이 모두 함께 삭제됩니다.
        </p>
        <DeleteButton
          action={remove}
          label="이 고객사 삭제"
          confirmMessage={`"${organization.name}" 과(와) 연결된 모든 기록이 삭제됩니다. 계속할까요?`}
        />
      </div>
    </>
  );
}
