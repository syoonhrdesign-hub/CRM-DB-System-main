import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { ManualItemForm } from "@/components/trend-manual-form";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function TrendManualPage() {
  await requireUser();

  return (
    <>
      <PageHeader
        title="직접 등록"
        description="RSS 가 없는 기관 자료(KRIVET 이슈브리프, 협회 보고서 등)를 손으로 남깁니다."
        action={
          <Link href="/trends" className="btn btn-secondary">
            목록
          </Link>
        }
      />
      <Card>
        <ManualItemForm />
      </Card>
    </>
  );
}
