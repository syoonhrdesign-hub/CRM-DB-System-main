import { notFound } from "next/navigation";
import { GradeForm } from "@/components/grade-form";
import { Card, PageHeader } from "@/components/ui";
import { updateGrade } from "@/lib/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const organization = await db.organization.findUnique({
    where: { id },
    include: {
      trainings: {
        where: { status: "완료" },
        select: { startDate: true },
      },
    },
  });

  if (!organization) notFound();

  const save = updateGrade.bind(null, id);

  return (
    <>
      <PageHeader
        title="등급 평가"
        description={`${organization.name} · 5개 축을 1~5점으로 평가하면 가중 평균으로 등급이 정해집니다.`}
      />
      <Card>
        <GradeForm
          action={save}
          organization={organization}
          completedTrainings={organization.trainings}
        />
      </Card>
    </>
  );
}
