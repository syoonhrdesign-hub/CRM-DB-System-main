import { DealForm } from "@/components/deal-form";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { createDeal } from "@/lib/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>;
}) {
  const { orgId } = await searchParams;

  const [organizations, contacts] = await Promise.all([
    db.organization.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.contact.findMany({
      orderBy: [{ organization: { name: "asc" } }, { name: "asc" }],
      select: { id: true, name: true, organization: { select: { name: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader title="영업건 등록" description="문의부터 계약까지 추적할 영업 기회를 등록합니다." />
      <Card>
        {organizations.length === 0 ? (
          <EmptyState
            message="영업건을 등록하려면 고객사가 먼저 있어야 합니다."
            actionLabel="고객사 등록"
            actionHref="/organizations/new"
          />
        ) : (
          <DealForm
            action={createDeal}
            organizations={organizations}
            contacts={contacts.map((c) => ({
              id: c.id,
              name: c.name,
              organizationName: c.organization.name,
            }))}
            defaultOrganizationId={orgId}
          />
        )}
      </Card>
    </>
  );
}
