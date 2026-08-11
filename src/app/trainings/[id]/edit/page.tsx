import { notFound } from "next/navigation";
import { TrainingForm } from "@/components/training-form";
import { DeleteButton } from "@/components/buttons";
import { Card, PageHeader } from "@/components/ui";
import { deleteTraining, updateTraining } from "@/lib/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditTrainingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [training, organizations, courses] = await Promise.all([
    db.training.findUnique({
      where: { id },
      include: { organization: { select: { name: true } } },
    }),
    db.organization.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    // 수정 화면에서는 중단된 과정도 보여야 한다 — 과거 이력이 그 과정에 걸려 있을 수 있다.
    db.course.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  if (!training) notFound();

  const update = updateTraining.bind(null, id);
  const remove = deleteTraining.bind(null, id);

  return (
    <>
      <PageHeader
        title="교육 수정"
        description={`${training.organization.name} · ${training.title}`}
      />

      <Card>
        <TrainingForm
          action={update}
          training={training}
          organizations={organizations}
          courses={courses}
        />
      </Card>

      <div className="mt-6 rounded-xl border border-line bg-surface p-4">
        <DeleteButton
          action={remove}
          label="이 교육 기록 삭제"
          confirmMessage={`"${training.title}" 기록을 삭제할까요?`}
        />
      </div>
    </>
  );
}
