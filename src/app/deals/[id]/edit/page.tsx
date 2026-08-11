import { notFound } from "next/navigation";
import { DealForm } from "@/components/deal-form";
import { DeleteButton } from "@/components/buttons";
import { Card, PageHeader } from "@/components/ui";
import { deleteDeal, updateDeal } from "@/lib/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [deal, organizations, contacts] = await Promise.all([
    db.deal.findUnique({
      where: { id },
      include: { organization: { select: { name: true } } },
    }),
    db.organization.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.contact.findMany({
      orderBy: [{ organization: { name: "asc" } }, { name: "asc" }],
      select: { id: true, name: true, organization: { select: { name: true } } },
    }),
  ]);

  if (!deal) notFound();

  const update = updateDeal.bind(null, id);
  const remove = deleteDeal.bind(null, id);

  return (
    <>
      <PageHeader
        title="영업건 수정"
        description={`${deal.organization.name} · ${deal.title}`}
      />

      <Card>
        <DealForm
          action={update}
          deal={deal}
          organizations={organizations}
          contacts={contacts.map((c) => ({
            id: c.id,
            name: c.name,
            organizationName: c.organization.name,
          }))}
        />
      </Card>

      <div className="mt-6 rounded-xl border border-line bg-surface p-4">
        <DeleteButton
          action={remove}
          label="이 영업건 삭제"
          confirmMessage={`"${deal.title}" 영업건을 삭제할까요?`}
        />
      </div>
    </>
  );
}
