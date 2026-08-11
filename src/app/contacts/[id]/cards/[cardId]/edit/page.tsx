import { notFound } from "next/navigation";
import { BusinessCardForm } from "@/components/business-card-form";
import { DeleteButton } from "@/components/buttons";
import { Card, PageHeader } from "@/components/ui";
import { deleteBusinessCard, updateBusinessCard } from "@/lib/actions";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditBusinessCardPage({
  params,
}: {
  params: Promise<{ id: string; cardId: string }>;
}) {
  const { id, cardId } = await params;

  const [contact, card] = await Promise.all([
    db.contact.findUnique({
      where: { id },
      include: { organization: { select: { name: true } } },
    }),
    db.businessCard.findUnique({ where: { id: cardId } }),
  ]);

  if (!contact || !card || card.contactId !== id) notFound();

  const update = updateBusinessCard.bind(null, cardId);
  const remove = deleteBusinessCard.bind(null, cardId);

  return (
    <>
      <PageHeader
        title="명함 수정"
        description={`${contact.name} · ${formatDate(card.receivedAt)} 수령`}
      />

      <Card>
        <BusinessCardForm
          action={update}
          card={card}
          contact={{ ...contact, organizationName: contact.organization.name }}
        />
      </Card>

      <div className="mt-6 rounded-xl border border-line bg-surface p-4">
        <DeleteButton
          action={remove}
          label="이 명함 삭제"
          confirmMessage="이 명함 기록을 삭제할까요?"
        />
      </div>
    </>
  );
}
