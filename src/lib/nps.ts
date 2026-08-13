import { XMLParser } from "fast-xml-parser";

/**
 * 국민연금공단 "가입 사업장 내역" 조회 (data.go.kr B552015).
 *
 * DART 가 못 채우는 회사(비상장·소규모·공공기관)의 규모를 여기서 본다.
 * 가입자 수 ≒ 상시 직원 수. 임직원 수 칸과는 따로 둔다 — 뜻이 다르다.
 *
 * 응답은 XML 이다. 회사 하나가 사업장 여러 곳(본사·지점)으로 등록돼 있는
 * 경우가 많아서, 이름이 맞는 "등록" 상태 사업장의 가입자 수를 합산한다.
 */

const BASE = () =>
  process.env.NPS_API_BASE || "https://apis.data.go.kr/B552015/NpsBplcInfoInqireService";

export function hasNpsKey(): boolean {
  return Boolean(process.env.NPS_API_KEY);
}

/**
 * data.go.kr 키는 발급 화면에 URL 인코딩된 형태(%2B, %3D…)와 원본(Decoding)
 * 두 가지로 표시된다. 어느 쪽을 넣어도 동작하게 한다:
 * 인코딩된 형태면 그대로 쓰고, 원본이면 한 번 인코딩한다.
 */
function serviceKeyParam(): string {
  const key = (process.env.NPS_API_KEY ?? "").trim();
  try {
    if (decodeURIComponent(key) !== key) return key; // 이미 인코딩된 키
  } catch {
    // 디코딩이 깨지는 문자열 = 인코딩된 키가 아님
  }
  return encodeURIComponent(key);
}

/** data.go.kr 게이트웨이 공통 오류 코드 → 사람이 읽을 메시지 */
const GATEWAY_ERRORS: Record<string, string> = {
  "20": "국민연금 API 접근이 거부되었습니다. data.go.kr 에서 활용신청 승인 상태를 확인해 주세요.",
  "22": "국민연금 API 일일 호출 한도를 넘었습니다. 내일 다시 시도해 주세요.",
  "30": "국민연금 키가 등록되지 않았습니다. .env 의 NPS_API_KEY 를 확인해 주세요.",
  "31": "국민연금 API 활용 기간이 만료되었습니다. data.go.kr 에서 연장 신청해 주세요.",
};

const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false });

async function callNps(
  endpoint: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const url = `${BASE()}/${endpoint}?serviceKey=${serviceKeyParam()}&${qs}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`국민연금 API 응답 오류 (HTTP ${res.status})`);

  const xml = parser.parse(await res.text()) as Record<string, unknown>;

  // 게이트웨이 오류 봉투 (키·한도 문제는 이 형태로 온다)
  const gw = xml.OpenAPI_ServiceResponse as Record<string, unknown> | undefined;
  if (gw) {
    const header = gw.cmmMsgHeader as Record<string, unknown> | undefined;
    const code = String(header?.returnReasonCode ?? "").padStart(2, "0");
    throw new Error(GATEWAY_ERRORS[code] ?? `국민연금 API 오류 (코드 ${code})`);
  }

  const response = xml.response as Record<string, unknown> | undefined;
  const header = response?.header as Record<string, unknown> | undefined;
  const code = String(header?.resultCode ?? "");
  if (code && code !== "00") {
    throw new Error(
      GATEWAY_ERRORS[code] ??
        `국민연금 API 오류: ${String(header?.resultMsg ?? "")} (코드 ${code})`,
    );
  }
  return (response?.body as Record<string, unknown>) ?? {};
}

function itemsOf(body: Record<string, unknown>): Record<string, unknown>[] {
  const items = body.items as Record<string, unknown> | undefined;
  const item = items?.item;
  if (!item) return [];
  return (Array.isArray(item) ? item : [item]) as Record<string, unknown>[];
}

/** 회사명 비교용 정규화 — dart.ts 와 같은 규칙 (주식회사·공백 등 제거) */
export function normalizeWorkplaceName(name: string): string {
  return name
    .replace(/\(주\)|㈜|\(유\)|\(사\)|\(재\)/g, "")
    .replace(/주식회사|유한회사|유한책임회사|사단법인|재단법인|농업회사법인/g, "")
    .replace(/[\s·.,\-()]/g, "")
    .toLowerCase();
}

export type NpsWorkplace = {
  seq: string;
  name: string;
  /** 사업자등록번호 앞 6자리 (뒤는 API 가 가려서 준다) */
  bizRegPrefix: string;
  /** 자료 생성 년월, 예: "202606" */
  dataCrtYm: string;
  address: string;
};

/**
 * 사업장 검색. 사업자등록번호 앞 6자리가 있으면 그걸 우선 쓴다 —
 * 이름 검색보다 오인이 훨씬 적다.
 */
export async function searchWorkplaces(opts: {
  name: string;
  bizRegNo?: string | null;
}): Promise<NpsWorkplace[]> {
  const params: Record<string, string> = {
    wkpl_jnng_stcd: "1", // 등록(가입 중)만 — 탈퇴 사업장 제외
    numOfRows: "100",
    pageNo: "1",
  };

  const digits = (opts.bizRegNo ?? "").replace(/\D/g, "");
  if (digits.length >= 6) params.bzowr_rgst_no = digits.slice(0, 6);
  else params.wkpl_nm = opts.name.trim();

  const body = await callNps("getBassInfoSearch", params);

  const norm = normalizeWorkplaceName(opts.name);
  return itemsOf(body)
    .map((it) => ({
      seq: String(it.seq ?? ""),
      name: String(it.wkplNm ?? ""),
      bizRegPrefix: String(it.bzowrRgstNo ?? ""),
      dataCrtYm: String(it.dataCrtYm ?? ""),
      address: String(it.wkplRoadNmDtlAddr ?? ""),
    }))
    .filter((w) => w.seq && w.name)
    .filter((w) => {
      // 번호로 찾았어도 같은 앞 6자리의 남의 회사가 섞일 수 있어 이름을 대조한다
      const wn = normalizeWorkplaceName(w.name);
      return wn.includes(norm) || norm.includes(wn);
    });
}

export type NpsDetail = {
  subscribers: number;
  dataCrtYm: string;
};

/** 사업장 한 곳의 가입자 수 */
export async function fetchWorkplaceDetail(seq: string): Promise<NpsDetail | null> {
  const body = await callNps("getDetailInfoSearch", { seq });
  const item = itemsOf(body)[0];
  if (!item) return null;
  const n = Number.parseInt(String(item.jnngpCnt ?? "").replace(/\D/g, ""), 10);
  if (!Number.isFinite(n)) return null;
  return { subscribers: n, dataCrtYm: String(item.dataCrtYm ?? "") };
}

export type NpsSummary = {
  /** 이름이 맞는 등록 사업장들의 가입자 합계 */
  subscribers: number;
  /** "YYYY-MM" */
  asOf: string | null;
  /** 합산에 들어간 사업장 수 (본사+지점) */
  siteCount: number;
};

/** 상세 조회는 사업장마다 한 번씩 — 폭주를 막기 위해 상한을 둔다 */
const MAX_SITES = 15;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 회사 하나의 국민연금 요약. 못 찾으면 null.
 */
export async function fetchNpsSummary(opts: {
  name: string;
  bizRegNo?: string | null;
}): Promise<NpsSummary | null> {
  const places = await searchWorkplaces(opts);
  if (places.length === 0) return null;

  let subscribers = 0;
  let siteCount = 0;
  let asOfRaw = "";

  for (const place of places.slice(0, MAX_SITES)) {
    const detail = await fetchWorkplaceDetail(place.seq);
    if (detail) {
      subscribers += detail.subscribers;
      siteCount += 1;
      if (detail.dataCrtYm > asOfRaw) asOfRaw = detail.dataCrtYm;
    }
    await wait(80);
  }

  if (siteCount === 0) return null;
  const asOf =
    asOfRaw.length === 6 ? `${asOfRaw.slice(0, 4)}-${asOfRaw.slice(4, 6)}` : null;
  return { subscribers, asOf, siteCount };
}
