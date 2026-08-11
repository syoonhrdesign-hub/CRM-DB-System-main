import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { ResearchImportForm } from "@/components/research-import-form";
import { RESEARCH_SECTIONS } from "@/lib/research";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ResearchImportPage() {
  await requireUser();

  return (
    <>
      <PageHeader
        title="조사 파일 올리기"
        description="조사한 내용을 json 파일로 만들어 한 번에 넣습니다. 회사명이 같으면 덮어씁니다."
        action={
          <Link href="/research" className="btn btn-secondary">
            목록
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="파일 선택">
            <ResearchImportForm />
          </Card>

          <div className="mt-6">
            <Card title="파일 형식">
              <p className="text-sm text-muted">
                <code className="rounded bg-surface-2 px-1">companyName</code> 만 있으면 됩니다.
                나머지는 아는 것만 넣으면 되고, 모르는 이름의 항목이 섞여 있어도 무시합니다.
                여러 회사를 한 파일에 넣으려면 목록(<code className="rounded bg-surface-2 px-1">[ ]</code>)으로
                감싸면 됩니다.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-md bg-surface-2 p-3 text-xs">
{`[
  {
    "companyName": "롯데지알에스",
    "summary": "외식 프랜차이즈 대기업",
    "legalName": "롯데지알에스 주식회사",
    "groupName": "롯데그룹",
    "industry": "외식 프랜차이즈",
    "foundedYear": 1979,
    "address": "서울 송파구 백제고분로 217",
    "website": "https://www.lottegrs.com",
    "employeeTotal": 1200,
    "avgTenureYears": 7.4,
    "gaps": "퇴직율 — 비공개",
    "sources": [
      {
        "kind": "공시",
        "title": "2025 사업보고서 직원현황",
        "publisher": "DART",
        "url": "https://dart.fss.or.kr/...",
        "publishedAt": "2026-03-20"
      }
    ]
  }
]`}
              </pre>
            </Card>
          </div>
        </div>

        <Card title="넣을 수 있는 항목">
          <div className="grid gap-4">
            {RESEARCH_SECTIONS.map((s) => (
              <div key={s.id}>
                <p className="text-xs font-bold text-faint">{s.title}</p>
                <p className="mt-1 flex flex-wrap gap-1">
                  {s.fields.map((f) => (
                    <code
                      key={f.key}
                      className="rounded bg-surface-2 px-1 text-xs text-muted"
                      title={f.label}
                    >
                      {f.key}
                    </code>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
