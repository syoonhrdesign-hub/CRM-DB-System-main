import Link from "next/link";
import { DistributionForm } from "@/components/distribution-form";
import { PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewDistributionPage() {
  await requireUser();

  const organizations = await db.organization.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader
        title="안내 페이지 만들기"
        description="만들고 나면 링크가 나옵니다. 그 링크만 고객사에 전달하면 됩니다."
        action={
          <Link href="/distributions" className="btn btn-secondary">
            목록
          </Link>
        }
      />
      <DistributionForm organizations={organizations} />
    </>
  );
}
