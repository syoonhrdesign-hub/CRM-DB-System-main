/**
 * 고객사 등급 산정.
 *
 * 5개 축을 각각 1~5점으로 평가하고 가중 평균을 내어 S~D 등급을 만든다.
 * 가중치와 등급 구간은 이 파일에만 있으므로, 운영하면서 감이 잡히면 여기만 고치면 된다.
 */

export const GRADE_AXES = [
  {
    key: "scorePurchase",
    label: "실제 구매 빈도",
    weight: 0.3,
    hint: "실제로 발주가 나오는가. 실적이 곧 등급의 중심이다.",
    levels: [
      "거래 이력 없음",
      "1회성 거래에 그침",
      "가끔 발주 (연 1회 수준)",
      "꾸준히 발주 (연 2~3회)",
      "정기 발주처 (연 4회 이상)",
    ],
  },
  {
    key: "scoreRecurring",
    label: "반복 교육 가능성",
    weight: 0.25,
    hint: "정기 과정으로 자리잡아 매년 반복될 수 있는가.",
    levels: [
      "반복 여지 없음",
      "반복 어려움",
      "일부 과정만 반복 가능",
      "연간 계획에 포함될 가능성 높음",
      "이미 정기 과정으로 편성됨",
    ],
  },
  {
    key: "scoreRetrain",
    label: "재교육 가능성",
    weight: 0.15,
    hint: "같은 과정을 다른 대상·차수로 다시 열 수 있는가.",
    levels: [
      "재교육 불가",
      "재교육 가능성 낮음",
      "대상 확대 시 가능",
      "차수 추가 논의 중",
      "이미 차수를 늘려 진행 중",
    ],
  },
  {
    key: "scoreSolution",
    label: "솔루션 제안 가능성",
    weight: 0.15,
    hint: "단발 과정을 넘어 교육 체계 구축·컨설팅까지 제안할 수 있는가.",
    levels: [
      "단가 경쟁만 가능",
      "과정 납품 수준",
      "커리큘럼 설계 제안 가능",
      "교육 체계 구축 제안 가능",
      "HRD 파트너로 논의 중",
    ],
  },
  {
    key: "scoreTrust",
    label: "신뢰도 · 대외 상징성",
    weight: 0.15,
    hint: "레퍼런스로 내세울 수 있는가. 다른 고객사 설득에 쓰이는 가치.",
    levels: [
      "레퍼런스 가치 없음",
      "업계 인지도 낮음",
      "동종업계에 알려진 수준",
      "업계 대표 기업·기관",
      "누구나 아는 상징적 레퍼런스",
    ],
  },
] as const;

export type GradeAxisKey = (typeof GRADE_AXES)[number]["key"];

export const GRADES = ["S", "A", "B", "C", "D"] as const;
export type Grade = (typeof GRADES)[number];

/** 등급 구간 — 가중 평균 점수(1.0~5.0)의 하한선 */
const GRADE_CUTOFFS: { grade: Grade; min: number }[] = [
  { grade: "S", min: 4.3 },
  { grade: "A", min: 3.6 },
  { grade: "B", min: 2.8 },
  { grade: "C", min: 2.0 },
  { grade: "D", min: 0 },
];

/** 등급별 기본 접촉 주기(주). 고객사에 별도 설정이 없으면 이 값을 쓴다. */
export const GRADE_CONTACT_CYCLE_WEEKS: Record<Grade, number> = {
  S: 2,
  A: 4,
  B: 8,
  C: 12,
  D: 24,
};

export const GRADE_TONE: Record<Grade, "violet" | "green" | "blue" | "amber" | "gray"> = {
  S: "violet",
  A: "green",
  B: "blue",
  C: "amber",
  D: "gray",
};

export const GRADE_DESCRIPTION: Record<Grade, string> = {
  S: "핵심 고객. 최우선으로 관리하고 접촉 주기를 짧게 가져간다.",
  A: "주요 고객. 반복 거래가 자리잡았거나 자리잡을 수 있다.",
  B: "육성 대상. 거래를 늘릴 여지가 있어 정기 접촉이 필요하다.",
  C: "관찰 대상. 최소한의 접촉으로 기회를 살핀다.",
  D: "우선순위 낮음. 자원을 크게 쓰지 않는다.",
};

export type ScoreInput = {
  scorePurchase: number | null;
  scoreRecurring: number | null;
  scoreRetrain: number | null;
  scoreSolution: number | null;
  scoreTrust: number | null;
};

export type GradeResult = {
  /// 실제로 적용되는 등급 (수동 지정이 있으면 그 값)
  grade: Grade | null;
  /// 점수로 계산한 등급
  computedGrade: Grade | null;
  /// 가중 평균 점수 (1.0~5.0)
  score: number | null;
  /// 5개 축 중 몇 개를 평가했는지
  ratedCount: number;
  /// 수동 지정으로 계산값을 덮어썼는가
  isOverridden: boolean;
};

function toGrade(score: number): Grade {
  return GRADE_CUTOFFS.find((c) => score >= c.min)!.grade;
}

/**
 * 등급을 계산한다.
 *
 * 일부 축만 평가했더라도 평가한 축들만으로 가중 평균을 낸다.
 * (안 매긴 축을 0점으로 치면 평가를 시작하자마자 D 로 떨어지기 때문)
 */
export function calculateGrade(
  scores: ScoreInput,
  override?: string | null,
): GradeResult {
  let weightSum = 0;
  let weighted = 0;
  let ratedCount = 0;

  for (const axis of GRADE_AXES) {
    const value = scores[axis.key];
    if (value == null || value < 1 || value > 5) continue;
    weighted += value * axis.weight;
    weightSum += axis.weight;
    ratedCount += 1;
  }

  const score = weightSum > 0 ? weighted / weightSum : null;
  const computedGrade = score != null ? toGrade(score) : null;

  const overrideGrade =
    override && (GRADES as readonly string[]).includes(override)
      ? (override as Grade)
      : null;

  return {
    grade: overrideGrade ?? computedGrade,
    computedGrade,
    score: score != null ? Math.round(score * 100) / 100 : null,
    ratedCount,
    isOverridden: overrideGrade != null && overrideGrade !== computedGrade,
  };
}

/**
 * 실적으로부터 "실제 구매 빈도" 점수를 제안한다.
 * 담당자가 감으로 매기기 전에 참고할 기준값이다.
 */
export function suggestPurchaseScore(
  completedTrainings: { startDate: Date }[],
): { score: number; reason: string } {
  const now = new Date();
  const oneYearAgo = new Date(
    Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()),
  );

  const total = completedTrainings.length;
  const recent = completedTrainings.filter((t) => t.startDate >= oneYearAgo).length;

  if (total === 0) return { score: 1, reason: "완료된 교육 없음" };
  if (total === 1) return { score: 2, reason: "완료 교육 1건" };
  if (recent >= 4) return { score: 5, reason: `최근 1년 ${recent}건` };
  if (recent >= 2) return { score: 4, reason: `최근 1년 ${recent}건` };
  if (recent >= 1) return { score: 3, reason: `최근 1년 ${recent}건` };
  return { score: 2, reason: `누적 ${total}건이나 최근 1년 실적 없음` };
}

/** 고객사에 설정된 접촉 주기(주). 없으면 등급 기본값, 등급도 없으면 12주. */
export function contactCycleWeeks(
  grade: Grade | null,
  override: number | null,
): number {
  if (override && override > 0) return override;
  if (grade) return GRADE_CONTACT_CYCLE_WEEKS[grade];
  return 12;
}
