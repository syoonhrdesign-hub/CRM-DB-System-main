/**
 * 도메인 상수.
 *
 * DB 는 문자열로 저장하고(PostgreSQL 전환 및 값 추가가 쉽도록) 유효한 값의 목록과
 * 화면 표시용 색상은 여기서 한 곳으로 관리한다.
 */

export const ORG_TYPES = [
  "기업",
  "공공기관",
  "지자체",
  "대학",
  "병원",
  "비영리",
  "기타",
] as const;

export const ORG_STATUSES = ["잠재고객", "거래중", "휴면", "종료"] as const;

export const SIZE_TIERS = [
  "대기업",
  "중견기업",
  "중소기업",
  "스타트업",
] as const;

export const INDUSTRIES = [
  "제조",
  "금융·보험",
  "IT·통신",
  "건설",
  "유통·물류",
  "의료·제약",
  "교육",
  "공공·행정",
  "서비스",
  "기타",
] as const;

export const COURSE_CATEGORIES = [
  "리더십",
  "직무",
  "법정의무",
  "DX·AI",
  "CS",
  "조직문화",
  "기타",
] as const;

export const COURSE_FORMATS = ["집합", "온라인", "블렌디드"] as const;

export const TRAINING_STATUSES = ["예정", "진행중", "완료", "취소"] as const;

/** 영업 파이프라인 단계 — 배열 순서가 곧 보드의 좌→우 순서다. */
export const DEAL_STAGES = [
  "문의",
  "제안",
  "견적",
  "계약",
  "완료",
  "실패",
] as const;

/** 단계별 기본 성사 확률(%) — 새 영업건 생성 시 초기값으로 쓴다. */
export const DEAL_STAGE_PROBABILITY: Record<string, number> = {
  문의: 10,
  제안: 30,
  견적: 50,
  계약: 90,
  완료: 100,
  실패: 0,
};

/** 파이프라인에서 이미 끝난 단계 — 진행 중 예상매출 집계에서 제외한다. */
export const CLOSED_STAGES = ["완료", "실패"] as const;

/* -------------------------------------------------------------------------- */
/*  담당자 · 명함                                                              */
/* -------------------------------------------------------------------------- */

/** 담당자 재직 상태 — "재직"이 아니면 담당자 변경 이력으로 잡힌다. */
export const CONTACT_STATUSES = [
  "재직",
  "휴직",
  "퇴사",
  "타부서이동",
  "타사이직",
] as const;

export const CONTACT_STATUS_TONE: Record<string, BadgeTone> = {
  재직: "green",
  휴직: "amber",
  퇴사: "gray",
  타부서이동: "blue",
  타사이직: "violet",
};

export const CONTACT_CHANGE_REASONS = [
  "인사이동",
  "승진",
  "퇴사",
  "조직개편",
  "업무분장 변경",
  "이직",
  "기타",
] as const;

/** 처음 만난 경로 — 고객사 유입 경로와 담당자 첫 만남에 같이 쓴다. */
export const MEET_CHANNELS = [
  "전시회·박람회",
  "세미나·컨퍼런스",
  "지인 소개",
  "기존 고객 소개",
  "인바운드 문의",
  "콜드콜",
  "이메일 영업",
  "입찰 설명회",
  "협회·단체",
  "온라인 검색",
  "기타",
] as const;

/* -------------------------------------------------------------------------- */
/*  기업 프로파일                                                              */
/* -------------------------------------------------------------------------- */

/** 내근직 / 현장직 — 교육 방식(집합·교대조·온라인)을 좌우한다. */
export const WORKFORCE_TYPES = ["내근직 중심", "현장직 중심", "혼합"] as const;

export const BUDGET_CYCLES = ["연간", "반기", "분기", "수시"] as const;

export const EXPANSION_LEVELS = ["높음", "보통", "낮음"] as const;

export const EXPANSION_TONE: Record<string, BadgeTone> = {
  높음: "green",
  보통: "amber",
  낮음: "gray",
};

export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export const ACTIVITY_TYPES = [
  "전화",
  "이메일",
  "미팅",
  "방문",
  "제안발표",
  "기타",
] as const;

export const LOST_REASONS = [
  "가격",
  "경쟁사",
  "예산 미확보",
  "시기 부적합",
  "내부 진행",
  "기타",
] as const;

/* -------------------------------------------------------------------------- */
/*  배지 색상                                                                   */
/* -------------------------------------------------------------------------- */

type BadgeTone = "gray" | "blue" | "green" | "amber" | "red" | "violet";

export const ORG_STATUS_TONE: Record<string, BadgeTone> = {
  잠재고객: "blue",
  거래중: "green",
  휴면: "amber",
  종료: "gray",
};

export const DEAL_STAGE_TONE: Record<string, BadgeTone> = {
  문의: "gray",
  제안: "blue",
  견적: "violet",
  계약: "amber",
  완료: "green",
  실패: "red",
};

export const TRAINING_STATUS_TONE: Record<string, BadgeTone> = {
  예정: "blue",
  진행중: "amber",
  완료: "green",
  취소: "gray",
};

export const ACTIVITY_TYPE_TONE: Record<string, BadgeTone> = {
  전화: "blue",
  이메일: "violet",
  미팅: "green",
  방문: "amber",
  제안발표: "red",
  기타: "gray",
};
