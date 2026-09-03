"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hashPassword, passwordProblem, verifyPassword } from "./auth";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  createSessionToken,
} from "./session-token";
import { db } from "./db";
import { getCurrentUser, requireAdmin, requireUser } from "./session";
import {
  LOCK_MINUTES,
  MAX_FAILURES,
  clearFailures,
  lockedMinutes,
  recordFailure,
} from "./login-throttle";

export type FormState = { error?: string; ok?: string };

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

/** 로그인 후 되돌아갈 경로. 외부 사이트로 튕기지 않도록 내부 경로만 허용한다. */
function safeNext(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

/**
 * 이 요청이 https 로 들어왔는가.
 *
 * secure 쿠키는 https 연결에서만 브라우저가 돌려보낸다.
 * 사내망은 http://192.168.x.x:3000 처럼 http 로 접속하므로,
 * NODE_ENV 만 보고 secure 를 켜면 로그인 → 리다이렉트 → 로그인이 무한 반복된다.
 *
 * 그래서 실행 모드가 아니라 실제 접속 방식을 본다.
 * 나중에 외부 접속을 붙이면(터널·리버스 프록시가 x-forwarded-proto: https 를 넣어 준다)
 * 설정을 고치지 않아도 secure 가 저절로 켜진다.
 */
async function isHttpsRequest(): Promise<boolean> {
  const h = await headers();
  // 프록시를 여러 단 거치면 "https, http" 처럼 쌓이므로 맨 앞(원래 클라이언트)만 본다.
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim();
  return proto === "https";
}

async function setSessionCookie(user: {
  id: string;
  email: string;
  name: string;
  role: string;
}) {
  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await isHttpsRequest(),
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

/* -------------------------------------------------------------------------- */
/*  로그인 / 로그아웃                                                           */
/* -------------------------------------------------------------------------- */

export async function login(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const next = safeNext(str(fd, "next") || "/");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력해 주세요." };
  }

  const wait = lockedMinutes(email);
  if (wait > 0) {
    return {
      error: `비밀번호를 ${MAX_FAILURES}회 틀려 잠시 잠겼습니다. ${wait}분 뒤에 다시 시도해 주세요.`,
    };
  }

  const user = await db.user.findUnique({ where: { email } });

  /*
   * 계정이 없을 때도 해시 검증을 한 번 돌려 응답 시간을 비슷하게 맞춘다.
   * 응답이 빨리 오는지로 "이 이메일은 가입돼 있다"를 알아내지 못하게 하기 위해서다.
   */
  const stored =
    user?.passwordHash ??
    "0000000000000000000000000000000000000000000000000000000000000000:0000";
  const passwordOk = await verifyPassword(password, stored);

  if (!user || !passwordOk) {
    const locked = recordFailure(email);
    return {
      error: locked
        ? `비밀번호를 ${MAX_FAILURES}회 틀려 ${LOCK_MINUTES}분간 잠겼습니다.`
        : "이메일 또는 비밀번호가 올바르지 않습니다.",
    };
  }
  if (!user.isActive) {
    return { error: "비활성화된 계정입니다. 관리자에게 문의해 주세요." };
  }

  clearFailures(email);
  await setSessionCookie(user);
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  redirect(user.mustChangePassword ? "/account/password" : next);
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

/* -------------------------------------------------------------------------- */
/*  비밀번호 변경                                                               */
/* -------------------------------------------------------------------------- */

export async function changeOwnPassword(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const current = String(fd.get("currentPassword") ?? "");
  const next = String(fd.get("newPassword") ?? "");
  const confirm = String(fd.get("confirmPassword") ?? "");

  const record = await db.user.findUnique({ where: { id: user.id } });
  if (!record) return { error: "사용자를 찾을 수 없습니다." };

  if (!(await verifyPassword(current, record.passwordHash))) {
    return { error: "현재 비밀번호가 올바르지 않습니다." };
  }
  if (next !== confirm) {
    return { error: "새 비밀번호가 서로 다릅니다." };
  }
  const problem = passwordProblem(next);
  if (problem) return { error: problem };
  if (next === current) {
    return { error: "현재 비밀번호와 다른 값을 써 주세요." };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(next),
      mustChangePassword: false,
    },
  });

  redirect("/");
}

/* -------------------------------------------------------------------------- */
/*  사용자 관리 (관리자)                                                        */
/* -------------------------------------------------------------------------- */

export async function createUser(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();

  const email = str(fd, "email").toLowerCase();
  const name = str(fd, "name");
  const role = str(fd, "role") || "member";
  const password = String(fd.get("password") ?? "");

  if (!email || !name) return { error: "이름과 이메일은 필수입니다." };
  if (!email.includes("@")) return { error: "이메일 형식이 올바르지 않습니다." };

  const problem = passwordProblem(password);
  if (problem) return { error: problem };

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return { error: "이미 등록된 이메일입니다." };

  await db.user.create({
    data: {
      email,
      name,
      role,
      passwordHash: await hashPassword(password),
      // 관리자가 정해 준 비밀번호이므로 첫 로그인 때 본인이 바꾸게 한다.
      mustChangePassword: true,
    },
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function updateUser(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const name = str(fd, "name");
  const role = str(fd, "role") || "member";
  const isActive = fd.get("isActive") === "on";

  if (!name) return { error: "이름은 필수입니다." };

  // 자기 자신의 관리자 권한을 내리거나 스스로를 비활성화하면 잠겨 버린다.
  if (admin.id === id) {
    if (role !== "admin") return { error: "본인의 관리자 권한은 해제할 수 없습니다." };
    if (!isActive) return { error: "본인 계정은 비활성화할 수 없습니다." };
  }

  if (role !== "admin" || !isActive) {
    const otherAdmins = await db.user.count({
      where: { role: "admin", isActive: true, NOT: { id } },
    });
    if (otherAdmins === 0) {
      return { error: "관리자가 최소 한 명은 있어야 합니다." };
    }
  }

  await db.user.update({ where: { id }, data: { name, role, isActive } });

  revalidatePath("/users");
  redirect("/users");
}

/** 관리자가 비밀번호를 초기화한다. 본인은 다음 로그인 때 반드시 바꿔야 한다. */
export async function resetUserPassword(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();

  const password = String(fd.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { error: problem };

  await db.user.update({
    where: { id },
    data: {
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
    },
  });

  revalidatePath("/users");
  return { ok: "비밀번호를 변경했습니다. 본인에게 새 비밀번호를 전달해 주세요." };
}

/**
 * 사용자를 지우는 대신 비활성화한다.
 * 그 사람이 남긴 활동 기록과 담당 이력을 보존해야 하기 때문이다.
 */
export async function deactivateUser(id: string) {
  const admin = await requireAdmin();
  if (admin.id === id) throw new Error("본인 계정은 비활성화할 수 없습니다.");

  const otherAdmins = await db.user.count({
    where: { role: "admin", isActive: true, NOT: { id } },
  });
  if (otherAdmins === 0) throw new Error("관리자가 최소 한 명은 있어야 합니다.");

  await db.user.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/users");
}

/** 현재 사용자 이름 — 활동 기록의 담당자를 자동으로 채울 때 쓴다. */
export async function currentUserName(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.name ?? null;
}
