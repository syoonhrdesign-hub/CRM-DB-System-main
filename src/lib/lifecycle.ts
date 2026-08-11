/**
 * 고객사 생애주기.
 *
 * 담당자가 따로 입력하는 값이 아니라 거래 이력에서 계산한다.
 * 입력을 요구하면 반드시 낡은 값이 남기 때문에, 사실(거래 기록)로부터 매번 유도한다.
 */

export const LIFECYCLE_STAGES = [
  "발굴",
  "첫거래",
  "반복거래",
  "확장",
  "이탈위험",
  "휴면",
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const LIFECYCLE_TONE: Record<
  LifecycleStage,
  "gray" | "blue" | "green" | "violet" | "amber" | "red"
> = {
  발굴: "gray",
  첫거래: "blue",
  반복거래: "green",
  확장: "violet",
  이탈위험: "amber",
  휴면: "red",
};

export const LIFECYCLE_ACTION: Record<LifecycleStage, string> = {
  발굴: "니즈와 예산 시기를 파악해 첫 거래를 만든다.",
  첫거래: "만족도를 확인하고 두 번째 발주로 잇는다.",
  반복거래: "연간 계획에 정기 과정으로 편성되도록 제안한다.",
  확장: "타 부서·계열사로 넓히고 교육 체계 제안을 검토한다.",
  이탈위험: "접촉이 끊긴 원인을 확인하고 재접촉한다.",
  휴면: "담당자 교체 여부를 확인하고 처음부터 다시 관계를 만든다.",
};

/** 완료 교육 이력에서 생애주기 단계를 판정한다. */
export function calculateLifecycle(
  completed: { startDate: Date; courseCategory: string | null }[],
): { stage: LifecycleStage; monthsSinceLast: number | null; dealCount: number } {
  const dealCount = completed.length;

  if (dealCount === 0) {
    return { stage: "발굴", monthsSinceLast: null, dealCount: 0 };
  }

  const last = completed.reduce(
    (max, t) => (t.startDate > max ? t.startDate : max),
    completed[0].startDate,
  );

  const now = new Date();
  const monthsSinceLast =
    (now.getUTCFullYear() - last.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - last.getUTCMonth());

  // 오래 끊긴 쪽을 먼저 본다 — 과거에 아무리 많이 거래했어도 지금 끊겼으면 그게 현재 상태다.
  if (monthsSinceLast >= 18) return { stage: "휴면", monthsSinceLast, dealCount };
  if (monthsSinceLast >= 12) return { stage: "이탈위험", monthsSinceLast, dealCount };

  // 서로 다른 분류의 과정을 2개 이상 진행했다면 이미 확장된 관계로 본다.
  const categories = new Set(
    completed.map((t) => t.courseCategory).filter((c): c is string => c != null),
  );
  if (dealCount >= 3 && categories.size >= 2) {
    return { stage: "확장", monthsSinceLast, dealCount };
  }
  if (dealCount >= 2) return { stage: "반복거래", monthsSinceLast, dealCount };
  return { stage: "첫거래", monthsSinceLast, dealCount };
}
