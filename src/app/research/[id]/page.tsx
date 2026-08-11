import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader } from "@/components/ui";
import { SourceForm } from "@/components/source-form";
import { AutoFillButton } from "@/components/auto-research-buttons";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { RESEARCH_SECTIONS, parseGaps, researchGaps } from "@/lib/research";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * 상담 화면.
 *
 * 통화하면서 훑는 화면이라 편집 요소를 넣지 않았다. 값이 있는 항목만 위에서
 * 아래로 읽히게 하고, 비어 있는 항목은 맨 아래에 "아직 안 채운 것"으로 모아 둔다.
 * 확인해 봤지만 공개되지 않은 항목(gaps)은 따로 표시한다 — 둘은 다른 뜻이다.
 */
export default async function ResearchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const research = await db.companyResearch.findUnique({
    where: { id },
    include: {
      organization: { select: { id: true, name: true } },
      sources: { orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }] },
    },
  });

  if (!research) notFound();

  const record = research as unknown as Record<string, unknown>;
  const g = researchGaps(record);
  const gaps = parseGaps(research.gaps);

  const value = (key: string): string | null => {
    const v = record[key];
    if (v === null || v === undefined || v === "") return null;
    return String(v);
  };

  return (
    <>
      <PageHeader
        title={research.companyName}
        description={[
          research.legalName,
          research.groupName ? `${research.groupName} 계열` : null,
          `채운 항목 ${g.filled}/${g.total}`,
          research.researchedAt ? `조사 ${formatDate(research.researchedAt)}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        action={
          <div className="flex flex-wrap gap-2">
            {research.organization && (
              <Link
                href={`/organizations/${research.organization.id}`}
                className="btn btn-secondary"
              >
                고객사 화면
              </Link>
            )}
            <Link href={`/research/${id}/edit`} className="btn btn-primary">
              수정
            </Link>
          </div>
        }
      />

      {research.summary && (
        <div className="mb-6 rounded-card border border-accent bg-accent-soft p-4">
          <p className="text-sm font-semibold text-accent">{research.summary}</p>
        </div>
      )}

      <div className="grid gap-6">
        {RESEARCH_SECTIONS.map((section) => {
          const filled = section.fields.filter((f) => value(f.key) !== null);
          if (filled.length === 0) return null;

          return (
            <Card key={section.id} title={section.title}>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {filled.map((f) => {
                  const v = value(f.key)!;
                  const isLong = f.kind === "textarea";
                  const isUrl = /^https?:\/\//i.test(v);
                  return (
                    <div key={f.key} className={isLong ? "sm:col-span-2" : undefined}>
                      <dt className="text-xs font-semibold text-faint">{f.label}</dt>
                      <dd className="mt-0.5 text-sm">
                        {isUrl ? (
                          <a
                            href={v}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="break-all text-accent hover:underline"
                          >
                            {v}
                          </a>
                        ) : isLong ? (
                          <span className="whitespace-pre-wrap">{v}</span>
                        ) : (
                          <span className="font-medium">{v}</span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </Card>
          );
        })}

        {/* 확인해 봤지만 없는 것 — 빈칸과 구분해서 보여준다 */}
        {gaps.length > 0 && (
          <Card title="확인 안 된 것">
            <p className="text-sm text-muted">
              찾아봤지만 공개되지 않은 항목입니다. 아래는 통화로 직접 물어보는 편이 빠릅니다.
            </p>
            <ul className="mt-3 grid gap-1.5">
              {gaps.map((line) => (
                <li key={line} className="flex gap-2 text-sm">
                  <span className="text-faint">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* 근거 */}
        <Card title={`근거 (${research.sources.length})`}>
          {research.sources.length === 0 ? (
            <p className="text-sm text-muted">
              아직 근거가 없습니다. 어디서 본 내용인지 남겨 두면 나중에 다시 확인할 수 있습니다.
            </p>
          ) : (
            <ul className="grid gap-2.5">
              {research.sources.map((s) => (
                <li key={s.id} className="flex flex-wrap items-baseline gap-2">
                  <Badge tone="gray">{s.kind}</Badge>
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      {s.title}
                    </a>
                  ) : (
                    <span className="text-sm font-medium">{s.title}</span>
                  )}
                  <span className="tnum text-xs text-faint">
                    {[s.publisher, s.publishedAt ? formatDate(s.publishedAt) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-line pt-4">
            <SourceForm researchId={id} />
          </div>
        </Card>

        {/* 공시 자동 채우기 */}
        {g.missing.length > 0 && (
          <Card title="공시로 채우기">
            <AutoFillButton researchId={id} />
          </Card>
        )}

        {/* 아직 안 채운 것 */}
        {g.missing.length > 0 && (
          <Card title={`아직 안 채운 것 (${g.missing.length})`}>
            <p className="flex flex-wrap gap-1.5">
              {g.missing.map((f) => (
                <span
                  key={f.key}
                  className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted"
                >
                  {f.label}
                </span>
              ))}
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
