import { unzipSync } from "fflate";

/**
 * 금감원 DART 공시 조회.
 *
 * 회사명을 DART 고유번호(corp_code)에 대조한 뒤
 *  - 기업개황(company.json): 대표자·주소·설립일·홈페이지·사업자번호·상장 구분
 *  - 직원현황(empSttus.json): 정규직/기간제 인원, 평균 근속연수 (정기보고서 제출사만)
 * 를 가져온다.
 *
 * .env 의 DART_API_KEY 가 필요하다 (opendart.fss.or.kr 무료 발급).
 * DART_API_BASE 는 테스트에서 가짜 서버를 꽂기 위한 것 — 평소엔 건드리지 않는다.
 */

const BASE = () => process.env.DART_API_BASE || "https://opendart.fss.or.kr";

export function hasDartKey(): boolean {
  return Boolean(process.env.DART_API_KEY);
}

export type DartCorp = {
  corpCode: string;
  name: string;
  stockCode: string | null;
};

/**
 * 고유번호 목록은 10만 건짜리 zip 하나로만 내려온다.
 * 서버가 살아 있는 동안 메모리에 들고 있는다 — 재시작하면 첫 조회 때 다시 받는다.
 */
let corpIndex: Map<string, DartCorp[]> | null = null;
let corpIndexAt = 0;

export function normalizeCorpName(name: string): string {
  return name
    .replace(/[(（]\s*주\s*[)）]/g, "")
    .replace(/㈜/g, "")
    .replace(/주식회사/g, "")
    .replace(/[(（]\s*재\s*[)）]/g, "")
    .replace(/재단법인|사단법인/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

async function loadCorpIndex(): Promise<Map<string, DartCorp[]>> {
  // 하루 지난 목록은 다시 받는다 — 신규 상장·사명 변경 반영
  if (corpIndex && Date.now() - corpIndexAt < 24 * 60 * 60 * 1000) return corpIndex;

  const key = process.env.DART_API_KEY;
  const res = await fetch(`${BASE()}/api/corpCode.xml?crtfc_key=${key}`, {
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`DART 고유번호 목록 다운로드 실패 (HTTP ${res.status})`);

  const buf = new Uint8Array(await res.arrayBuffer());

  // 키가 틀리면 zip 이 아니라 에러 XML 이 온다
  if (buf[0] !== 0x50 || buf[1] !== 0x4b) {
    const text = new TextDecoder("utf-8").decode(buf.slice(0, 500));
    if (text.includes("020")) throw new Error("DART 키 사용 한도를 초과했습니다. 내일 다시 시도해 주세요.");
    throw new Error("DART 키가 올바르지 않습니다. .env 의 DART_API_KEY 를 확인해 주세요.");
  }

  const files = unzipSync(buf);
  const xmlFile = Object.keys(files).find((f) => f.toLowerCase().endsWith(".xml"));
  if (!xmlFile) throw new Error("DART 응답에서 XML 을 찾지 못했습니다.");
  const xml = new TextDecoder("utf-8").decode(files[xmlFile]);

  const index = new Map<string, DartCorp[]>();
  // 10만 건이라 정규식 한 번으로 훑는다 — XML 파서보다 빠르고 의존성이 없다
  const re = /<list>\s*<corp_code>([^<]+)<\/corp_code>\s*<corp_name>([^<]*)<\/corp_name>(?:\s*<corp_eng_name>[^<]*<\/corp_eng_name>)?\s*<stock_code>([^<]*)<\/stock_code>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const corp: DartCorp = {
      corpCode: m[1].trim(),
      name: m[2].trim(),
      stockCode: m[3].trim() || null,
    };
    const norm = normalizeCorpName(corp.name);
    if (!norm) continue;
    const list = index.get(norm);
    if (list) list.push(corp);
    else index.set(norm, [corp]);
  }

  if (index.size === 0) throw new Error("DART 고유번호 목록이 비어 있습니다.");
  corpIndex = index;
  corpIndexAt = Date.now();
  return index;
}

/**
 * 회사명으로 DART 법인을 찾는다.
 * 동명 법인이 여럿이면 상장사를 우선한다 — 우리 고객사 규모에서 맞을 확률이 높다.
 */
export async function findCorp(
  name: string,
): Promise<{ corp: DartCorp; alternatives: number } | null> {
  const index = await loadCorpIndex();
  const list = index.get(normalizeCorpName(name));
  if (!list || list.length === 0) return null;

  const listed = list.filter((c) => c.stockCode);
  const corp = listed[0] ?? list[0];
  return { corp, alternatives: list.length - 1 };
}

/* -------------------------------------------------------------------------- */

export type DartCompany = {
  legalName: string | null;
  ceoName: string | null;
  listingStatus: string | null;
  bizRegNo: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  foundedYear: number | null;
};

const CORP_CLS: Record<string, string> = {
  Y: "상장(유가증권)",
  K: "코스닥",
  N: "코넥스",
  E: "외감(비상장)",
};

/** 기업개황 */
export async function fetchCompany(corpCode: string): Promise<DartCompany | null> {
  const key = process.env.DART_API_KEY;
  const res = await fetch(
    `${BASE()}/api/company.json?crtfc_key=${key}&corp_code=${corpCode}`,
    { signal: AbortSignal.timeout(15000) },
  );
  if (!res.ok) return null;

  const j = (await res.json()) as Record<string, string>;
  if (j.status !== "000") return null;

  const est = (j.est_dt ?? "").slice(0, 4);
  let website = (j.hm_url ?? "").trim() || null;
  if (website && !/^https?:\/\//i.test(website)) website = `http://${website}`;

  return {
    legalName: j.corp_name?.trim() || null,
    ceoName: j.ceo_nm?.trim() || null,
    listingStatus: CORP_CLS[j.corp_cls] ?? null,
    bizRegNo: j.bizr_no?.trim() || null,
    address: j.adres?.trim() || null,
    website,
    phone: j.phn_no?.trim() || null,
    foundedYear: /^\d{4}$/.test(est) ? Number(est) : null,
  };
}

export type DartEmployees = {
  year: number;
  regular: number;
  contract: number;
  total: number;
  /** 인원 가중 평균 근속연수. 표기가 제각각이라 못 읽으면 null. */
  avgTenureYears: number | null;
};

/** "10.5", "10년 6개월", "10.5년" 같은 표기를 연 단위 숫자로 */
function parseTenure(raw: string): number | null {
  const s = raw.replace(/,/g, "").trim();
  if (!s || s === "-") return null;
  const ym = s.match(/(\d+)\s*년\s*(\d+)?\s*개?월?/);
  if (ym) return Number(ym[1]) + (ym[2] ? Number(ym[2]) / 12 : 0);
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function toCount(raw: string | undefined): number {
  if (!raw) return 0;
  const n = Number.parseInt(String(raw).replace(/[,\s]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * 직원현황 — 사업보고서(11011)를 최근 연도부터 3년 거슬러 찾는다.
 * 정기보고서를 안 내는 회사(비상장 다수)는 자료가 없다.
 */
export async function fetchEmployees(corpCode: string): Promise<DartEmployees | null> {
  const key = process.env.DART_API_KEY;
  const thisYear = new Date().getFullYear();

  for (let year = thisYear - 1; year >= thisYear - 3; year--) {
    const res = await fetch(
      `${BASE()}/api/empSttus.json?crtfc_key=${key}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=11011`,
      { signal: AbortSignal.timeout(15000) },
    );
    if (!res.ok) continue;

    const j = (await res.json()) as {
      status: string;
      list?: Record<string, string>[];
    };
    if (j.status !== "000" || !j.list?.length) continue;

    let regular = 0;
    let contract = 0;
    let total = 0;
    let tenureWeighted = 0;
    let tenureBase = 0;

    for (const row of j.list) {
      const reg = toCount(row.rgllbr_co);
      const cnt = toCount(row.cnttk_co);
      const sum = toCount(row.sm) || reg + cnt;
      regular += reg;
      contract += cnt;
      total += sum;

      const tenure = parseTenure(row.avrg_cnwk_sdytrn ?? "");
      if (tenure != null && sum > 0) {
        tenureWeighted += tenure * sum;
        tenureBase += sum;
      }
    }

    if (total === 0) continue;
    return {
      year,
      regular,
      contract,
      total,
      avgTenureYears: tenureBase > 0 ? Math.round((tenureWeighted / tenureBase) * 10) / 10 : null,
    };
  }
  return null;
}
