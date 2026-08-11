import { notFound } from "next/navigation";
import { ContactForm } from "@/components/contact-form";
import { DeleteButton } from "@/components/buttons";
import { Card, PageHeader } from "@/components/ui";
import { deleteContact, updateContact } from "@/lib/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [contact, organizations] = await Promise.all([
    db.contact.findUnique({
      where: { id },
      include: { organization: { select: { name: true } } },
    }),
    db.organization.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!contact) notFound();

  // 후임 지정 목록 — 같은 고객사의 다른 담당자만
  const siblings = await db.contact.findMany({
    where: { organizationId: contact.organizationId, NOT: { id } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, department: true },
  });

  const update = updateContact.bind(null, id);
  const remove = deleteContact.bind(null, id);

  return (
    <>
      <PageHeader
        title="담당자 수정"
        description={`${contact.organization.name} · ${contact.name}`}
      />

      <Card>
        <ContactForm
          action={update}
          contact={contact}
          organizations={organizations}
          siblings={siblings}
        />
      </Card>

      <div className="mt-6 rounded-xl border border-line bg-surface p-4">
        <DeleteButton
          action={remove}
          label="이 담당자 삭제"
          confirmMessage={`"${contact.name}" 담당자를 삭제할까요?`}
        />
      </div>
    </>
  );
}
