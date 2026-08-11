import Link from "next/link";
import { ImportForm } from "@/components/import-form";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  await requireUser();

  return (
    <>
      <PageHeader
        title="고객사 일괄 등록"
        description="엑셀로 관리하던 명단을 한 번에 올립니다."
        action={
          <Link href="/organizations" className="btn btn-secondary">
            고객사 목록
          </Link>
        }
      />
      <ImportForm />
    </>
  );
}
