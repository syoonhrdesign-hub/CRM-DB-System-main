import { notFound } from "next/navigation";
import { CodeLookup } from "@/components/code-lookup";
import { BrandMark, BrandStripe } from "@/components/brand";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * 교육생이 자기 진단 코드를 찾아가는 공개 페이지.
 *
 * 로그인이 없다. 고객사가 이 링크만 전달하면 교육생 각자가 확인한다.
 * 대부분 휴대폰으로 열기 때문에 한 줄 배치를 기본으로 하고,
 * "무엇을 해야 하는지"가 위에서 아래로 순서대로 읽히게 했다.
 */
export default async function CodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const dist = await db.codeDistribution.findUnique({
    where: { slug },
    select: {
      headline: true,
      title: true,
      subtitle: true,
      guide: true,
      eventAt: true,
      eventTime: true,
      venue: true,
      audience: true,
      instructor: true,
      targetUrl: true,
      notices: true,
      inquiry: true,
      verifyField: true,
      isActive: true,
      opensAt: true,
      closesAt: true,
      organization: { select: { name: true } },
    },
  });

  if (!dist) notFound();

  const now = new Date();
  const closed =
    !dist.isActive ||
    (dist.opensAt && now < dist.opensAt) ||
    (dist.closesAt && now > dist.closesAt);

  const info = [
    { label: "교육 일시", value: [formatDate(dist.eventAt), dist.eventTime].filter(Boolean).join(" ") },
    { label: "교육 장소", value: dist.venue },
    { label: "대상", value: dist.audience },
    { label: "강사", value: dist.instructor },
  ].filter((i) => i.value);

  const notices = (dist.notices ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const STEPS = [
    { n: "01", title: "검사코드 확인하기", desc: "아래에서 본인의 검사코드를 확인합니다." },
    { n: "02", title: "이름 검색 → 코드 복사", desc: "본인의 검사코드를 복사합니다." },
    { n: "03", title: "사이트로 이동", desc: "검사 페이지로 이동합니다." },
    { n: "04", title: "코드 붙여넣기 → 검사하기", desc: "검사를 완료합니다." },
  ];

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      {/* 머리말 */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <BrandMark className="h-7 w-7" />
          {dist.organization && (
            <span className="text-sm font-bold">{dist.organization.name}</span>
          )}
        </div>
        <BrandStripe className="mt-2" />

        {dist.headline && (
          <p className="mt-5 text-sm text-muted">{dist.headline}</p>
        )}
        <h1 className="mt-1 text-2xl font-bold leading-snug tracking-tight">
          {dist.title}
        </h1>
        {dist.subtitle && (
          <p className="mt-2 text-sm text-muted">{dist.subtitle}</p>
        )}
      </div>

      {/* 교육 정보 */}
      {info.length > 0 && (
        <section className="mb-5 rounded-card border border-line bg-surface p-4 shadow-[var(--shadow-sm)]">
          <dl className="grid grid-cols-2 gap-4">
            {info.map((i) => (
              <div key={i.label}>
                <dt className="text-xs font-semibold text-faint">{i.label}</dt>
                <dd className="mt-0.5 text-sm font-medium">{i.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* 진단 기간 · 절차 */}
      <section className="mb-5 rounded-card border border-line bg-surface p-4 shadow-[var(--shadow-sm)]">
        <h2 className="text-sm font-bold">사전 진단 안내</h2>

        {(dist.opensAt || dist.closesAt) && (
          <p className="tnum mt-2 rounded-md bg-accent-soft px-3 py-2 text-sm font-semibold text-accent">
            진단 기간 {formatDate(dist.opensAt)} ~ {formatDate(dist.closesAt)}
          </p>
        )}

        {dist.guide && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{dist.guide}</p>
        )}

        <ol className="mt-4 grid gap-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-3">
              <span className="tnum grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-white">
                {s.n}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-xs text-muted">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 코드 찾기 — 이 페이지의 목적 */}
      <section className="mb-5 overflow-hidden rounded-card border border-accent bg-surface shadow-[var(--shadow-md)]">
        <div className="border-b border-line bg-accent-soft px-4 py-3">
          <h2 className="text-sm font-bold text-accent">내 검사코드 찾기</h2>
          <p className="mt-0.5 text-xs text-muted">
            이름을 검색해 본인의 검사코드를 복사한 뒤 진단 사이트로 이동해 주세요.
          </p>
        </div>
        <div className="p-4">
          {closed ? (
            <p className="py-4 text-center text-sm text-muted">
              지금은 조회할 수 없습니다.
              <br />
              담당자에게 문의해 주세요.
            </p>
          ) : (
            <CodeLookup
              slug={slug}
              verifyField={dist.verifyField}
              targetUrl={dist.targetUrl}
            />
          )}
        </div>
      </section>

      {/* 유의사항 */}
      {notices.length > 0 && (
        <section className="mb-5 rounded-card border border-line bg-surface p-4">
          <h2 className="text-sm font-bold">유의사항</h2>
          <ul className="mt-2 grid gap-1.5">
            {notices.map((n) => (
              <li key={n} className="flex gap-2 text-sm text-muted">
                <span className="text-faint">·</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 문의 */}
      {dist.inquiry && (
        <section className="rounded-card border border-line bg-surface-2 p-4">
          <h2 className="text-sm font-bold">문의</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
            {dist.inquiry}
          </p>
        </section>
      )}

      <p className="mt-6 text-center text-xs text-faint">
        neoize · Respect differences
      </p>
    </main>
  );
}
