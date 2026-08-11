import { TrainingForm } from "@/components/training-form";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { createTraining } from "@/lib/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewTrainingPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>;
}) {
  const { orgId } = await searchParams;

  const [organizations, courses] = await Promise.all([
    db.organization.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.course.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  return (
    <>
      <PageHeader title="교육 등록" description="고객사에 진행할(했던) 교육을 기록합니다." />
      <Card>
        {organizations.length === 0 ? (
          <EmptyState
            message="교육을 등록하려면 고객사가 먼저 있어야 합니다."
            actionLabel="고객사 등록"
            actionHref="/organizations/new"
          />
        ) : (
          <TrainingForm
            action={createTraining}
            organizations={organizations}
            courses={courses}
            defaultOrganizationId={orgId}
          />
        )}
      </Card>
    </>
  );
}
