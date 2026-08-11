/**
 * 첫 관리자 계정을 만든다.
 *
 * 배포 직후 한 번만 실행하면 된다. 로그인할 계정이 하나도 없으면
 * 사용자 관리 화면에도 들어갈 수 없기 때문에, 그 최초의 한 명을 여기서 만든다.
 *
 *   npx tsx prisma/create-admin.ts "홍길동" hong@example.com "비밀번호10자이상"
 *
 * 이미 있는 이메일이면 비밀번호만 다시 설정한다(비밀번호를 잊었을 때의 탈출구).
 */

import { PrismaClient } from "@prisma/client";
import { hashPassword, passwordProblem } from "../src/lib/auth";

const db = new PrismaClient();

async function main() {
  const [name, email, password] = process.argv.slice(2);

  if (!name || !email || !password) {
    console.error(
      '사용법: npx tsx prisma/create-admin.ts "이름" 이메일 비밀번호\n' +
        '예:    npx tsx prisma/create-admin.ts "홍길동" hong@example.com "Crm2026safe!"',
    );
    process.exit(1);
  }

  if (!email.includes("@")) {
    console.error("이메일 형식이 올바르지 않습니다.");
    process.exit(1);
  }

  const problem = passwordProblem(password);
  if (problem) {
    console.error(problem);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const normalized = email.toLowerCase();

  const user = await db.user.upsert({
    where: { email: normalized },
    create: {
      email: normalized,
      name,
      passwordHash,
      role: "admin",
      // 본인이 직접 정한 비밀번호이므로 변경을 강제하지 않는다.
      mustChangePassword: false,
    },
    update: {
      name,
      passwordHash,
      role: "admin",
      isActive: true,
      mustChangePassword: false,
    },
  });

  console.log(`관리자 계정 준비 완료: ${user.name} <${user.email}>`);
  console.log("이제 /login 에서 로그인할 수 있습니다.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
