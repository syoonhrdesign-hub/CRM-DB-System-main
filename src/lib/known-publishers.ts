/**
 * 아는 매체 — 주소만 붙여넣으면 출처와 갈래를 자동으로 채우기 위한 표.
 *
 * DBR 처럼 유료 구독으로 "읽다가" 남기는 소스가 있어서 만들었다.
 * 읽던 글의 주소를 붙여넣는 데 걸리는 손이 적을수록 트렌드 피드와
 * 주간 브리핑의 재료가 좋아진다.
 */

export type KnownPublisher = {
  /** 화면에 표시할 출처명 */
  name: string;
  /** 기본 갈래 (HRD / 채용 / 경제 / AI / 글로벌) */
  category: string;
};

const TABLE: Record<string, KnownPublisher> = {
  "dbr.donga.com": { name: "동아비즈니스리뷰", category: "경제" },
  "khrd.co.kr": { name: "월간HRD", category: "HRD" },
  "krivet.re.kr": { name: "KRIVET", category: "HRD" },
  "hrdinsight.co.kr": { name: "HRD인사이트", category: "HRD" },
  "worksweet.co.kr": { name: "조직의 단맛", category: "HRD" },
  "moel.go.kr": { name: "고용노동부", category: "HRD" },
  "work24.go.kr": { name: "고용24", category: "채용" },
  "korcham.net": { name: "대한상공회의소", category: "채용" },
  "kefplaza.com": { name: "한국경영자총협회", category: "채용" },
  "bok.or.kr": { name: "한국은행", category: "경제" },
  "kdi.re.kr": { name: "KDI", category: "경제" },
  "spri.kr": { name: "SPRi", category: "AI" },
  "joshbersin.com": { name: "Josh Bersin", category: "글로벌" },
  "td.org": { name: "ATD", category: "글로벌" },
};

/** 주소를 보고 아는 매체인지 찾는다. 모르면 null. */
export function lookupPublisher(url: string): KnownPublisher | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }

  // www.dbr.donga.com 처럼 앞이 붙어도, dbr.donga.com 그대로여도 찾도록
  // 호스트 끝부분 일치로 본다.
  for (const [key, value] of Object.entries(TABLE)) {
    if (host === key || host.endsWith(`.${key}`)) return value;
  }
  return null;
}
