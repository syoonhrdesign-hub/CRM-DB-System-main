import { ActivityForm } from "@/components/activity-form";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { createActivity } from "@/lib/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>;
}) {
  const { orgId } = await searchParams;

  const [organizations, contacts, deals] = await Promise.all([
    db.organization.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.contact.findMany({
      orderBy: [{ organization: { name: "asc" } }, { name: "asc" }],
      select: { id: true, name: true, organization: { select: { name: true } } },
    }),
    db.deal.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, organization: { select: { name: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader title="활동 기록" description="고객사와의 접촉 내용과 후속 조치를 남깁니다." />
      <Card>
        {organizations.length === 0 ? (
          <EmptyState
            message="활동을 기록하려면 고객사가 먼저 있어야 합니다."
            actionLabel="고객사 등록"
            actionHref="/organizations/new"
          />
        ) : (
          <ActivityForm
            action={createActivity}
            organizations={organizations}
            contacts={contacts.map((c) => ({
              id: c.id,
              name: c.name,
              organizationName: c.organization.name,
            }))}
            deals={deals.map((d) => ({
              id: d.id,
              title: d.title,
              organizationName: d.organization.name,
            }))}
            defaultOrganizationId={orgId}
          />
        )}
      </Card>
    </>
  );
}
