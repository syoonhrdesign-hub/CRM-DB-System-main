/**
 * 데모용 시드 데이터.
 *
 * 화면이 어떻게 채워지는지 바로 볼 수 있도록 가상의 고객사·교육 이력을 넣는다.
 * 실제 운영에 쓸 때는 이 파일을 실행하지 말고 `npx prisma db push` 만 하면 된다.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/** 오늘로부터 n일 전/후 (UTC 자정 기준) */
function day(offset: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset),
  );
}

/** 오늘로부터 n개월 전/후의 d일 */
function month(offset: number, d = 15): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, d));
}

async function main() {
  console.log("기존 데이터를 지우는 중…");
  // 외래키 제약을 피하려고 자식부터 지운다.
  await db.activity.deleteMany();
  await db.deal.deleteMany();
  await db.training.deleteMany();
  await db.contact.deleteMany();
  await db.course.deleteMany();
  await db.organization.deleteMany();

  console.log("교육 과정 생성 중…");
  const courses = await Promise.all(
    [
      {
        code: "LDR-001",
        name: "신임팀장 리더십 과정",
        category: "리더십",
        format: "집합",
        durationHours: 16,
        defaultPrice: 350_000,
        minHeadcount: 15,
        description: "처음 팀을 맡은 관리자를 위한 역할 인식·피드백·성과관리 과정",
      },
      {
        code: "LDR-002",
        name: "임원 코칭 리더십",
        category: "리더십",
        format: "블렌디드",
        durationHours: 24,
        defaultPrice: 800_000,
        minHeadcount: 8,
        description: "임원급 대상 1:1 코칭과 그룹 세션 병행",
      },
      {
        code: "LAW-001",
        name: "직장 내 괴롭힘 예방교육 (법정의무)",
        category: "법정의무",
        format: "온라인",
        durationHours: 1,
        defaultPrice: 15_000,
        description: "연 1회 실시 의무 교육",
      },
      {
        code: "LAW-002",
        name: "산업안전보건 교육 (법정의무)",
        category: "법정의무",
        format: "온라인",
        durationHours: 6,
        defaultPrice: 30_000,
        description: "분기별 정기 안전보건 교육",
      },
      {
        code: "DX-001",
        name: "실무자를 위한 생성형 AI 활용",
        category: "DX·AI",
        format: "집합",
        durationHours: 8,
        defaultPrice: 280_000,
        minHeadcount: 20,
        description: "문서 작성·데이터 정리 실습 중심",
      },
      {
        code: "DX-002",
        name: "데이터 리터러시 기초",
        category: "DX·AI",
        format: "블렌디드",
        durationHours: 12,
        defaultPrice: 320_000,
        minHeadcount: 20,
      },
      {
        code: "CS-001",
        name: "고객 응대 커뮤니케이션",
        category: "CS",
        format: "집합",
        durationHours: 8,
        defaultPrice: 200_000,
        minHeadcount: 20,
      },
      {
        code: "ORG-001",
        name: "조직문화 진단 워크숍",
        category: "조직문화",
        format: "집합",
        durationHours: 8,
        defaultPrice: 400_000,
        minHeadcount: 12,
        isActive: false,
      },
    ].map((data) => db.course.create({ data })),
  );

  const byCode = Object.fromEntries(courses.map((c) => [c.code, c]));

  console.log("고객사 생성 중…");

  const hanbit = await db.organization.create({
    data: {
      name: "한빛전자 주식회사",
      shortName: "한빛전자",
      bizRegNo: "1208147521",
      orgType: "기업",
      industry: "제조",
      sizeTier: "대기업",
      employeeCount: 12_400,
      status: "거래중",
      phone: "02-3400-1000",
      website: "https://example.com",
      address: "경기도 수원시 영통구 삼성로 129",
      ownerName: "김영업",
      memo: "매년 3월 연간 교육계획 확정. 인재개발원 자체 강사진 보유로 외부 위탁은 리더십·DX 위주.",
      contacts: {
        create: [
          {
            name: "박지훈",
            department: "인재개발원",
            position: "팀장",
            email: "jh.park@example.com",
            phone: "02-3400-1234",
            mobile: "010-2345-6789",
            isPrimary: true,
            memo: "오전 연락 선호. 예산 집행 권한 있음.",
          },
          {
            name: "이수민",
            department: "인재개발원",
            position: "대리",
            email: "sm.lee@example.com",
            mobile: "010-3456-7890",
            memo: "실무 협의 창구",
          },
        ],
      },
    },
  });

  const seoulCity = await db.organization.create({
    data: {
      name: "서울특별시 인재개발원",
      shortName: "서울인재원",
      orgType: "지자체",
      industry: "공공·행정",
      employeeCount: 320,
      status: "거래중",
      phone: "02-3488-2000",
      address: "서울특별시 서초구 남부순환로 2411",
      ownerName: "정컨설",
      memo: "연간 단가계약 방식. 나라장터 입찰 건은 별도 관리.",
      contacts: {
        create: [
          {
            name: "최민서",
            department: "교육기획팀",
            position: "주무관",
            email: "ms.choi@example.go.kr",
            phone: "02-3488-2011",
            isPrimary: true,
          },
        ],
      },
    },
  });

  const daehan = await db.organization.create({
    data: {
      name: "대한생명보험",
      shortName: "대한생명",
      bizRegNo: "1108100001",
      orgType: "기업",
      industry: "금융·보험",
      sizeTier: "대기업",
      employeeCount: 5_800,
      status: "거래중",
      phone: "02-789-4000",
      address: "서울특별시 영등포구 여의대로 108",
      ownerName: "김영업",
      memo: "CS 교육 정기 발주. 지점별 순회 교육 형태.",
      contacts: {
        create: [
          {
            name: "한소영",
            department: "HR본부 교육팀",
            position: "차장",
            email: "sy.han@example.com",
            mobile: "010-4567-8901",
            isPrimary: true,
          },
        ],
      },
    },
  });

  const nuri = await db.organization.create({
    data: {
      name: "누리소프트",
      orgType: "기업",
      industry: "IT·통신",
      sizeTier: "중소기업",
      employeeCount: 180,
      status: "잠재고객",
      ownerName: "정컨설",
      memo: "AI 교육 문의로 첫 접촉. 예산 규모 확인 필요.",
      contacts: {
        create: [
          {
            name: "윤재호",
            department: "경영지원팀",
            position: "과장",
            email: "jh.yoon@example.com",
            mobile: "010-5678-9012",
            isPrimary: true,
          },
        ],
      },
    },
  });

  const hangang = await db.organization.create({
    data: {
      name: "한강대학교",
      orgType: "대학",
      industry: "교육",
      employeeCount: 950,
      status: "잠재고객",
      address: "서울특별시 성북구 화랑로 815",
      ownerName: "정컨설",
      memo: "교직원 대상 법정의무교육 위탁 검토 중.",
      contacts: {
        create: [
          {
            name: "서예린",
            department: "총무처",
            position: "팀장",
            email: "yr.seo@example.ac.kr",
            isPrimary: true,
          },
        ],
      },
    },
  });

  const miraeHospital = await db.organization.create({
    data: {
      name: "미래의료재단 미래병원",
      shortName: "미래병원",
      orgType: "병원",
      industry: "의료·제약",
      sizeTier: "중견기업",
      employeeCount: 1_450,
      status: "휴면",
      ownerName: "김영업",
      memo: "2023년 CS 교육 진행 후 담당자 교체로 소통 단절. 재접촉 필요.",
      contacts: {
        create: [
          {
            name: "강태우",
            department: "인사팀",
            position: "대리",
            email: "tw.kang@example.org",
            isPrimary: true,
          },
        ],
      },
    },
  });

  console.log("교육 진행 이력 생성 중…");

  const trainings = [
    // 한빛전자 — 재의뢰가 이어지는 주요 고객
    {
      organizationId: hanbit.id,
      courseId: byCode["LDR-001"].id,
      title: "2025 하반기 신임팀장 과정 1차",
      startDate: month(-9, 12),
      endDate: month(-9, 13),
      headcount: 28,
      pricePerHead: 350_000,
      totalAmount: 9_800_000,
      location: "한빛전자 인재개발원",
      instructor: "이강사",
      status: "완료",
      satisfaction: 4.6,
    },
    {
      organizationId: hanbit.id,
      courseId: byCode["DX-001"].id,
      title: "생성형 AI 활용 실무 과정 (1~3차)",
      startDate: month(-6, 8),
      endDate: month(-6, 10),
      headcount: 96,
      pricePerHead: 280_000,
      totalAmount: 26_880_000,
      location: "한빛전자 수원 교육장",
      instructor: "박강사",
      status: "완료",
      satisfaction: 4.8,
      memo: "반응 매우 좋음. 차수 추가 요청 들어옴.",
    },
    {
      organizationId: hanbit.id,
      courseId: byCode["LDR-001"].id,
      title: "2026 상반기 신임팀장 과정 1차",
      startDate: month(-2, 18),
      endDate: month(-2, 19),
      headcount: 32,
      pricePerHead: 350_000,
      totalAmount: 11_200_000,
      location: "한빛전자 인재개발원",
      instructor: "이강사",
      status: "완료",
      satisfaction: 4.5,
    },
    {
      organizationId: hanbit.id,
      courseId: byCode["DX-001"].id,
      title: "생성형 AI 활용 심화 과정",
      startDate: day(18),
      endDate: day(19),
      headcount: 30,
      pricePerHead: 320_000,
      totalAmount: 9_600_000,
      location: "한빛전자 수원 교육장",
      instructor: "박강사",
      status: "예정",
    },

    // 서울시 인재개발원
    {
      organizationId: seoulCity.id,
      courseId: byCode["LAW-001"].id,
      title: "2025년 직장 내 괴롭힘 예방교육",
      startDate: month(-8, 20),
      headcount: 310,
      pricePerHead: 15_000,
      totalAmount: 4_650_000,
      location: "온라인",
      instructor: "최강사",
      status: "완료",
      satisfaction: 4.1,
    },
    {
      organizationId: seoulCity.id,
      courseId: byCode["DX-002"].id,
      title: "공무원 데이터 리터러시 기초 (2기)",
      startDate: month(-4, 6),
      endDate: month(-4, 8),
      headcount: 45,
      pricePerHead: 320_000,
      totalAmount: 14_400_000,
      location: "서울시 인재개발원",
      instructor: "박강사",
      status: "완료",
      satisfaction: 4.3,
    },
    {
      organizationId: seoulCity.id,
      courseId: byCode["DX-002"].id,
      title: "공무원 데이터 리터러시 기초 (3기)",
      startDate: day(-3),
      endDate: day(1),
      headcount: 42,
      pricePerHead: 320_000,
      totalAmount: 13_440_000,
      location: "서울시 인재개발원",
      instructor: "박강사",
      status: "진행중",
    },

    // 대한생명
    {
      organizationId: daehan.id,
      courseId: byCode["CS-001"].id,
      title: "지점 CS 역량 강화 순회교육 (수도권)",
      startDate: month(-10, 5),
      endDate: month(-10, 22),
      headcount: 240,
      pricePerHead: 200_000,
      totalAmount: 48_000_000,
      location: "권역별 지점",
      instructor: "최강사",
      status: "완료",
      satisfaction: 4.2,
    },
    {
      organizationId: daehan.id,
      courseId: byCode["LAW-002"].id,
      title: "2026 1분기 산업안전보건 교육",
      startDate: month(-3, 10),
      headcount: 5_600,
      pricePerHead: 3_000,
      totalAmount: 16_800_000,
      location: "온라인",
      status: "완료",
      satisfaction: 3.9,
      memo: "온라인 대량 수강. 단가 협의로 인하 적용.",
    },
    {
      organizationId: daehan.id,
      courseId: byCode["LDR-002"].id,
      title: "임원 코칭 리더십 (1기)",
      startDate: day(32),
      endDate: day(60),
      headcount: 12,
      pricePerHead: 800_000,
      totalAmount: 9_600_000,
      location: "본사 + 온라인",
      instructor: "이강사",
      status: "예정",
    },

    // 미래병원 — 휴면 고객의 과거 이력
    {
      organizationId: miraeHospital.id,
      courseId: byCode["CS-001"].id,
      title: "의료진 고객응대 교육",
      startDate: month(-11, 14),
      headcount: 80,
      pricePerHead: 200_000,
      totalAmount: 16_000_000,
      location: "미래병원 대강당",
      instructor: "최강사",
      status: "완료",
      satisfaction: 4.0,
    },
  ];

  for (const data of trainings) await db.training.create({ data });

  console.log("영업 기회 생성 중…");

  const hanbitContact = await db.contact.findFirst({
    where: { organizationId: hanbit.id, isPrimary: true },
  });
  const nuriContact = await db.contact.findFirst({
    where: { organizationId: nuri.id },
  });
  const hangangContact = await db.contact.findFirst({
    where: { organizationId: hangang.id },
  });

  const aiDeal = await db.deal.create({
    data: {
      organizationId: hanbit.id,
      contactId: hanbitContact?.id,
      title: "2026 하반기 AI 활용 교육 확대 (5개 차수)",
      stage: "견적",
      expectedAmount: 48_000_000,
      probability: 50,
      expectedCloseDate: day(21),
      ownerName: "김영업",
      memo: "상반기 만족도 4.8 기반으로 차수 확대 제안. 단가 인하 요청 있음.",
    },
  });

  await db.deal.create({
    data: {
      organizationId: nuri.id,
      contactId: nuriContact?.id,
      title: "누리소프트 전사 AI 교육 도입",
      stage: "제안",
      expectedAmount: 12_000_000,
      probability: 30,
      expectedCloseDate: day(35),
      ownerName: "정컨설",
      memo: "180명 규모. 2일 과정 2개 차수로 제안.",
    },
  });

  await db.deal.create({
    data: {
      organizationId: hangang.id,
      contactId: hangangContact?.id,
      title: "한강대 교직원 법정의무교육 위탁",
      stage: "문의",
      expectedAmount: 8_500_000,
      probability: 10,
      expectedCloseDate: day(48),
      ownerName: "정컨설",
      memo: "온라인 콘텐츠 제공 방식 문의. 경쟁 3사 검토 중.",
    },
  });

  await db.deal.create({
    data: {
      organizationId: daehan.id,
      title: "2026 임원 코칭 리더십 2기",
      stage: "계약",
      expectedAmount: 9_600_000,
      probability: 90,
      expectedCloseDate: day(-2),
      ownerName: "김영업",
      memo: "계약서 날인 대기 중.",
    },
  });

  await db.deal.create({
    data: {
      organizationId: seoulCity.id,
      title: "2026 데이터 리터러시 3기",
      stage: "완료",
      expectedAmount: 13_440_000,
      probability: 100,
      expectedCloseDate: day(-20),
      closedAt: day(-20),
      ownerName: "정컨설",
    },
  });

  await db.deal.create({
    data: {
      organizationId: miraeHospital.id,
      title: "미래병원 신입 간호사 온보딩 교육",
      stage: "실패",
      expectedAmount: 15_000_000,
      probability: 0,
      expectedCloseDate: day(-70),
      closedAt: day(-65),
      lostReason: "예산 미확보",
      ownerName: "김영업",
      memo: "내년도 예산 편성 후 재논의 요청받음.",
    },
  });

  console.log("활동 기록 생성 중…");

  await db.activity.createMany({
    data: [
      {
        organizationId: hanbit.id,
        contactId: hanbitContact?.id,
        dealId: aiDeal.id,
        type: "미팅",
        occurredAt: day(-4),
        summary: "하반기 AI 교육 차수 확대 협의",
        content:
          "상반기 3개 차수 만족도(4.8) 공유. 하반기 5개 차수로 확대 희망. 단가는 280,000원에서 조정 요청.",
        nextAction: "수정 견적서 발송",
        nextActionDate: day(-1),
        ownerName: "김영업",
      },
      {
        organizationId: hanbit.id,
        contactId: hanbitContact?.id,
        type: "이메일",
        occurredAt: day(-12),
        summary: "상반기 신임팀장 과정 결과보고서 송부",
        content: "만족도 결과와 수료자 명단 전달.",
        isDone: true,
        ownerName: "김영업",
      },
      {
        organizationId: nuri.id,
        contactId: nuriContact?.id,
        type: "전화",
        occurredAt: day(-6),
        summary: "AI 교육 도입 규모·예산 확인",
        content: "전사 180명 중 우선 60명 대상 파일럿 희망. 예산은 1,200만원 수준.",
        nextAction: "파일럿 제안서 전달",
        nextActionDate: day(2),
        ownerName: "정컨설",
      },
      {
        organizationId: hangang.id,
        contactId: hangangContact?.id,
        type: "이메일",
        occurredAt: day(-9),
        summary: "법정의무교육 온라인 콘텐츠 안내",
        content: "과정 소개서와 단가표 발송.",
        nextAction: "1주 후 회신 확인 전화",
        nextActionDate: day(5),
        ownerName: "정컨설",
      },
      {
        organizationId: daehan.id,
        type: "방문",
        occurredAt: day(-15),
        summary: "임원 코칭 리더십 킥오프 일정 협의",
        content: "대상 임원 12명 확정. 1:1 코칭 일정은 개별 조율.",
        nextAction: "계약서 날인본 회수",
        nextActionDate: day(-3),
        ownerName: "김영업",
      },
      {
        organizationId: seoulCity.id,
        type: "미팅",
        occurredAt: day(-2),
        summary: "3기 과정 중간 점검",
        content: "출석률 양호. 실습 시간 확대 요청 있어 4기 설계에 반영 예정.",
        nextAction: "4기 커리큘럼 초안 공유",
        nextActionDate: day(14),
        ownerName: "정컨설",
      },
      {
        organizationId: miraeHospital.id,
        type: "전화",
        occurredAt: day(-40),
        summary: "담당자 교체 확인",
        content: "기존 담당자 퇴사. 신규 담당자에게 인사 및 과거 진행 이력 안내.",
        nextAction: "하반기 재접촉",
        nextActionDate: day(25),
        ownerName: "김영업",
      },
    ],
  });

  const counts = {
    고객사: await db.organization.count(),
    담당자: await db.contact.count(),
    교육과정: await db.course.count(),
    교육진행: await db.training.count(),
    영업기회: await db.deal.count(),
    활동기록: await db.activity.count(),
  };

  console.log("\n시드 완료:");
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}건`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
