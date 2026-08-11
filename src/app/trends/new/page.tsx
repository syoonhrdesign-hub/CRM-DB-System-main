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
        description="DBR·KRIVET 처럼 구독하거나 직접 확인하는 자료를 남깁니다. 여기 남긴 글도 주간 브리핑 요약에 포함됩니다."
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
