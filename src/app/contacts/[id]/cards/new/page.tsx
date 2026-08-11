import { notFound } from "next/navigation";
import { BusinessCardForm } from "@/components/business-card-form";
import { Card, PageHeader } from "@/components/ui";
import { createBusinessCard } from "@/lib/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewBusinessCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contact = await db.contact.findUnique({
    where: { id },
    include: { organization: { select: { name: true } } },
  });

  if (!contact) notFound();

  return (
    <>
      <PageHeader
        title="명함 등록"
        description={`${contact.organization.name} · ${contact.name}`}
      />
      <Card>
        <BusinessCardForm
          action={createBusinessCard}
          contact={{ ...contact, organizationName: contact.organization.name }}
        />
      </Card>
    </>
  );
}
