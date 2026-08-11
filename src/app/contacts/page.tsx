import Link from "next/link";
import { db } from "@/lib/db";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  const contacts = await db.contact.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { department: { contains: q } },
            { position: { contains: q } },
            { email: { contains: q } },
            { organization: { name: { contains: q } } },
          ],
        }
      : undefined,
    orderBy: [{ organization: { name: "asc" } }, { isPrimary: "desc" }, { name: "asc" }],
    include: { organization: { select: { id: true, name: true } } },
  });

  return (
    <>
      <PageHeader
        title="담당자"
        description={`총 ${contacts.length}명`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/contacts/import" className="btn btn-secondary">
              명함 일괄 등록
            </Link>
            <Link href="/contacts/new" className="btn btn-primary">
              + 담당자 등록
            </Link>
          </div>
        }
      />

      <form className="mb-4 flex flex-wrap gap-2" action="/contacts">
        <input
          name="q"
          defaultValue={q}
          placeholder="이름 · 부서 · 기관명 검색"
          className="input max-w-xs"
        />
        <button type="submit" className="btn btn-secondary">
          검색
        </button>
        {q && (
          <Link href="/contacts" className="btn btn-secondary">
            초기화
          </Link>
        )}
      </form>

      <Card padded={false}>
        {contacts.length === 0 ? (
          <EmptyState
            message={q ? "조건에 맞는 담당자가 없습니다." : "등록된 담당자가 없습니다."}
            actionLabel="담당자 등록"
            actionHref="/contacts/new"
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>이름</Th>
                <Th>고객사</Th>
                <Th>부서</Th>
                <Th>직급</Th>
                <Th>휴대폰</Th>
                <Th>이메일</Th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-surface-2">
                  <Td>
                    <span className="inline-flex items-center gap-1.5">
                      <Link
                        href={`/contacts/${c.id}/edit`}
                        className="font-semibold text-accent hover:underline"
                      >
                        {c.name}
                      </Link>
                      {c.isPrimary && <Badge tone="blue">대표</Badge>}
                    </span>
                  </Td>
                  <Td>
                    <Link
                      href={`/organizations/${c.organization.id}`}
                      className="hover:underline"
                    >
                      {c.organization.name}
                    </Link>
                  </Td>
                  <Td>{c.department ?? "-"}</Td>
                  <Td>{c.position ?? "-"}</Td>
                  <Td className="tnum">{c.mobile ?? c.phone ?? "-"}</Td>
                  <Td>{c.email ?? "-"}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  );
}
