/**
 * 엑셀 일괄 등록 · 내보내기.
 *
 * 엑셀로 관리하던 고객사 명단을 한 번에 올릴 수 있게 한다.
 * 한 줄씩 손으로 옮기는 일을 없애는 것이 목적이므로,
 * 컬럼 이름만 맞으면 순서가 달라도 읽고, 값이 조금 어긋나도 최대한 살려서 받는다.
 */

import ExcelJS from "exceljs";
import {
  COURSE_CATEGORIES,
  COURSE_FORMATS,
  INDUSTRIES,
  ORG_STATUSES,
  ORG_TYPES,
  SIZE_TIERS,
} from "./constants";

/** 엑셀 열 정의 — 여기 한 곳만 고치면 템플릿·읽기·내보내기가 함께 바뀐다. */
export const ORG_COLUMNS = [
  { key: "name", header: "기관명", width: 26, required: true, hint: "필수" },
  { key: "shortName", header: "약칭", width: 12 },
  { key: "bizRegNo", header: "사업자등록번호", width: 16, hint: "숫자만 써도 됨" },
  { key: "orgType", header: "기관 유형", width: 12, choices: ORG_TYPES },
  { key: "industry", header: "업종", width: 12, choices: INDUSTRIES },
  { key: "sizeTier", header: "규모", width: 12, choices: SIZE_TIERS },
  { key: "employeeCount", header: "임직원 수", width: 11, numeric: true },
  { key: "status", header: "거래 상태", width: 12, choices: ORG_STATUSES },
  { key: "clientDepartment", header: "담당 부서", width: 20 },
  { key: "departmentRole", header: "부서 업무", width: 28 },
  { key: "ownerName", header: "사내 컨택 담당자", width: 16 },
  { key: "phone", header: "대표 전화", width: 16 },
  { key: "website", header: "홈페이지", width: 24 },
  { key: "address", header: "주소", width: 34 },
  { key: "memo", header: "메모", width: 40 },
] as const;

export type OrgColumnKey = (typeof ORG_COLUMNS)[number]["key"];

/** 교육 과정 열 정의 */
export const COURSE_COLUMNS = [
  { key: "code", header: "과정코드", width: 14, required: true, hint: "필수 · 예: KDISC-101" },
  { key: "name", header: "과정명", width: 34, required: true, hint: "필수" },
  { key: "category", header: "분류", width: 12, choices: COURSE_CATEGORIES },
  { key: "format", header: "교육 형태", width: 12, choices: COURSE_FORMATS },
  { key: "durationHours", header: "총 시수", width: 10, numeric: true },
  { key: "defaultPrice", header: "1인당 단가(원)", width: 14, numeric: true },
  { key: "minHeadcount", header: "최소 인원", width: 10, numeric: true },
  { key: "description", header: "과정 소개", width: 46 },
] as const;

export type CourseColumnKey = (typeof COURSE_COLUMNS)[number]["key"];

export type ParsedRow = {
  /** 엑셀에서의 실제 행 번호 — 오류를 보여 줄 때 어디를 고칠지 알려 준다 */
  rowNumber: number;
  values: Record<string, string | number | null>;
  /** 저장을 막는 문제 */
  errors: string[];
  /** 저장은 되지만 알아 둘 점 */
  warnings: string[];
  /** 이미 있는 고객사와 겹침 */
  duplicateOf: string | null;
};

function cellToString(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "예" : "아니오";
  if (value instanceof Date) return value.toISOString().slice(0, 10);

  // 하이퍼링크·수식·서식 있는 텍스트는 표시되는 글자만 뽑는다
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

/** 사업자등록번호는 숫자만 남긴다 — 표기가 달라도 같은 곳으로 인식하기 위해서. */
export function normalizeBizRegNo(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  return digits === "" ? null : digits;
}

/**
 * 선택지 값을 최대한 살려서 받는다.
 * 띄어쓰기·가운뎃점 차이("공공 기관" / "공공기관")로 반려하면 쓰기 불편하다.
 */
function matchChoice(value: string, choices: readonly string[]): string | null {
  if (!value) return null;
  const squeeze = (s: string) => s.replace(/[\s·・.]/g, "");
  const target = squeeze(value);
  return choices.find((c) => squeeze(c) === target) ?? null;
}

/* -------------------------------------------------------------------------- */
/*  템플릿 만들기                                                               */
/* -------------------------------------------------------------------------- */

type ColumnDef = {
  readonly key: string;
  readonly header: string;
  readonly width: number;
  readonly required?: boolean;
  readonly hint?: string;
  readonly choices?: readonly string[];
  readonly numeric?: boolean;
};

/** 열 정의만 바꾸면 고객사·과정 어느 쪽 양식이든 같은 모양으로 만들어진다. */
async function writeSheet(
  columns: readonly ColumnDef[],
  sheetName: string,
  opts: { guide?: boolean; sample?: (string | number)[]; rows?: Record<string, unknown>[] },
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "neoize CRM";
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: opts.guide ? 2 : 1 }],
  });
  ws.columns = columns.map((c) => ({ key: c.key, width: c.width }));

  const head = ws.addRow(columns.map((c) => c.header));
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.height = 22;
  head.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E71AD" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // 안내 행 — 선택지를 적어 두면 따로 설명하지 않아도 된다
  if (opts.guide) {
    const guide = ws.addRow(
      columns.map((c) => (c.choices ? c.choices.join(" / ") : (c.hint ?? ""))),
    );
    guide.font = { size: 9, color: { argb: "FF64748B" }, italic: true };
    guide.height = 30;
    guide.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F6F8" } };
    });
  }

  if (opts.sample) {
    const sample = ws.addRow(opts.sample);
    sample.font = { color: { argb: "FF94A0B3" } };
  }

  for (const row of opts.rows ?? []) {
    ws.addRow(columns.map((c) => row[c.key] ?? ""));
  }

  ws.autoFilter = { from: "A1", to: { row: 1, column: columns.length } };

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function buildTemplate(): Promise<Buffer> {
  return writeSheet(ORG_COLUMNS, "고객사", {
    guide: true,
    sample: [
      "(예시) 한빛전자 주식회사",
      "한빛전자",
      "120-81-47521",
      "기업",
      "제조",
      "대기업",
      12400,
      "거래중",
      "인재개발원",
      "전사 교육 기획·운영",
      "김서윤",
      "02-3400-1000",
      "https://example.com",
      "경기도 수원시 영통구 삼성로 129",
      "매년 3월 연간 교육계획 확정",
    ],
  });
}

export async function buildCourseTemplate(): Promise<Buffer> {
  return writeSheet(COURSE_COLUMNS, "교육 과정", {
    guide: true,
    sample: [
      "(예시) KDISC-101",
      "K-DISC 행동유형 진단 워크숍 (기본)",
      "K-DISC",
      "집합",
      4,
      180000,
      15,
      "진단 리포트 개인별 해석 포함",
    ],
  });
}

/* -------------------------------------------------------------------------- */
/*  업로드 읽기                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 업로드된 엑셀을 읽어 행별로 검증한다.
 * 바로 저장하지 않고 결과를 돌려주어, 사용자가 확인한 뒤 등록하게 한다.
 */
export async function parseWorkbook(
  buffer: ArrayBuffer,
  existing: { name: string; bizRegNo: string | null }[],
): Promise<ParsedRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.worksheets[0];
  if (!ws) throw new Error("엑셀에 시트가 없습니다.");

  // 헤더 행을 찾는다. 안내 행을 지우고 올리는 경우가 있어 위에서 몇 줄을 훑는다.
  let headerRow = 0;
  const headerMap = new Map<number, OrgColumnKey>();

  for (let r = 1; r <= Math.min(5, ws.rowCount); r++) {
    const map = new Map<number, OrgColumnKey>();
    ws.getRow(r).eachCell((cell, col) => {
      const text = cellToString(cell.value).replace(/\s/g, "");
      const found = ORG_COLUMNS.find(
        (c) => c.header.replace(/\s/g, "") === text,
      );
      if (found) map.set(col, found.key);
    });
    if (map.has([...map.keys()][0] ?? -1) && map.size >= 2) {
      headerRow = r;
      map.forEach((v, k) => headerMap.set(k, v));
      break;
    }
  }

  if (headerRow === 0) {
    throw new Error(
      "열 이름을 찾지 못했습니다. 템플릿을 내려받아 그 양식에 맞춰 주세요. (최소한 '기관명' 열이 있어야 합니다)",
    );
  }
  if (![...headerMap.values()].includes("name")) {
    throw new Error("'기관명' 열이 없습니다. 템플릿의 열 이름을 확인해 주세요.");
  }

  const seenNames = new Map<string, number>();
  const seenBiz = new Map<string, number>();
  const rows: ParsedRow[] = [];

  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const raw: Record<string, string> = {};
    headerMap.forEach((key, col) => {
      raw[key] = cellToString(row.getCell(col).value);
    });

    // 빈 줄과 템플릿 예시 줄은 건너뛴다
    const isEmpty = Object.values(raw).every((v) => v === "");
    if (isEmpty) continue;
    if (raw.name?.startsWith("(예시)")) continue;

    const errors: string[] = [];
    const warnings: string[] = [];
    const values: Record<string, string | number | null> = {};

    // 기관명 — 유일한 필수값
    const name = raw.name ?? "";
    if (!name) {
      errors.push("기관명이 비어 있습니다");
    } else if (name.length > 100) {
      errors.push("기관명이 너무 깁니다 (100자 이하)");
    }
    values.name = name || null;

    // 파일 안에서의 중복
    if (name) {
      const prev = seenNames.get(name);
      if (prev) errors.push(`파일 안 ${prev}행과 기관명이 같습니다`);
      else seenNames.set(name, r);
    }

    // 사업자등록번호
    const biz = normalizeBizRegNo(raw.bizRegNo ?? "");
    if (raw.bizRegNo && !biz) {
      warnings.push("사업자등록번호에 숫자가 없어 비웁니다");
    } else if (biz && biz.length !== 10) {
      warnings.push(`사업자등록번호가 10자리가 아닙니다 (${biz.length}자리)`);
    }
    if (biz) {
      const prev = seenBiz.get(biz);
      if (prev) errors.push(`파일 안 ${prev}행과 사업자등록번호가 같습니다`);
      else seenBiz.set(biz, r);
    }
    values.bizRegNo = biz;

    // 선택지 항목 — 못 알아들으면 비우고 알려 준다
    for (const col of ORG_COLUMNS) {
      if (!("choices" in col) || !col.choices) continue;
      const input = raw[col.key] ?? "";
      if (!input) {
        values[col.key] = null;
        continue;
      }
      const matched = matchChoice(input, col.choices);
      if (matched) {
        values[col.key] = matched;
      } else {
        values[col.key] = null;
        warnings.push(`${col.header} "${input}" 을(를) 알 수 없어 비웁니다`);
      }
    }

    // 숫자 항목
    const headcount = (raw.employeeCount ?? "").replace(/[,\s명]/g, "");
    if (headcount) {
      const n = Number.parseInt(headcount, 10);
      if (Number.isFinite(n) && n >= 0) {
        values.employeeCount = n;
      } else {
        values.employeeCount = null;
        warnings.push(`임직원 수 "${raw.employeeCount}" 를 숫자로 읽지 못했습니다`);
      }
    } else {
      values.employeeCount = null;
    }

    // 나머지 자유 입력
    for (const col of ORG_COLUMNS) {
      if (col.key in values) continue;
      values[col.key] = raw[col.key] || null;
    }

    // 이미 등록된 고객사와의 중복
    let duplicateOf: string | null = null;
    const hitByBiz = biz
      ? existing.find((e) => e.bizRegNo && e.bizRegNo === biz)
      : undefined;
    const hitByName = existing.find((e) => e.name === name);
    if (hitByBiz) duplicateOf = `사업자등록번호가 같은 "${hitByBiz.name}"`;
    else if (hitByName) duplicateOf = `이름이 같은 "${hitByName.name}"`;

    rows.push({ rowNumber: r, values, errors, warnings, duplicateOf });
  }

  return rows;
}

/* -------------------------------------------------------------------------- */
/*  내보내기                                                                    */
/* -------------------------------------------------------------------------- */

export async function buildExport(
  organizations: Record<string, unknown>[],
): Promise<Buffer> {
  return writeSheet(ORG_COLUMNS, "고객사", { rows: organizations });
}

export async function buildCourseExport(
  courses: Record<string, unknown>[],
): Promise<Buffer> {
  return writeSheet(COURSE_COLUMNS, "교육 과정", { rows: courses });
}

/* -------------------------------------------------------------------------- */
/*  교육 과정 읽기                                                              */
/* -------------------------------------------------------------------------- */

/** 과정 엑셀을 읽어 행별로 검증한다. 고객사와 달리 과정코드가 열쇠다. */
export async function parseCourseWorkbook(
  buffer: ArrayBuffer,
  existing: { code: string; name: string }[],
): Promise<ParsedRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.worksheets[0];
  if (!ws) throw new Error("엑셀에 시트가 없습니다.");

  let headerRow = 0;
  const headerMap = new Map<number, CourseColumnKey>();

  for (let r = 1; r <= Math.min(5, ws.rowCount); r++) {
    const map = new Map<number, CourseColumnKey>();
    ws.getRow(r).eachCell((cell, col) => {
      const text = cellToString(cell.value).replace(/\s/g, "");
      const found = COURSE_COLUMNS.find(
        (c) => c.header.replace(/\s/g, "") === text,
      );
      if (found) map.set(col, found.key);
    });
    if (map.size >= 2) {
      headerRow = r;
      map.forEach((v, k) => headerMap.set(k, v));
      break;
    }
  }

  if (headerRow === 0) {
    throw new Error(
      "열 이름을 찾지 못했습니다. 양식을 내려받아 그 열 이름에 맞춰 주세요.",
    );
  }
  const keys = [...headerMap.values()];
  if (!keys.includes("code") || !keys.includes("name")) {
    throw new Error("'과정코드'와 '과정명' 열이 모두 있어야 합니다.");
  }

  const seenCodes = new Map<string, number>();
  const rows: ParsedRow[] = [];

  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const raw: Record<string, string> = {};
    headerMap.forEach((key, col) => {
      raw[key] = cellToString(row.getCell(col).value);
    });

    if (Object.values(raw).every((v) => v === "")) continue;
    if (raw.code?.startsWith("(예시)")) continue;

    const errors: string[] = [];
    const warnings: string[] = [];
    const values: Record<string, string | number | null> = {};

    const code = (raw.code ?? "").toUpperCase();
    if (!code) errors.push("과정코드가 비어 있습니다");
    values.code = code || null;

    if (code) {
      const prev = seenCodes.get(code);
      if (prev) errors.push(`파일 안 ${prev}행과 과정코드가 같습니다`);
      else seenCodes.set(code, r);
    }

    const name = raw.name ?? "";
    if (!name) errors.push("과정명이 비어 있습니다");
    values.name = name || null;

    for (const col of COURSE_COLUMNS as readonly ColumnDef[]) {
      if (!col.choices) continue;
      const input = raw[col.key] ?? "";
      if (!input) {
        values[col.key] = null;
        continue;
      }
      const matched = matchChoice(input, col.choices);
      if (matched) values[col.key] = matched;
      else {
        values[col.key] = null;
        warnings.push(`${col.header} "${input}" 을(를) 알 수 없어 비웁니다`);
      }
    }

    // 숫자 항목 — "8시간", "180,000원" 같은 표기도 받아 준다
    for (const key of ["durationHours", "defaultPrice", "minHeadcount"] as const) {
      const cleaned = (raw[key] ?? "").replace(/[,\s원명시간]/g, "");
      if (!cleaned) {
        values[key] = null;
        continue;
      }
      const n = Number.parseFloat(cleaned);
      if (Number.isFinite(n) && n >= 0) values[key] = n;
      else {
        values[key] = null;
        warnings.push(`${key} "${raw[key]}" 를 숫자로 읽지 못했습니다`);
      }
    }

    values.description = raw.description || null;

    const hit = existing.find((e) => e.code === code);
    rows.push({
      rowNumber: r,
      values,
      errors,
      warnings,
      duplicateOf: hit ? `같은 코드의 "${hit.name}"` : null,
    });
  }

  return rows;
}

/* -------------------------------------------------------------------------- */
/*  담당자 (명함) 읽기                                                          */
/* -------------------------------------------------------------------------- */

/**
 * 담당자 열 정의.
 *
 * 리멤버 같은 명함 앱에서 내려받은 파일을 그대로 올릴 수 있도록,
 * 열 이름을 하나로 고정하지 않고 흔히 쓰는 이름들을 함께 받아들인다.
 * 사람이 파일을 고쳐서 올리게 만들면 결국 손으로 옮기는 일과 다를 게 없다.
 */
export const CONTACT_COLUMNS = [
  {
    key: "companyName",
    header: "회사명",
    width: 26,
    required: true,
    hint: "필수 · 등록된 고객사와 이름으로 연결",
    aliases: ["회사", "회사명", "소속", "기업명", "기관명", "고객사", "직장"],
  },
  {
    key: "name",
    header: "이름",
    width: 12,
    required: true,
    hint: "필수",
    aliases: ["이름", "성명", "담당자", "담당자명", "고객명", "name"],
  },
  {
    key: "department",
    header: "부서",
    width: 18,
    aliases: ["부서", "부서명", "소속부서", "팀", "department"],
  },
  {
    key: "position",
    header: "직급",
    width: 12,
    aliases: ["직급", "직위", "직책", "position", "title"],
  },
  {
    key: "mobile",
    header: "휴대폰",
    width: 16,
    aliases: ["휴대폰", "휴대전화", "핸드폰", "모바일", "hp", "mobile", "핸드폰번호"],
  },
  {
    key: "phone",
    header: "직통 전화",
    width: 16,
    aliases: ["전화", "회사전화", "직통", "유선전화", "tel", "phone", "사무실전화"],
  },
  {
    key: "email",
    header: "이메일",
    width: 24,
    aliases: ["이메일", "메일", "e-mail", "email", "메일주소"],
  },
  {
    key: "receivedAt",
    header: "명함 받은 날",
    width: 14,
    hint: "비우면 오늘",
    aliases: ["명함받은날", "등록일", "명함등록일", "저장일", "날짜", "수집일"],
  },
  {
    key: "memo",
    header: "메모",
    width: 34,
    aliases: ["메모", "비고", "note", "메모내용"],
  },
] as const;

export type ContactColumnKey = (typeof CONTACT_COLUMNS)[number]["key"];

export type ParsedContactRow = ParsedRow & {
  /** 연결될 고객사 — 없으면 새로 만들지 물어본다 */
  matchedOrgId: string | null;
  matchedOrgName: string | null;
};

/** 열 이름 비교용 — 공백·기호·대소문자를 지우고 맞춘다 */
function squeezeHeader(s: string): string {
  return s.replace(/[\s()·・.\-_/]/g, "").toLowerCase();
}

export async function buildContactTemplate(): Promise<Buffer> {
  return writeSheet(CONTACT_COLUMNS as readonly ColumnDef[], "담당자", {
    guide: true,
    sample: [
      "(예시) 한빛전자 주식회사",
      "박지훈",
      "인재개발원",
      "팀장",
      "010-2345-6789",
      "02-3400-1234",
      "jh.park@example.com",
      "2026-08-11",
      "오전 연락 선호",
    ],
  });
}

export async function parseContactWorkbook(
  buffer: ArrayBuffer,
  organizations: { id: string; name: string; shortName: string | null }[],
  existingContacts: { organizationId: string; name: string }[],
): Promise<ParsedContactRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.worksheets[0];
  if (!ws) throw new Error("엑셀에 시트가 없습니다.");

  // 별칭까지 훑어 헤더를 찾는다
  let headerRow = 0;
  const headerMap = new Map<number, ContactColumnKey>();

  for (let r = 1; r <= Math.min(6, ws.rowCount); r++) {
    const map = new Map<number, ContactColumnKey>();
    ws.getRow(r).eachCell((cell, col) => {
      const text = squeezeHeader(cellToString(cell.value));
      if (!text) return;
      const found = CONTACT_COLUMNS.find(
        (c) =>
          squeezeHeader(c.header) === text ||
          (c.aliases as readonly string[]).some((a) => squeezeHeader(a) === text),
      );
      if (found && ![...map.values()].includes(found.key)) map.set(col, found.key);
    });
    if (map.size >= 2) {
      headerRow = r;
      map.forEach((v, k) => headerMap.set(k, v));
      break;
    }
  }

  if (headerRow === 0) {
    throw new Error(
      "열 이름을 찾지 못했습니다. 최소한 '회사명'과 '이름' 열이 있어야 합니다.",
    );
  }
  const keys = [...headerMap.values()];
  if (!keys.includes("name")) throw new Error("'이름' 열을 찾지 못했습니다.");
  if (!keys.includes("companyName")) {
    throw new Error("'회사명' 열을 찾지 못했습니다. 어느 고객사의 담당자인지 알 수 없습니다.");
  }

  // 고객사 이름 → id. 약칭과 (주)·주식회사 표기 차이까지 흡수한다.
  const normalizeOrg = (s: string) =>
    s
      .replace(/\(주\)|주식회사|㈜|\(재\)|재단법인|사단법인/g, "")
      .replace(/\s/g, "")
      .toLowerCase();

  const orgIndex = new Map<string, { id: string; name: string }>();
  for (const o of organizations) {
    orgIndex.set(normalizeOrg(o.name), { id: o.id, name: o.name });
    if (o.shortName) orgIndex.set(normalizeOrg(o.shortName), { id: o.id, name: o.name });
  }

  const seen = new Map<string, number>();
  const rows: ParsedContactRow[] = [];

  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const raw: Record<string, string> = {};
    headerMap.forEach((key, col) => {
      raw[key] = cellToString(row.getCell(col).value);
    });

    if (Object.values(raw).every((v) => v === "")) continue;
    if (raw.companyName?.startsWith("(예시)")) continue;

    const errors: string[] = [];
    const warnings: string[] = [];
    const values: Record<string, string | number | null> = {};

    const name = raw.name ?? "";
    if (!name) errors.push("이름이 비어 있습니다");
    values.name = name || null;

    const company = raw.companyName ?? "";
    if (!company) errors.push("회사명이 비어 있습니다");
    values.companyName = company || null;

    // 같은 회사·같은 이름이 파일 안에 두 번
    const dupKey = `${normalizeOrg(company)}|${name}`;
    if (name && company) {
      const prev = seen.get(dupKey);
      if (prev) errors.push(`파일 안 ${prev}행과 같은 사람입니다`);
      else seen.set(dupKey, r);
    }

    for (const key of ["department", "position", "mobile", "phone", "email", "memo"] as const) {
      values[key] = raw[key] || null;
    }

    if (values.email && !String(values.email).includes("@")) {
      warnings.push(`이메일 "${values.email}" 형식이 이상합니다`);
    }

    // 명함 받은 날
    const dateText = raw.receivedAt ?? "";
    if (dateText) {
      const parsed = new Date(dateText.replace(/[.]/g, "-").replace(/\s/g, ""));
      if (Number.isFinite(parsed.getTime())) {
        values.receivedAt = parsed.toISOString().slice(0, 10);
      } else {
        values.receivedAt = null;
        warnings.push(`날짜 "${dateText}" 를 읽지 못해 오늘로 둡니다`);
      }
    } else {
      values.receivedAt = null;
    }

    // 고객사 연결
    const hit = company ? orgIndex.get(normalizeOrg(company)) : undefined;
    let duplicateOf: string | null = null;
    if (hit) {
      const already = existingContacts.some(
        (c) => c.organizationId === hit.id && c.name === name,
      );
      if (already) duplicateOf = `"${hit.name}" 에 이미 있는 담당자`;
    }

    rows.push({
      rowNumber: r,
      values,
      errors,
      warnings,
      duplicateOf,
      matchedOrgId: hit?.id ?? null,
      matchedOrgName: hit?.name ?? null,
    });
  }

  return rows;
}
