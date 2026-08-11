import { notFound } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { Card, PageHeader } from "@/components/ui";
import { updateProfile } from "@/lib/actions";
import { db } from "@/lib/db";
import { profileCompleteness } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const organization = await db.organization.findUnique({
    where: { id },
    include: { profile: true },
  });

  if (!organization) notFound();

  const save = updateProfile.bind(null, id);
  const completeness = profileCompleteness(organization.profile);

  return (
    <>
      <PageHeader
        title="기업 프로파일"
        description={`${organization.name} · 파악한 항목 ${completeness.filled}/${completeness.total} (${completeness.percent}%)`}
      />

      {completeness.missing.length > 0 && (
        <div className="mb-6 rounded-xl border border-line bg-surface p-4">
          <h2 className="text-sm font-bold">다음 통화에서 물어볼 것</h2>
          <p className="mt-1 text-sm text-muted">
            아직 비어 있는 {completeness.missing.length}개 항목입니다. 통화 중에
            자연스럽게 확인하고 채워 두면 제안 타이밍이 보입니다.
          </p>
          <ul className="mt-3 grid gap-1.5">
            {completeness.missing.map((item) => (
              <li key={String(item.key)} className="text-sm">
                <span className="font-semibold">{item.label}</span>
                <span className="text-muted"> — “{item.question}”</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <ProfileForm
          action={save}
          profile={organization.profile}
          organizationName={organization.name}
          organizationId={organization.id}
        />
      </Card>
    </>
  );
}
