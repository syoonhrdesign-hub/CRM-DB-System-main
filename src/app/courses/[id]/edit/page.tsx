import { notFound } from "next/navigation";
import { CourseForm } from "@/components/course-form";
import { DeleteButton } from "@/components/buttons";
import { Card, PageHeader } from "@/components/ui";
import { deleteCourse, updateCourse } from "@/lib/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const course = await db.course.findUnique({
    where: { id },
    include: { _count: { select: { trainings: true } } },
  });

  if (!course) notFound();

  const update = updateCourse.bind(null, id);
  const remove = deleteCourse.bind(null, id);

  return (
    <>
      <PageHeader title="교육 과정 수정" description={course.name} />

      <Card>
        <CourseForm action={update} course={course} />
      </Card>

      <div className="mt-6 rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-bold">과정 삭제</h2>
        <p className="mt-1 mb-3 text-sm text-muted">
          {course._count.trainings > 0
            ? `이 과정으로 진행한 교육 ${course._count.trainings}건은 삭제되지 않고, 과정 연결만 해제됩니다. 운영을 멈추는 것이라면 삭제 대신 "운영 중인 과정" 체크를 해제하세요.`
            : "이 과정으로 진행한 교육이 아직 없습니다."}
        </p>
        <DeleteButton
          action={remove}
          label="이 과정 삭제"
          confirmMessage={`"${course.name}" 과정을 삭제할까요?`}
        />
      </div>
    </>
  );
}
