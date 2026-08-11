/**
 * 기본 교육 과정 세트.
 *
 * 처음 쓰기 시작할 때 과정을 하나씩 등록하는 수고를 덜기 위한 출발점이다.
 * neoize 의 주력인 K-DISC 를 중심으로, 신입 과정과 리더십 과정을 함께 담았다.
 *
 * 시수·단가는 실제 운영에 맞춰 고치라고 넣어 둔 초기값이다.
 * 과정코드가 이미 있으면 건너뛰므로, 여러 번 눌러도 기존 과정이 덮어써지지 않는다.
 */

export type StarterCourse = {
  code: string;
  name: string;
  category: string;
  format: string;
  durationHours: number;
  defaultPrice: number;
  minHeadcount?: number;
  description: string;
};

export const STARTER_COURSES: StarterCourse[] = [
  /* ---------------------------------------------------------------------- */
  /*  K-DISC — 주력 과정                                                      */
  /* ---------------------------------------------------------------------- */
  {
    code: "KDISC-101",
    name: "K-DISC 행동유형 진단 워크숍 (기본)",
    category: "K-DISC",
    format: "집합",
    durationHours: 4,
    defaultPrice: 180_000,
    minHeadcount: 15,
    description:
      "K-DISC 진단으로 자신의 행동유형을 이해하고, 유형별 강점과 스트레스 반응을 파악한다. 진단 리포트 개인별 해석 포함.",
  },
  {
    code: "KDISC-201",
    name: "K-DISC 소통과 협업",
    category: "K-DISC",
    format: "집합",
    durationHours: 8,
    defaultPrice: 280_000,
    minHeadcount: 15,
    description:
      "서로 다른 유형이 어떻게 오해를 만드는지 사례로 다루고, 상대 유형에 맞춘 대화법을 실습한다. Respect differences 를 현장 언어로 옮기는 과정.",
  },
  {
    code: "KDISC-202",
    name: "K-DISC 팀빌딩 워크숍",
    category: "K-DISC",
    format: "집합",
    durationHours: 8,
    defaultPrice: 320_000,
    minHeadcount: 12,
    description:
      "팀 전체 유형 분포를 시각화해 팀의 강점과 사각지대를 확인하고, 역할 분담과 협업 규칙을 팀 스스로 정하게 한다.",
  },
  {
    code: "KDISC-301",
    name: "K-DISC 리더의 유형별 코칭",
    category: "K-DISC",
    format: "집합",
    durationHours: 8,
    defaultPrice: 380_000,
    minHeadcount: 10,
    description:
      "관리자 대상. 구성원 유형에 따라 지시·피드백·동기부여 방식을 달리하는 법을 다룬다.",
  },
  {
    code: "KDISC-302",
    name: "K-DISC 고객 응대 커뮤니케이션",
    category: "K-DISC",
    format: "집합",
    durationHours: 6,
    defaultPrice: 260_000,
    minHeadcount: 15,
    description:
      "고객 유형을 빠르게 읽고 응대 방식을 바꾸는 훈련. 영업·CS 부서에 적합하다.",
  },
  {
    code: "KDISC-401",
    name: "K-DISC 진단 전문가 양성 (사내 강사)",
    category: "K-DISC",
    format: "블렌디드",
    durationHours: 16,
    defaultPrice: 850_000,
    minHeadcount: 8,
    description:
      "고객사 사내 강사가 직접 K-DISC 를 운영할 수 있도록 진단 해석과 워크숍 진행법을 익힌다. 자격 인증 포함.",
  },

  /* ---------------------------------------------------------------------- */
  /*  신입 과정                                                               */
  /* ---------------------------------------------------------------------- */
  {
    code: "NEW-101",
    name: "신입사원 입문 과정",
    category: "신입",
    format: "집합",
    durationHours: 16,
    defaultPrice: 300_000,
    minHeadcount: 20,
    description:
      "조직 이해, 직장 예절, 보고와 커뮤니케이션 기본기. 입사 직후 2일 과정으로 운영한다.",
  },
  {
    code: "NEW-102",
    name: "신입사원 K-DISC 자기이해",
    category: "신입",
    format: "집합",
    durationHours: 4,
    defaultPrice: 180_000,
    minHeadcount: 20,
    description:
      "입문 과정에 붙여 운영하는 모듈. 자신의 유형을 알고 선배·동료와의 차이를 미리 이해하게 한다.",
  },
  {
    code: "NEW-201",
    name: "신입사원 팔로워십과 업무 기본기",
    category: "신입",
    format: "집합",
    durationHours: 8,
    defaultPrice: 240_000,
    minHeadcount: 20,
    description:
      "지시를 정확히 받고 되묻는 법, 중간보고, 문서 작성 기본. 입사 3~6개월 차 대상.",
  },
  {
    code: "NEW-301",
    name: "신입사원 온보딩 팔로업 (3·6개월)",
    category: "신입",
    format: "블렌디드",
    durationHours: 6,
    defaultPrice: 200_000,
    minHeadcount: 15,
    description:
      "입사 후 적응 상태를 점검하고 조기 이탈 신호를 다룬다. 멘토 대상 세션을 함께 운영할 수 있다.",
  },

  /* ---------------------------------------------------------------------- */
  /*  리더십 과정                                                             */
  /* ---------------------------------------------------------------------- */
  {
    code: "LDR-101",
    name: "신임팀장 리더십 과정",
    category: "리더십",
    format: "집합",
    durationHours: 16,
    defaultPrice: 380_000,
    minHeadcount: 15,
    description:
      "처음 팀을 맡은 관리자를 위한 역할 인식, 목표 설정, 피드백, 성과관리 기본.",
  },
  {
    code: "LDR-201",
    name: "중간관리자 코칭 리더십",
    category: "리더십",
    format: "집합",
    durationHours: 16,
    defaultPrice: 420_000,
    minHeadcount: 12,
    description:
      "지시가 아니라 질문으로 움직이게 하는 코칭 대화법. 1:1 면담 실습 중심.",
  },
  {
    code: "LDR-202",
    name: "성과면담과 피드백 스킬",
    category: "리더십",
    format: "집합",
    durationHours: 8,
    defaultPrice: 320_000,
    minHeadcount: 12,
    description:
      "말하기 어려운 피드백을 다루는 법. 평가 시즌 전에 운영하면 효과가 크다.",
  },
  {
    code: "LDR-301",
    name: "임원 리더십 · 조직문화",
    category: "리더십",
    format: "블렌디드",
    durationHours: 24,
    defaultPrice: 900_000,
    minHeadcount: 8,
    description:
      "임원급 대상. 조직문화 진단 결과를 놓고 실행 과제를 도출한다. 1:1 코칭 병행.",
  },
  {
    code: "LDR-401",
    name: "승진자 과정 (직급별)",
    category: "리더십",
    format: "집합",
    durationHours: 16,
    defaultPrice: 350_000,
    minHeadcount: 20,
    description:
      "승진 직후 역할 전환을 돕는다. 직급에 맞춰 구성을 조정해 운영한다.",
  },
];

/** 과정 분류 — 기본 과정 세트와 같은 기준을 쓴다. */
export const STARTER_CATEGORIES = [
  "K-DISC",
  "신입",
  "리더십",
] as const;
