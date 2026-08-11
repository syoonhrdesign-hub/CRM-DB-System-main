/**
 * 프로파일 완성도.
 *
 * "이 고객사에 대해 우리가 아직 모르는 것"을 눈에 보이게 만든다.
 * 통화 전에 이 목록을 보면 무엇을 물어봐야 하는지 바로 나온다.
 */

import type { AccountProfile } from "@prisma/client";

type Item = {
  key: keyof AccountProfile;
  label: string;
  /** 통화에서 실제로 물어볼 만한 문장 */
  question: string;
  group: "조직" | "예산" | "시즌" | "교육·문화" | "확장";
};

export const PROFILE_ITEMS: Item[] = [
  {
    key: "workforceType",
    label: "인력 구성",
    question: "직원분들이 주로 사무실 근무인가요, 현장 근무인가요?",
    group: "조직",
  },
  {
    key: "hrStructure",
    label: "HR 조직 구조",
    question: "교육은 인사팀에서 맡으시나요, 별도 인재개발 조직이 있으신가요?",
    group: "조직",
  },
  {
    key: "decisionProcess",
    label: "의사결정 구조",
    question: "교육 발주는 어느 선까지 결재가 올라가나요?",
    group: "조직",
  },
  {
    key: "budgetMonth",
    label: "예산 편성 시기",
    question: "다음 해 교육 예산은 보통 몇 월에 편성하시나요?",
    group: "예산",
  },
  {
    key: "budgetCycle",
    label: "예산 확정 주기",
    question: "예산은 연간으로 한 번에 잡으시나요, 분기별로 나누시나요?",
    group: "예산",
  },
  {
    key: "budgetScale",
    label: "예산 규모",
    question: "연간 교육 예산은 대략 어느 정도 규모인가요?",
    group: "예산",
  },
  {
    key: "hiringMonths",
    label: "채용 시즌",
    question: "채용은 주로 언제 하시나요? 공채가 있나요?",
    group: "시즌",
  },
  {
    key: "trainingMonths",
    label: "교육 시즌",
    question: "교육이 몰리는 시기가 언제인가요?",
    group: "시즌",
  },
  {
    key: "regularPrograms",
    label: "정기 교육",
    question: "매년 반복해서 하시는 교육은 어떤 것들이 있나요?",
    group: "교육·문화",
  },
  {
    key: "cultureActivities",
    label: "조직문화 활동",
    question: "조직문화 관련해서 진행하시는 활동이 있으신가요?",
    group: "교육·문화",
  },
  {
    key: "competitors",
    label: "기존 거래 업체",
    question: "지금은 어느 업체와 주로 진행하고 계신가요?",
    group: "교육·문화",
  },
  {
    key: "expansionLevel",
    label: "타 부서 확장 가능성",
    question: "다른 부서에서도 교육 수요가 있을까요? 소개해주실 만한 곳이 있나요?",
    group: "확장",
  },
];

export type ProfileCompleteness = {
  filled: number;
  total: number;
  percent: number;
  /** 아직 파악하지 못한 항목 — 다음 통화의 질문 목록이 된다 */
  missing: Item[];
};

function isFilled(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return true;
  return Boolean(value);
}

export function profileCompleteness(
  profile: AccountProfile | null,
): ProfileCompleteness {
  const total = PROFILE_ITEMS.length;

  if (!profile) {
    return { filled: 0, total, percent: 0, missing: PROFILE_ITEMS };
  }

  const missing = PROFILE_ITEMS.filter((item) => !isFilled(profile[item.key]));
  const filled = total - missing.length;

  return {
    filled,
    total,
    percent: Math.round((filled / total) * 100),
    missing,
  };
}
