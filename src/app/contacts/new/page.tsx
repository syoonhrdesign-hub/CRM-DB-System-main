import { ContactForm } from "@/components/contact-form";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { createContact } from "@/lib/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>;
}) {
  const { orgId } = await searchParams;

  const organizations = await db.organization.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader title="담당자 등록" />
      <Card>
        {organizations.length === 0 ? (
          <EmptyState
            message="담당자를 등록하려면 고객사가 먼저 있어야 합니다."
            actionLabel="고객사 등록"
            actionHref="/organizations/new"
          />
        ) : (
          <ContactForm
            action={createContact}
            organizations={organizations}
            defaultOrganizationId={orgId}
          />
        )}
      </Card>
    </>
  );
}
