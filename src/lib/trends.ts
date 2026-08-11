/**
 * HRD 트렌드 — 어디를 볼 것인가.
 *
 * 국내 기관 사이트는 RSS 주소가 바뀌거나 아예 없는 경우가 많다.
 * 그래서 아래 목록은 "코드에 박힌 소스"가 아니라 처음 한 번 넣어 두는 씨앗이고,
 * 실제 운영은 /trends/sources 화면에서 켜고 끄고 고친다.
 *
 * 주소가 확인되지 않은 곳은 url 을 비워 두고 kind 를 "manual" 로 둔다.
 * 사무실 PC(인터넷이 열려 있다)에서 "연결 확인"을 눌러 되는 곳만 살리면 된다.
 */

export const TREND_CATEGORIES = ["HRD", "채용", "경제", "AI", "글로벌"] as const;
export type TrendCategory = (typeof TREND_CATEGORIES)[number];

export const TREND_KINDS = {
  rss: "RSS 주소에서 읽기",
  naver: "네이버 뉴스에서 키워드로 찾기",
  manual: "직접 등록 (자동 수집 안 함)",
} as const;

export type StarterSource = {
  name: string;
  kind: keyof typeof TREND_KINDS;
  category: TrendCategory;
  url?: string;
  keyword?: string;
  /** 이 소스를 왜 보는가 — 화면에 같이 띄운다 */
  why: string;
};

export const STARTER_SOURCES: StarterSource[] = [
  /* ---------------------------------- HRD --------------------------------- */
  {
    name: "한국직업능력연구원 (KRIVET)",
    kind: "manual",
    category: "HRD",
    url: "https://www.krivet.re.kr",
    why: "정부출연 연구기관. HRD 이슈브리프(격주)와 THE HRD REVIEW. 국내 HRD 통계의 원천이다.",
  },
  {
    name: "월간HRD (한국HRD협회)",
    kind: "manual",
    category: "HRD",
    url: "https://www.khrd.co.kr",
    why: "1987년 창간. 국내 유일의 HRD 전문지로 고객사 교육담당자들이 실제로 읽는 매체다.",
  },
  {
    name: "고용노동부 보도자료",
    kind: "manual",
    category: "HRD",
    url: "https://www.moel.go.kr",
    why: "직업훈련 정책과 고용보험 환급과정 제도 변경. 우리 사업 조건이 여기서 바뀐다.",
  },
  {
    name: "기업교육·HRD 뉴스",
    kind: "naver",
    category: "HRD",
    keyword: "기업교육 HRD",
    why: "매체를 가리지 않고 훑는다. 네이버 뉴스 검색 API 를 쓴다.",
  },
  {
    name: "리더십·조직문화 뉴스",
    kind: "naver",
    category: "HRD",
    keyword: "조직문화 리더십 교육",
    why: "우리 주력 과정(리더십·조직문화)의 수요 신호.",
  },
  {
    name: "HRD인사이트",
    kind: "manual",
    category: "HRD",
    url: "https://hrdinsight.co.kr",
    why: "HRD 실무자 대상 칼럼 사이트. 현장의 관심사가 어디로 움직이는지 보인다.",
  },
  {
    name: "백서현 (조직의 단맛)",
    kind: "manual",
    category: "HRD",
    url: "https://worksweet.co.kr",
    why: "조직문화 전문가. 서강대 경영대 특임교수 · 연세대 조직문화 전문가 과정 책임. 우리 주력 분야와 정확히 겹친다.",
  },
  {
    name: "백서현 칼럼·활동",
    kind: "naver",
    category: "HRD",
    keyword: "백서현 조직문화",
    why: "여러 매체에 흩어져 실리는 칼럼·강연 소식을 한곳에서 받는다.",
  },

  /* --------------------------------- 채용 --------------------------------- */
  {
    name: "신규채용 계획 조사",
    kind: "naver",
    category: "채용",
    keyword: "신규채용 계획 조사",
    why: "대한상의·경총이 매년 발표한다. 고객사가 언제 뽑는지 예측하는 근거.",
  },
  {
    name: "신입 채용 동향",
    kind: "naver",
    category: "채용",
    keyword: "신입사원 채용 수시채용",
    why: "신입 과정 제안 타이밍과 직결된다.",
  },

  /* --------------------------------- 경제 --------------------------------- */
  {
    name: "한국은행 · KDI 경제전망",
    kind: "naver",
    category: "경제",
    keyword: "한국은행 경제전망 KDI 경제동향",
    why: "교육예산은 경기에 후행한다. 내년 예산 분위기를 먼저 읽는다.",
  },
  {
    name: "동아비즈니스리뷰 (DBR)",
    kind: "manual",
    category: "경제",
    url: "https://dbr.donga.com",
    why: "동아일보의 격주 경영 리뷰. 대부분 유료라 자동 수집 대신 좋은 글을 직접 남긴다.",
  },
  {
    name: "DBR 관련 기사",
    kind: "naver",
    category: "경제",
    keyword: "동아비즈니스리뷰 DBR",
    why: "무료로 풀리는 DBR 기사와 인용 보도를 걸러낸다.",
  },

  /* ---------------------------------- AI ---------------------------------- */
  {
    name: "AI 도입·AI 교육",
    kind: "naver",
    category: "AI",
    keyword: "기업 AI 교육 도입",
    why: "지금 HRD 예산이 가장 많이 움직이는 주제.",
  },
  {
    name: "SPRi 소프트웨어정책연구소",
    kind: "manual",
    category: "AI",
    url: "https://spri.kr",
    why: "AI 산업·정책 리포트. 뉴스보다 근거가 단단하다.",
  },

  /* -------------------------------- 글로벌 -------------------------------- */
  {
    name: "Josh Bersin",
    kind: "rss",
    category: "글로벌",
    url: "https://joshbersin.com/feed/",
    why: "HR·L&D 애널리스트. 국내 HRD 담론은 대개 여기서 1~2년 늦게 넘어온다.",
  },
  {
    name: "ATD (Association for Talent Development)",
    kind: "manual",
    category: "글로벌",
    url: "https://www.td.org",
    why: "State of the Industry — 글로벌 HRD 지표의 표준.",
  },
];

/** 네이버 뉴스 검색에 쓸 키가 있는가 */
export function hasNaverKeys(): boolean {
  return Boolean(
    process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET,
  );
}

const CATEGORY_TONE: Record<string, "blue" | "green" | "amber" | "violet" | "gray"> = {
  HRD: "blue",
  채용: "green",
  경제: "amber",
  AI: "violet",
  글로벌: "gray",
};

export function categoryTone(category: string) {
  return CATEGORY_TONE[category] ?? "gray";
}
