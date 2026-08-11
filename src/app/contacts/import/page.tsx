import Link from "next/link";
import { ContactImportForm } from "@/components/contact-import-form";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ContactImportPage() {
  await requireUser();

  return (
    <>
      <PageHeader
        title="담당자 일괄 등록"
        description="리멤버 등에서 내려받은 명함 파일을 한 번에 올립니다."
        action={
          <Link href="/contacts" className="btn btn-secondary">
            담당자 목록
          </Link>
        }
      />
      <ContactImportForm />
    </>
  );
}
