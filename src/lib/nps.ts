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

const ROOT = () => process.env.NPS_API_BASE || "https://apis.data.go.kr/B552015";

/**
 * 서비스 주소 후보.
 *
 * 공공데이터포털이 이 API 를 V2 로 옮기면서 옛 주소는 "폐기"(코드 12)가 됐다.
 * 어느 쪽이 살아 있는지는 호출해 봐야 알고, 앞으로 또 바뀔 수도 있다.
 * 그래서 후보를 순서대로 두고 "서비스 없음"이 오면 다음 것으로 넘어간다.
 * 한 번 통한 주소는 기억해서 다음 호출부터 바로 그리로 간다 — 수백 곳을
 * 도는 일괄 조회에서 매번 헛걸음하지 않기 위해서다.
 */
type ServiceVariant = { service: string; suffix: string };

const SERVICE_VARIANTS: ServiceVariant[] = [
  { service: "NpsBplcInfoInqireServiceV2", suffix: "V2" },
  { service: "NpsBplcInfoInqireServiceV2", suffix: "" },
  { service: "NpsBplcInfoInqireService", suffix: "" },
];

let liveVariant: ServiceVariant | null = null;

/**
 * 조회 조건 이름 표기.
 *
 * 옛 주소는 wkpl_nm 처럼 밑줄 표기를 썼는데, V2 로 오면서 응답 항목과 같은
 * wkplNm 표기로 바뀐 것으로 보인다. 주소가 살아 있어도 표기가 다르면 조회는
 * 성공하고 결과만 늘 비어서, 오류 없이 조용히 아무것도 못 찾는다.
 * 그래서 두 표기를 다 시도하고, 결과가 나온 쪽을 기억한다.
 */
type ParamStyle = "camel" | "snake";

let liveParamStyle: ParamStyle | null = null;

/** wkpl_nm → wkplNm. pageNo·numOfRows·seq 처럼 밑줄이 없는 이름은 그대로다. */
function styleParams(
  params: Record<string, string>,
  style: ParamStyle,
): Record<string, string> {
  if (style === "snake") return params;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    out[k.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase())] = v;
  }
  return out;
}

/** 응답 항목 이름도 표기가 다를 수 있어 몇 가지를 함께 본다 */
function pick(item: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = item[k];
    if (v !== undefined && v !== null && String(v) !== "") return String(v);
  }
  return "";
}

/** 이 API 주소가 폐기됐다는 응답 — 다른 후보로 넘어가도 되는 유일한 경우 */
class NoSuchServiceError extends Error {}

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

/**
 * data.go.kr 게이트웨이 공통 오류 코드 → 사람이 읽을 메시지.
 *
 * 주의: 이 오류들은 HTTP 400 과 함께 오는 경우가 많다. 그래서 상태 코드만 보고
 * 실패 처리하면 "왜 안 되는지"를 통째로 잃는다. 본문을 항상 먼저 읽는다.
 */
const GATEWAY_ERRORS: Record<string, string> = {
  "01": "국민연금 API 제공기관 시스템 오류입니다. 잠시 뒤 다시 시도해 주세요.",
  "04": "국민연금 API 요청 형식이 맞지 않습니다 (HTTP 오류).",
  "12":
    "국민연금 API 주소를 찾지 못했습니다 (알고 있는 주소가 모두 폐기됨). " +
    "data.go.kr 의 '국민연금공단_국민연금 가입 사업장 내역' 문서에서 " +
    "현재 주소를 확인해 코드를 고쳐야 합니다.",
  "20": "국민연금 API 접근이 거부되었습니다. data.go.kr 에서 활용신청 승인 상태를 확인해 주세요.",
  "22": "국민연금 API 일일 호출 한도를 넘었습니다. 내일 다시 시도해 주세요.",
  "30":
    "이 키로는 국민연금 사업장 API를 쓸 수 없습니다. data.go.kr 에서 " +
    "'국민연금공단_국민연금 가입 사업장 내역'(데이터 15083277) 활용신청이 " +
    "승인됐는지 확인해 주세요. 신청 직후에는 1시간쯤 뒤에 열립니다.",
  "31": "국민연금 API 활용 기간이 만료되었습니다. data.go.kr 에서 연장 신청해 주세요.",
  "32": "등록되지 않은 도메인·IP 에서의 호출입니다. data.go.kr 신청 정보를 확인해 주세요.",
  "33": "서명하지 않은 호출입니다. data.go.kr 신청 정보를 확인해 주세요.",
  "99": "국민연금 API 기타 오류입니다. 잠시 뒤 다시 시도해 주세요.",
};

const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false });

/**
 * 후보 주소를 차례로 시도한다. "서비스 없음"이 아닌 오류는 즉시 올린다 —
 * 키 문제나 한도 초과인데 주소를 바꿔 가며 다시 부르면 시간만 버린다.
 */
async function callNps(
  operation: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const order = liveVariant
    ? [liveVariant, ...SERVICE_VARIANTS.filter((v) => v !== liveVariant)]
    : SERVICE_VARIANTS;

  let lastMissing: Error | null = null;

  for (const variant of order) {
    try {
      const body = await callVariant(variant, operation, params);
      liveVariant = variant; // 통한 주소를 기억한다
      return body;
    } catch (e) {
      if (e instanceof NoSuchServiceError) {
        lastMissing = e;
        continue;
      }
      throw e;
    }
  }

  throw (
    lastMissing ??
    new Error("국민연금 API 주소를 찾지 못했습니다. data.go.kr 문서 확인이 필요합니다.")
  );
}

async function callVariant(
  variant: ServiceVariant,
  operation: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const path = `${variant.service}/${operation}${variant.suffix}`;
  const url = `${ROOT()}/${path}?serviceKey=${serviceKeyParam()}&${qs}`;

  const res = await fetch(url, { cache: "no-store" });

  // 상태 코드로 먼저 끊지 않는다 — 공공데이터포털은 키·승인 문제를 HTTP 400 에
  // 실어 보내면서 진짜 이유는 본문 XML 에 담는다. 본문을 먼저 읽어야 원인이 보인다.
  const text = await res.text();

  let xml: Record<string, unknown>;
  try {
    xml = parser.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(
      `국민연금 API 응답을 읽지 못했습니다 (HTTP ${res.status}). ${snippet(text)}`,
    );
  }

  // 게이트웨이 오류 봉투 (키·승인·한도 문제는 이 형태로 온다)
  const gw = xml.OpenAPI_ServiceResponse as Record<string, unknown> | undefined;
  if (gw) {
    const header = gw.cmmMsgHeader as Record<string, unknown> | undefined;
    const raw = String(header?.returnReasonCode ?? "").trim();
    const code = raw.length === 1 ? `0${raw}` : raw;
    const authMsg = String(header?.returnAuthMsg ?? header?.errMsg ?? "").trim();
    const message =
      GATEWAY_ERRORS[code] ??
      `국민연금 API 오류 (코드 ${code || "?"}${authMsg ? `, ${authMsg}` : ""})`;
    // 12 = 서비스 없음/폐기. 이때만 다음 주소 후보로 넘어간다.
    throw code === "12" ? new NoSuchServiceError(message) : new Error(message);
  }

  const response = xml.response as Record<string, unknown> | undefined;
  const header = response?.header as Record<string, unknown> | undefined;
  const code = String(header?.resultCode ?? "").trim();
  if (code && code !== "00") {
    throw new Error(
      GATEWAY_ERRORS[code] ??
        `국민연금 API 오류: ${String(header?.resultMsg ?? "")} (코드 ${code})`,
    );
  }

  // 여기까지 왔는데 응답 껍데기가 없으면, 그때는 상태 코드가 유일한 단서다
  if (!response) {
    if (!res.ok) {
      throw new Error(
        `국민연금 API 응답 오류 (HTTP ${res.status}). ${snippet(text)}`,
      );
    }
    return {};
  }

  return (response.body as Record<string, unknown>) ?? {};
}

/** 오류 화면에 붙일 응답 조각 — 키가 섞여 나가지 않게 짧게 자른다 */
function snippet(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return "(응답 내용 없음)";
  return `응답: ${flat.slice(0, 160)}`;
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

/**
 * 같은 회사의 사업장인지 판단한다.
 *
 * 국민연금 사업장 검색은 이름이 스치기만 해도 걸린다. "삼성전자" 로 찾으면
 * "유일이엔지/상용/평택 삼성전자 P4 Hook up" 같은 공사현장까지 2천 건 넘게
 * 나온다. 그대로 합산하면 하청업체 인원이 그 회사 직원으로 둔갑한다.
 *
 * 그래서 이름이 앞에서부터 맞는 경우만 인정하고, 뒤에 붙은 꼬리가 지점 표기일
 * 때만 같은 회사로 본다. "삼성전자서비스" 처럼 다른 법인은 걸러진다.
 */
const BRANCH_MARK =
  /(본사|본점|본부|지점|지사|지부|지회|사업소|사업장|영업소|출장소|공장|센터|캠퍼스|연수원)/;

export function isSameWorkplace(workplaceName: string, companyName: string): boolean {
  const w = normalizeWorkplaceName(workplaceName);
  const t = normalizeWorkplaceName(companyName);
  if (!w || !t) return false;
  if (w === t) return true;
  if (!w.startsWith(t)) return false;

  // 앞은 같고 뒤에 뭔가 더 붙어 있다 — 지점 표기 정도라면 같은 회사로 본다
  const rest = w.slice(t.length);
  return rest.length <= 10 && BRANCH_MARK.test(rest);
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

  // 표기를 아직 모르면 둘 다 시도한다. 한 번이라도 결과가 나오면 그 표기로 굳힌다.
  const styles: ParamStyle[] = liveParamStyle ? [liveParamStyle] : ["camel", "snake"];

  let items: Record<string, unknown>[] = [];
  for (const style of styles) {
    const body = await callNps("getBassInfoSearch", styleParams(params, style));
    items = itemsOf(body);
    if (items.length > 0) {
      liveParamStyle = style; // 통한 표기를 기억한다
      break;
    }
  }

  return items
    .map((it) => ({
      seq: pick(it, "seq"),
      name: pick(it, "wkplNm", "wkpl_nm"),
      bizRegPrefix: pick(it, "bzowrRgstNo", "bzowr_rgst_no"),
      dataCrtYm: pick(it, "dataCrtYm", "data_crt_ym"),
      address: pick(it, "wkplRoadNmDtlAddr", "wkpl_road_nm_dtl_addr"),
    }))
    .filter((w) => w.seq && w.name)
    // 번호로 찾았어도 같은 앞 6자리의 남의 회사가 섞이고, 이름으로 찾으면
    // 이름이 스친 남의 사업장이 잔뜩 딸려 온다. 둘 다 여기서 걸러낸다.
    .filter((w) => isSameWorkplace(w.name, opts.name));
}

export type NpsDetail = {
  subscribers: number;
  dataCrtYm: string;
};

/** 사업장 한 곳의 가입자 수 */
export async function fetchWorkplaceDetail(seq: string): Promise<NpsDetail | null> {
  // pageNo·numOfRows 는 공공데이터포털 공통 필수값이다. 빼면 400 이 날 수 있다.
  const body = await callNps(
    "getDetailInfoSearch",
    styleParams({ seq, pageNo: "1", numOfRows: "10" }, liveParamStyle ?? "camel"),
  );
  const item = itemsOf(body)[0];
  if (!item) return null;
  const n = Number.parseInt(pick(item, "jnngpCnt", "jnngp_cnt").replace(/\D/g, ""), 10);
  if (!Number.isFinite(n)) return null;
  return { subscribers: n, dataCrtYm: pick(item, "dataCrtYm", "data_crt_ym") };
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
