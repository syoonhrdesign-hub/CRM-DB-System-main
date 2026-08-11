import Link from "next/link";
import { CourseImportForm } from "@/components/course-import-form";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CourseImportPage() {
  await requireUser();

  return (
    <>
      <PageHeader
        title="교육 과정 일괄 등록"
        description="기본 과정을 불러오거나, 엑셀로 한 번에 올립니다."
        action={
          <Link href="/courses" className="btn btn-secondary">
            과정 목록
          </Link>
        }
      />
      <CourseImportForm />
    </>
  );
}
