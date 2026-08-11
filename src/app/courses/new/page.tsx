import { CourseForm } from "@/components/course-form";
import { Card, PageHeader } from "@/components/ui";
import { createCourse } from "@/lib/actions";

export default function NewCoursePage() {
  return (
    <>
      <PageHeader
        title="교육 과정 등록"
        description="자사가 보유한 교육 과정을 등록합니다."
      />
      <Card>
        <CourseForm action={createCourse} />
      </Card>
    </>
  );
}
