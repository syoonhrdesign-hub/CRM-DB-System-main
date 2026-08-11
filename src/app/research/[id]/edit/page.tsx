import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { ResearchForm } from "@/components/research-form";
import { updateResearch } from "@/lib/research-actions";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function EditResearchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const [research, organizations] = await Promise.all([
    db.companyResearch.findUnique({ where: { id } }),
    db.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!research) notFound();

  return (
    <>
      <PageHeader title={`${research.companyName} — 조사 내용 수정`} />
      <Card>
        <ResearchForm
          action={updateResearch.bind(null, id)}
          research={research as unknown as Record<string, unknown>}
          organizations={organizations}
        />
      </Card>
    </>
  );
}
