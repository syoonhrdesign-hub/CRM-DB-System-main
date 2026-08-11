import { notFound } from "next/navigation";
import { ActivityForm } from "@/components/activity-form";
import { DeleteButton } from "@/components/buttons";
import { Card, PageHeader } from "@/components/ui";
import { deleteActivity, updateActivity } from "@/lib/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [activity, organizations, contacts, deals] = await Promise.all([
    db.activity.findUnique({
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
    db.deal.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, organization: { select: { name: true } } },
    }),
  ]);

  if (!activity) notFound();

  const update = updateActivity.bind(null, id);
  const remove = deleteActivity.bind(null, id);

  return (
    <>
      <PageHeader
        title="활동 기록 수정"
        description={`${activity.organization.name} · ${activity.summary}`}
      />

      <Card>
        <ActivityForm
          action={update}
          activity={activity}
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
        />
      </Card>

      <div className="mt-6 rounded-xl border border-line bg-surface p-4">
        <DeleteButton
          action={remove}
          label="이 활동 기록 삭제"
          confirmMessage="이 활동 기록을 삭제할까요?"
        />
      </div>
    </>
  );
}
