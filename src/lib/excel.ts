/**
 * 엑셀 일괄 등록 · 내보내기.
 *
 * 엑셀로 관리하던 고객사 명단을 한 번에 올릴 수 있게 한다.
 * 한 줄씩 손으로 옮기는 일을 없애는 것이 목적이므로,
 * 컬럼 이름만 맞으면 순서가 달라도 읽고, 값이 조금 어긋나도 최대한 살려서 받는다.
 */

import ExcelJS from "exceljs";
import {
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

export async function buildTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "neoize CRM";
  wb.created = new Date();

  const ws = wb.addWorksheet("고객사", {
    views: [{ state: "frozen", ySplit: 2 }],
  });

  ws.columns = ORG_COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  // 1행 — 열 이름
  const head = ws.addRow(ORG_COLUMNS.map((c) => c.header));
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.height = 22;
  head.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E71AD" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // 2행 — 입력 안내. 사람이 보고 바로 이해하도록 선택지를 적어 둔다.
  const guide = ws.addRow(
    ORG_COLUMNS.map((c) =>
      "choices" in c && c.choices
        ? c.choices.join(" / ")
        : "hint" in c && c.hint
          ? c.hint
          : "",
    ),
  );
  guide.font = { size: 9, color: { argb: "FF64748B" }, italic: true };
  guide.height = 30;
  guide.eachCell((cell) => {
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF4F6F8" },
    };
  });

  // 3행부터 예시 한 줄 — 어떻게 채우는지 보여 주고, 지우고 쓰면 된다
  const sample = ws.addRow([
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
  ]);
  sample.font = { color: { argb: "FF94A0B3" } };

  ws.autoFilter = { from: "A1", to: { row: 1, column: ORG_COLUMNS.length } };

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
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
  const wb = new ExcelJS.Workbook();
  wb.creator = "neoize CRM";
  wb.created = new Date();

  const ws = wb.addWorksheet("고객사", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  ws.columns = ORG_COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  const head = ws.addRow(ORG_COLUMNS.map((c) => c.header));
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E71AD" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  for (const org of organizations) {
    ws.addRow(
      ORG_COLUMNS.map((c) => {
        const v = org[c.key];
        return v == null ? "" : v;
      }),
    );
  }

  ws.autoFilter = { from: "A1", to: { row: 1, column: ORG_COLUMNS.length } };

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
