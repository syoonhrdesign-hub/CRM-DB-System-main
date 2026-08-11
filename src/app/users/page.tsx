import Link from "next/link";
import { Badge, Card, PageHeader, TableWrap, Td, Th } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await requireAdmin();

  const users = await db.user.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="사용자 관리"
        description="이 CRM 을 쓰는 우리 회사 직원 계정"
        action={
          <Link href="/users/new" className="btn btn-primary">
            + 사용자 추가
          </Link>
        }
      />

      <Card padded={false}>
        <TableWrap>
          <thead>
            <tr>
              <Th>이름</Th>
              <Th>이메일</Th>
              <Th>권한</Th>
              <Th>상태</Th>
              <Th>마지막 로그인</Th>
              <Th align="right">관리</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-2">
                <Td>
                  <span className="font-medium">{u.name}</span>
                  {u.id === me.id && (
                    <span className="ml-1.5 text-xs text-faint">(본인)</span>
                  )}
                </Td>
                <Td className="text-muted">{u.email}</Td>
                <Td>
                  {u.role === "admin" ? (
                    <Badge tone="violet">관리자</Badge>
                  ) : (
                    <Badge>일반</Badge>
                  )}
                </Td>
                <Td>
                  {u.isActive ? (
                    <Badge tone="green">활성</Badge>
                  ) : (
                    <Badge tone="gray">비활성</Badge>
                  )}
                  {u.mustChangePassword && u.isActive && (
                    <span className="ml-1.5 text-xs text-faint">
                      비밀번호 변경 필요
                    </span>
                  )}
                </Td>
                <Td className="tnum text-muted">
                  {u.lastLoginAt ? formatDate(u.lastLoginAt) : "-"}
                </Td>
                <Td align="right">
                  <Link
                    href={`/users/${u.id}/edit`}
                    className="text-sm text-accent hover:underline"
                  >
                    수정
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      <p className="mt-4 text-sm text-muted">
        퇴사자는 삭제하지 말고 <strong>비활성</strong>으로 두세요. 그 사람이 남긴 활동
        기록과 담당 이력이 그대로 보존됩니다.
      </p>
    </>
  );
}
