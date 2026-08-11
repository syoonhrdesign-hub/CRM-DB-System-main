/**
 * 기업 리서치 — 어떤 항목을 어떤 순서로 볼 것인가.
 *
 * 상담 화면(읽기)과 편집 폼이 이 정의 하나를 같이 쓴다.
 * 두 곳에 따로 적어 두면 항목을 추가할 때 한쪽만 고치는 일이 반드시 생긴다.
 *
 * 순서는 통화 중에 훑는 순서다. "여기가 어디인가" → "규모" → "사람을 언제 뽑나"
 * → "교육을 어떻게 보는가" → "우리는 무엇을 제안할 것인가".
 */

export type ResearchFieldKind = "text" | "textarea" | "number" | "decimal";

export type ResearchField = {
  key: string;
  label: string;
  kind?: ResearchFieldKind;
  hint?: string;
};

type Field = ResearchField;

export type ResearchSection = {
  id: string;
  title: string;
  note?: string;
  fields: Field[];
};

export const RESEARCH_SECTIONS: ResearchSection[] = [
  {
    id: "basic",
    title: "기본",
    fields: [
      { key: "legalName", label: "정식 명칭", hint: "예: 롯데지알에스 주식회사" },
      { key: "orgType", label: "기관 유형", hint: "기업 / 공공기관 / 대학 / 병원 ..." },
      { key: "industry", label: "업종" },
      { key: "foundedYear", label: "설립 연도", kind: "number" },
      { key: "ceoName", label: "대표자" },
      { key: "listingStatus", label: "상장 여부", hint: "상장 / 코스닥 / 비상장 / 외감 / 공공" },
      {
        key: "groupName",
        label: "소속 그룹",
        hint: "대기업 계열사인지 판단하는 근거. 예: 롯데그룹",
      },
      { key: "address", label: "본사 주소" },
      { key: "website", label: "홈페이지" },
      { key: "phone", label: "대표 전화" },
      { key: "bizRegNo", label: "사업자등록번호" },
      { key: "corpCode", label: "DART 고유번호", hint: "자동 조회를 붙일 때 쓴다" },
    ],
  },
  {
    id: "workforce",
    title: "인력",
    note:
      "퇴직율은 공개되지 않는다. 평균 근속연수로 대신 본다 — 근속이 짧으면 신입 유입이 많다는 뜻이라 신입 과정 제안 근거가 된다.",
    fields: [
      { key: "employeeTotal", label: "총 임직원 수", kind: "number" },
      { key: "employeeRegular", label: "정규직", kind: "number" },
      { key: "employeeIrregular", label: "기간제·비정규", kind: "number" },
      {
        key: "avgTenureYears",
        label: "평균 근속연수",
        kind: "decimal",
        hint: "DART 직원현황에 나온다",
      },
      {
        key: "pensionSubscribers",
        label: "국민연금 가입자 수",
        kind: "number",
        hint: "비상장 기업의 사실상 정직원 수",
      },
      { key: "pensionAsOf", label: "가입자 수 기준월", hint: "예: 2026-06" },
      {
        key: "headcountTrend",
        label: "최근 3년 인원 증감",
        kind: "textarea",
        hint: "'율'은 공개되지 않는다. 순증감 추세까지가 한계",
      },
    ],
  },
  {
    id: "hiring",
    title: "채용",
    fields: [
      { key: "hiringMode", label: "채용 방식", hint: "공채 / 수시 / 상시 / 인턴" },
      { key: "hiringMonths", label: "통상 채용 시기", hint: "예: 3, 9" },
      { key: "hiringScale", label: "최근 채용 규모" },
      { key: "careersUrl", label: "채용 페이지" },
      { key: "recentPostings", label: "최근 공고", kind: "textarea" },
    ],
  },
  {
    id: "hrd",
    title: "HRD · 조직문화",
    note: "대부분 홈페이지와 지속가능경영보고서에서 찾을 수 있다.",
    fields: [
      { key: "mission", label: "미션", kind: "textarea" },
      { key: "vision", label: "비전", kind: "textarea" },
      { key: "coreValues", label: "핵심가치", kind: "textarea" },
      { key: "talentProfile", label: "인재상", kind: "textarea" },
      { key: "cultureNote", label: "조직문화", kind: "textarea" },
      { key: "trainingPrograms", label: "교육 제도·프로그램", kind: "textarea" },
      { key: "hrdOrgStructure", label: "HRD 조직", hint: "예: 인재육성팀 (인사본부 산하)" },
      { key: "hrdDirection", label: "HRD 방향", kind: "textarea" },
    ],
  },
  {
    id: "business",
    title: "경영",
    fields: [
      { key: "revenue", label: "매출" },
      { key: "operatingProfit", label: "영업이익" },
      { key: "financialsAsOf", label: "재무 기준", hint: "예: 2025 사업연도" },
      { key: "sustainabilityUrl", label: "지속가능경영보고서" },
      { key: "sustainabilityNote", label: "보고서에서 참고할 것", kind: "textarea" },
    ],
  },
  {
    id: "angle",
    title: "우리 관점",
    note: "조사한 것이 아니라 우리가 판단한 것. 상담 직전에 이 칸만 다시 읽어도 된다.",
    fields: [
      { key: "salesAngle", label: "제안 포인트", kind: "textarea" },
      { key: "expectedNeeds", label: "예상 니즈", kind: "textarea" },
      { key: "cautions", label: "주의할 점", kind: "textarea" },
    ],
  },
];

/** 모든 필드를 한 줄로 — 저장·검증에서 쓴다 */
export const RESEARCH_FIELDS: Field[] = RESEARCH_SECTIONS.flatMap((s) => s.fields);

export const RESEARCH_FIELD_KEYS = RESEARCH_FIELDS.map((f) => f.key);

export const SOURCE_KINDS = [
  "공시",
  "뉴스",
  "홈페이지",
  "채용",
  "보고서",
  "기타",
] as const;

/**
 * 아직 비어 있는 항목.
 *
 * 화면에서 "확인 안 됨"과 구분해서 보여주기 위한 것이다.
 * 빈칸은 "아직 안 찾아봤다", gaps 는 "찾아봤는데 공개되지 않았다"를 뜻한다.
 */
export function researchGaps(
  research: Record<string, unknown> | null | undefined,
): { filled: number; total: number; percent: number; missing: Field[] } {
  const total = RESEARCH_FIELDS.length;
  if (!research) {
    return { filled: 0, total, percent: 0, missing: RESEARCH_FIELDS };
  }

  const missing = RESEARCH_FIELDS.filter((f) => {
    const v = research[f.key];
    return v === null || v === undefined || v === "";
  });

  const filled = total - missing.length;
  return {
    filled,
    total,
    percent: total === 0 ? 0 : Math.round((filled / total) * 100),
    missing,
  };
}

/** "찾아봤지만 없더라" 목록 — 줄바꿈으로 여러 개 */
export function parseGaps(gaps: string | null | undefined): string[] {
  return (gaps ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
