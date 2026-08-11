"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import ExcelJS from "exceljs";
import { db } from "./db";
import { getCurrentUser, requireUser } from "./session";

export type DistributionState = {
  error?: string;
  ok?: string;
};

/**
 * 공개 주소에 쓸 무작위 문자열.
 *
 * 로그인 없이 열리는 페이지라 주소 자체가 열쇠다.
 * 헷갈리는 글자(0/O, 1/l/I)를 빼서 사람이 받아 적어도 틀리지 않게 한다.
 */
function makeSlug(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(16);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function optStr(fd: FormData, key: string): string | null {
  return str(fd, key) || null;
}
function optDate(fd: FormData, key: string): Date | null {
  const v = str(fd, key);
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * 조회 기간용 날짜.
 *
 * `<input type="date">` 는 "2026-08-13" 을 주는데 `new Date()` 로 그냥 읽으면
 * UTC 자정이 된다. 한국 시간으로는 오전 9시라, 종료일 당일 아침 9시에 조회가
 * 막혀 버린다. 그래서 서버 PC의 현지 시각으로 하루의 처음과 끝을 잡는다.
 * (`end` 는 종료일 당일 23:59:59 — 종료일도 조회할 수 있어야 한다)
 */
function optDayBound(fd: FormData, key: string, edge: "start" | "end"): Date | null {
  const v = str(fd, key);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const [y, m, d] = v.split("-").map(Number);
  const out =
    edge === "start"
      ? new Date(y, m - 1, d, 0, 0, 0, 0)
      : new Date(y, m - 1, d, 23, 59, 59, 999);
  return Number.isFinite(out.getTime()) ? out : null;
}

/** 엑셀 셀 값을 문자열로. 코드가 숫자로 읽히는 일이 잦아 따로 다룬다. */
function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    const v = value as unknown as Record<string, unknown>;
    if (typeof v.text === "string") return v.text.trim();
    if (typeof v.result === "string") return v.result.trim();
    if (typeof v.result === "number") return String(v.result);
    if (Array.isArray(v.richText)) {
      return v.richText.map((r) => (r as { text: string }).text).join("").trim();
    }
  }
  return String(value).trim();
}

const NAME_ALIASES = ["이름", "성명", "교육생", "교육생명", "참가자", "수강생", "name"];
const CODE_ALIASES = [
  "코드",
  "검사코드",
  "진단코드",
  "진단검사코드",
  "참가코드",
  "인증코드",
  "고유코드",
  "번호",
  "code",
];
const DEPT_ALIASES = ["부서", "소속", "팀", "부서명", "소속부서", "소속팀", "직급"];
const VERIFY_ALIASES = ["사번", "휴대폰뒤4자리", "뒤4자리", "확인값", "사원번호", "사원번호4자리"];

function squeeze(s: string): string {
  return s.replace(/[\s()·・.\-_/]/g, "").toLowerCase();
}

/**
 * 열 이름 맞추기.
 *
 * 고객사마다 열 이름이 제각각이라(검사코드·진단코드·참가코드…) 목록을 아무리 늘려도
 * 빠지는 게 생긴다. 그래서 목록에 없더라도 "…코드"로 끝나면 코드 열로 본다.
 */
function matchesColumn(text: string, aliases: string[], suffix?: string): boolean {
  if (aliases.some((a) => squeeze(a) === text)) return true;
  return suffix ? text.endsWith(suffix) : false;
}

/**
 * 교육생 명단 엑셀을 읽는다.
 * 이름과 코드 두 열만 있으면 되고, 열 이름은 흔한 표현을 모두 받아들인다.
 */
async function parseParticipants(buffer: ArrayBuffer): Promise<
  { name: string; code: string; department: string | null; verifyValue: string | null }[]
> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("엑셀에 시트가 없습니다.");

  let headerRow = 0;
  let nameCol = 0;
  let codeCol = 0;
  let deptCol = 0;
  let verifyCol = 0;

  for (let r = 1; r <= Math.min(6, ws.rowCount); r++) {
    let n = 0, c = 0, d = 0, v = 0;
    ws.getRow(r).eachCell((cell, col) => {
      const t = squeeze(cellText(cell.value));
      if (!t) return;
      if (!n && matchesColumn(t, NAME_ALIASES)) n = col;
      else if (!c && matchesColumn(t, CODE_ALIASES, "코드")) c = col;
      else if (!d && matchesColumn(t, DEPT_ALIASES)) d = col;
      else if (!v && matchesColumn(t, VERIFY_ALIASES)) v = col;
    });
    if (n && c) {
      headerRow = r;
      nameCol = n;
      codeCol = c;
      deptCol = d;
      verifyCol = v;
      break;
    }
  }

  if (!headerRow) {
    throw new Error(
      "'이름'과 '코드' 열을 찾지 못했습니다. 두 열은 반드시 있어야 합니다.",
    );
  }

  const out: {
    name: string;
    code: string;
    department: string | null;
    verifyValue: string | null;
  }[] = [];

  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const name = cellText(row.getCell(nameCol).value);
    const code = cellText(row.getCell(codeCol).value);
    if (!name || !code) continue;

    out.push({
      name,
      code,
      department: deptCol ? cellText(row.getCell(deptCol).value) || null : null,
      verifyValue: verifyCol ? cellText(row.getCell(verifyCol).value) || null : null,
    });
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/*  만들기 · 수정 · 삭제                                                        */
/* -------------------------------------------------------------------------- */

export async function createDistribution(
  _prev: DistributionState,
  fd: FormData,
): Promise<DistributionState> {
  const user = await requireUser();

  const title = str(fd, "title");
  if (!title) return { error: "제목을 입력해 주세요." };

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "교육생 명단 엑셀을 올려 주세요." };
  }
  if (!/\.xlsx$/i.test(file.name)) return { error: "xlsx 파일만 읽을 수 있습니다." };
  if (file.size > 5 * 1024 * 1024) return { error: "파일이 너무 큽니다 (5MB 이하)." };

  let participants: Awaited<ReturnType<typeof parseParticipants>>;
  try {
    participants = await parseParticipants(await file.arrayBuffer());
  } catch (e) {
    return { error: e instanceof Error ? e.message : "파일을 읽지 못했습니다." };
  }
  if (participants.length === 0) {
    return { error: "명단에서 읽을 수 있는 사람이 없습니다." };
  }

  const created = await db.codeDistribution.create({
    data: {
      slug: makeSlug(),
      headline: optStr(fd, "headline"),
      title,
      subtitle: optStr(fd, "subtitle"),
      eventAt: optDate(fd, "eventAt"),
      eventTime: optStr(fd, "eventTime"),
      venue: optStr(fd, "venue"),
      audience: optStr(fd, "audience"),
      instructor: optStr(fd, "instructor"),
      guide: optStr(fd, "guide"),
      notices: optStr(fd, "notices"),
      inquiry: optStr(fd, "inquiry"),
      targetUrl: optStr(fd, "targetUrl"),
      organizationId: optStr(fd, "organizationId"),
      trainingId: optStr(fd, "trainingId"),
      verifyField: str(fd, "verifyField") || "none",
      opensAt: optDayBound(fd, "opensAt", "start"),
      closesAt: optDayBound(fd, "closesAt", "end"),
      createdBy: user.name,
      participants: { create: participants },
    },
  });

  revalidatePath("/distributions");
  redirect(`/distributions/${created.id}`);
}

export async function updateDistribution(id: string, fd: FormData) {
  await requireUser();

  await db.codeDistribution.update({
    where: { id },
    data: {
      headline: optStr(fd, "headline"),
      title: str(fd, "title"),
      subtitle: optStr(fd, "subtitle"),
      eventAt: optDate(fd, "eventAt"),
      eventTime: optStr(fd, "eventTime"),
      venue: optStr(fd, "venue"),
      audience: optStr(fd, "audience"),
      instructor: optStr(fd, "instructor"),
      guide: optStr(fd, "guide"),
      notices: optStr(fd, "notices"),
      inquiry: optStr(fd, "inquiry"),
      targetUrl: optStr(fd, "targetUrl"),
      organizationId: optStr(fd, "organizationId"),
      verifyField: str(fd, "verifyField") || "none",
      opensAt: optDayBound(fd, "opensAt", "start"),
      closesAt: optDayBound(fd, "closesAt", "end"),
      isActive: fd.get("isActive") === "on",
    },
  });

  revalidatePath(`/distributions/${id}`);
  redirect(`/distributions/${id}`);
}

export async function deleteDistribution(id: string) {
  await requireUser();
  await db.codeDistribution.delete({ where: { id } });
  revalidatePath("/distributions");
  redirect("/distributions");
}

/** 명단을 추가로 올린다. 이미 있는 이름은 코드를 갱신한다. */
export async function addParticipants(
  id: string,
  _prev: DistributionState,
  fd: FormData,
): Promise<DistributionState> {
  await requireUser();

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "엑셀 파일을 선택해 주세요." };
  }

  let rows: Awaited<ReturnType<typeof parseParticipants>>;
  try {
    rows = await parseParticipants(await file.arrayBuffer());
  } catch (e) {
    return { error: e instanceof Error ? e.message : "파일을 읽지 못했습니다." };
  }

  const existing = await db.participantCode.findMany({
    where: { distributionId: id },
    select: { id: true, name: true },
  });

  let added = 0;
  let updated = 0;

  for (const row of rows) {
    const hit = existing.find((e) => e.name === row.name);
    if (hit) {
      await db.participantCode.update({ where: { id: hit.id }, data: row });
      updated += 1;
    } else {
      await db.participantCode.create({ data: { distributionId: id, ...row } });
      added += 1;
    }
  }

  revalidatePath(`/distributions/${id}`);
  return { ok: `${added}명 추가, ${updated}명 갱신했습니다.` };
}

/* -------------------------------------------------------------------------- */
/*  공개 페이지에서 쓰는 조회                                                    */
/* -------------------------------------------------------------------------- */

export type LookupResult =
  | { status: "found"; name: string; code: string; department: string | null }
  | { status: "notFound" }
  | { status: "needVerify" }
  | { status: "closed"; reason: string };

/**
 * 교육생이 자기 코드를 찾는다.
 *
 * 이름을 정확히 맞춰야 한 건이 나온다. 부분 일치로 훑을 수 없게 한 것은,
 * 로그인 없는 페이지에서 명단 전체가 새어 나가지 않게 하기 위해서다.
 */
export async function lookupCode(
  slug: string,
  _prev: LookupResult | null,
  fd: FormData,
): Promise<LookupResult> {
  const name = String(fd.get("name") ?? "").trim();
  const verify = String(fd.get("verify") ?? "").trim();

  if (!name) return { status: "notFound" };

  const dist = await db.codeDistribution.findUnique({
    where: { slug },
    include: { participants: true },
  });

  if (!dist || !dist.isActive) {
    return { status: "closed", reason: "종료된 안내입니다." };
  }

  const now = new Date();
  if (dist.opensAt && now < dist.opensAt) {
    return { status: "closed", reason: "아직 조회 기간이 아닙니다." };
  }
  if (dist.closesAt && now > dist.closesAt) {
    return { status: "closed", reason: "조회 기간이 끝났습니다." };
  }

  // 이름은 공백만 무시하고 정확히 맞춘다
  const target = name.replace(/\s/g, "");
  let matches = dist.participants.filter(
    (p) => p.name.replace(/\s/g, "") === target,
  );

  if (matches.length === 0) return { status: "notFound" };

  // 동명이인이 있거나 추가 확인을 켜 둔 경우
  if (dist.verifyField !== "none" || matches.length > 1) {
    if (!verify) return { status: "needVerify" };
    matches = matches.filter(
      (p) => (p.verifyValue ?? "").replace(/\s/g, "") === verify.replace(/\s/g, ""),
    );
    if (matches.length !== 1) return { status: "notFound" };
  }

  const hit = matches[0];

  // 누가 확인했는지 남긴다 — 아직 안 본 사람만 따로 챙길 수 있게
  await db.participantCode.update({
    where: { id: hit.id },
    data: { viewedAt: new Date(), viewCount: { increment: 1 } },
  });

  return {
    status: "found",
    name: hit.name,
    code: hit.code,
    department: hit.department,
  };
}

/** 교육생 명단 양식 */
export async function buildParticipantTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "neoize CRM";
  const ws = wb.addWorksheet("교육생 명단");
  ws.columns = [
    { key: "name", width: 14 },
    { key: "code", width: 20 },
    { key: "department", width: 20 },
    { key: "verifyValue", width: 16 },
  ];

  const head = ws.addRow(["이름", "코드", "부서", "사번"]);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E71AD" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const guide = ws.addRow([
    "필수",
    "필수",
    "동명이인 구분에 도움",
    "추가 확인을 켤 때만",
  ]);
  guide.font = { size: 9, italic: true, color: { argb: "FF64748B" } };

  const sample = ws.addRow(["홍길동", "KD-2026-0001", "영업1팀", "20260101"]);
  sample.font = { color: { argb: "FF94A0B3" } };

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** 현재 사용자 이름 — 화면에서 쓸 일이 있어 열어 둔다 */
export async function currentUser() {
  return getCurrentUser();
}
