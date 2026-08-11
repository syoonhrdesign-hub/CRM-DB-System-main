import { Card, PageHeader } from "@/components/ui";
import { ResearchForm } from "@/components/research-form";
import { createResearch } from "@/lib/research-actions";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewResearchPage() {
  await requireUser();

  const organizations = await db.organization.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader
        title="새 조사"
        description="회사명만 넣고 시작해도 됩니다. 나머지는 알아낼 때마다 채우면 됩니다."
      />
      <Card>
        <ResearchForm
          action={createResearch}
          organizations={organizations}
          submitLabel="조사 시작"
        />
      </Card>
    </>
  );
}
