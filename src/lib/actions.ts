"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { DEAL_STAGE_PROBABILITY } from "./constants";
import {
  bool,
  int,
  optDate,
  optInt,
  optNum,
  optStr,
  reqDate,
  str,
} from "./form";

/* -------------------------------------------------------------------------- */
/*  고객사                                                                      */
/* -------------------------------------------------------------------------- */

/** 사업자등록번호는 숫자만 남겨 저장한다 — 표기 방식이 달라도 중복을 잡아내기 위해서. */
function normalizeBizRegNo(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits === "" ? null : digits;
}

function organizationData(fd: FormData) {
  return {
    name: str(fd, "name"),
    shortName: optStr(fd, "shortName"),
    bizRegNo: normalizeBizRegNo(optStr(fd, "bizRegNo")),
    orgType: str(fd, "orgType") || "기업",
    industry: optStr(fd, "industry"),
    sizeTier: optStr(fd, "sizeTier"),
    employeeCount: optInt(fd, "employeeCount"),
    status: str(fd, "status") || "잠재고객",
    phone: optStr(fd, "phone"),
    website: optStr(fd, "website"),
    address: optStr(fd, "address"),
    ownerName: optStr(fd, "ownerName"),
    memo: optStr(fd, "memo"),

    acquisitionChannel: optStr(fd, "acquisitionChannel"),
    firstContactAt: optDate(fd, "firstContactAt"),
    referredBy: optStr(fd, "referredBy"),

    contactCycleWeeks: optInt(fd, "contactCycleWeeks"),
  };
}

export async function createOrganization(fd: FormData) {
  const data = organizationData(fd);
  if (!data.name) throw new Error("기관명은 필수입니다.");

  const org = await db.organization.create({ data });
  revalidatePath("/organizations");
  revalidatePath("/");
  redirect(`/organizations/${org.id}`);
}

export async function updateOrganization(id: string, fd: FormData) {
  const data = organizationData(fd);
  if (!data.name) throw new Error("기관명은 필수입니다.");

  await db.organization.update({ where: { id }, data });
  revalidatePath("/organizations");
  revalidatePath(`/organizations/${id}`);
  redirect(`/organizations/${id}`);
}

export async function deleteOrganization(id: string) {
  await db.organization.delete({ where: { id } });
  revalidatePath("/organizations");
  revalidatePath("/");
  redirect("/organizations");
}

/* -------------------------------------------------------------------------- */
/*  등급 평가                                                                   */
/* -------------------------------------------------------------------------- */

/** 1~5 범위를 벗어나거나 비어 있으면 "평가 안 함"(null)으로 둔다. */
function score(fd: FormData, key: string): number | null {
  const v = optInt(fd, key);
  if (v == null || v < 1 || v > 5) return null;
  return v;
}

export async function updateGrade(id: string, fd: FormData) {
  await db.organization.update({
    where: { id },
    data: {
      scorePurchase: score(fd, "scorePurchase"),
      scoreRecurring: score(fd, "scoreRecurring"),
      scoreRetrain: score(fd, "scoreRetrain"),
      scoreSolution: score(fd, "scoreSolution"),
      scoreTrust: score(fd, "scoreTrust"),
      gradeOverride: optStr(fd, "gradeOverride"),
      gradeMemo: optStr(fd, "gradeMemo"),
      contactCycleWeeks: optInt(fd, "contactCycleWeeks"),
      gradedAt: new Date(),
    },
  });

  revalidatePath(`/organizations/${id}`);
  revalidatePath("/organizations");
  revalidatePath("/agenda");
  redirect(`/organizations/${id}`);
}

/* -------------------------------------------------------------------------- */
/*  기업 프로파일                                                               */
/* -------------------------------------------------------------------------- */

/** 체크박스로 고른 월들을 "3,9" 형태의 문자열로 모은다. */
function monthList(fd: FormData, key: string): string | null {
  const values = fd
    .getAll(key)
    .map((v) => Number.parseInt(String(v), 10))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 12)
    .sort((a, b) => a - b);
  return values.length > 0 ? values.join(",") : null;
}

export async function updateProfile(organizationId: string, fd: FormData) {
  const data = {
    workforceType: optStr(fd, "workforceType"),
    fieldRatio: optInt(fd, "fieldRatio"),
    hrStructure: optStr(fd, "hrStructure"),
    hrHeadcount: optInt(fd, "hrHeadcount"),
    decisionProcess: optStr(fd, "decisionProcess"),

    fiscalStartMonth: optInt(fd, "fiscalStartMonth"),
    budgetMonth: optInt(fd, "budgetMonth"),
    budgetCycle: optStr(fd, "budgetCycle"),
    budgetScale: optInt(fd, "budgetScale"),
    budgetNote: optStr(fd, "budgetNote"),

    hiringMonths: monthList(fd, "hiringMonths"),
    hiringNote: optStr(fd, "hiringNote"),
    trainingMonths: monthList(fd, "trainingMonths"),
    trainingNote: optStr(fd, "trainingNote"),

    regularPrograms: optStr(fd, "regularPrograms"),
    cultureActivities: optStr(fd, "cultureActivities"),
    competitors: optStr(fd, "competitors"),

    expansionLevel: optStr(fd, "expansionLevel"),
    expansionDepartments: optStr(fd, "expansionDepartments"),

    notes: optStr(fd, "notes"),
  };

  await db.accountProfile.upsert({
    where: { organizationId },
    create: { organizationId, ...data },
    update: data,
  });

  revalidatePath(`/organizations/${organizationId}`);
  revalidatePath("/agenda");
  redirect(`/organizations/${organizationId}`);
}

/* -------------------------------------------------------------------------- */
/*  담당자                                                                      */
/* -------------------------------------------------------------------------- */

function contactData(fd: FormData) {
  return {
    organizationId: str(fd, "organizationId"),
    name: str(fd, "name"),
    department: optStr(fd, "department"),
    position: optStr(fd, "position"),
    email: optStr(fd, "email"),
    phone: optStr(fd, "phone"),
    mobile: optStr(fd, "mobile"),
    isPrimary: bool(fd, "isPrimary"),
    memo: optStr(fd, "memo"),

    firstMetAt: optDate(fd, "firstMetAt"),
    firstMetChannel: optStr(fd, "firstMetChannel"),
    firstMetPlace: optStr(fd, "firstMetPlace"),
    referredBy: optStr(fd, "referredBy"),

    status: str(fd, "status") || "재직",
    assignedFrom: optDate(fd, "assignedFrom"),
    assignedUntil: optDate(fd, "assignedUntil"),
    changeReason: optStr(fd, "changeReason"),
    handoverNote: optStr(fd, "handoverNote"),
    successorId: optStr(fd, "successorId"),
  };
}

/** 대표 담당자는 고객사당 한 명만 유지한다. */
async function demoteOtherPrimaries(organizationId: string, keepId?: string) {
  await db.contact.updateMany({
    where: {
      organizationId,
      isPrimary: true,
      ...(keepId ? { NOT: { id: keepId } } : {}),
    },
    data: { isPrimary: false },
  });
}

/**
 * 후임 지정은 1:1 관계라 이미 다른 사람의 후임으로 잡혀 있으면 저장이 실패한다.
 * 저장을 막는 대신 기존 연결을 끊어 주는 편이 실제 인수인계 상황에 맞다.
 */
async function releaseSuccessor(successorId: string | null, selfId?: string) {
  if (!successorId) return;
  await db.contact.updateMany({
    where: { successorId, ...(selfId ? { NOT: { id: selfId } } : {}) },
    data: { successorId: null },
  });
}

/** 재직 중이 아닌 사람은 대표 담당자로 두지 않는다. */
function normalizeContactData(data: ReturnType<typeof contactData>) {
  if (data.status !== "재직") return { ...data, isPrimary: false };
  return data;
}

export async function createContact(fd: FormData) {
  const data = normalizeContactData(contactData(fd));
  if (!data.name) throw new Error("담당자 이름은 필수입니다.");
  if (!data.organizationId) throw new Error("고객사를 선택해 주세요.");

  await releaseSuccessor(data.successorId);

  const contact = await db.contact.create({ data });
  if (data.isPrimary) await demoteOtherPrimaries(data.organizationId, contact.id);

  revalidatePath(`/organizations/${data.organizationId}`);
  revalidatePath("/contacts");
  redirect(`/organizations/${data.organizationId}`);
}

export async function updateContact(id: string, fd: FormData) {
  const data = normalizeContactData(contactData(fd));
  if (!data.name) throw new Error("담당자 이름은 필수입니다.");
  if (data.successorId === id) {
    throw new Error("자기 자신을 후임으로 지정할 수 없습니다.");
  }

  await releaseSuccessor(data.successorId, id);

  await db.contact.update({ where: { id }, data });
  if (data.isPrimary) await demoteOtherPrimaries(data.organizationId, id);

  revalidatePath(`/organizations/${data.organizationId}`);
  revalidatePath("/contacts");
  redirect(`/organizations/${data.organizationId}`);
}

/* -------------------------------------------------------------------------- */
/*  명함 이력                                                                   */
/* -------------------------------------------------------------------------- */

function businessCardData(fd: FormData) {
  return {
    contactId: str(fd, "contactId"),
    receivedAt: reqDate(fd, "receivedAt"),
    companyName: optStr(fd, "companyName"),
    department: optStr(fd, "department"),
    position: optStr(fd, "position"),
    email: optStr(fd, "email"),
    phone: optStr(fd, "phone"),
    mobile: optStr(fd, "mobile"),
    address: optStr(fd, "address"),
    receivedChannel: optStr(fd, "receivedChannel"),
    receivedPlace: optStr(fd, "receivedPlace"),
    imageUrl: optStr(fd, "imageUrl"),
    memo: optStr(fd, "memo"),
  };
}

/**
 * 명함을 등록하면서, 명함에 적힌 소속·직함이 현재 담당자 정보보다 최신이면
 * 담당자 레코드도 함께 갱신한다. 같은 내용을 두 번 입력하지 않게 하기 위해서다.
 */
export async function createBusinessCard(fd: FormData) {
  const data = businessCardData(fd);
  if (!data.contactId) throw new Error("담당자를 선택해 주세요.");

  const contact = await db.contact.findUnique({
    where: { id: data.contactId },
    include: { businessCards: { orderBy: { receivedAt: "desc" }, take: 1 } },
  });
  if (!contact) throw new Error("담당자를 찾을 수 없습니다.");

  await db.businessCard.create({ data });

  const latest = contact.businessCards[0];
  const isNewest = !latest || data.receivedAt >= latest.receivedAt;

  if (isNewest) {
    await db.contact.update({
      where: { id: data.contactId },
      data: {
        department: data.department ?? contact.department,
        position: data.position ?? contact.position,
        email: data.email ?? contact.email,
        phone: data.phone ?? contact.phone,
        mobile: data.mobile ?? contact.mobile,
      },
    });
  }

  revalidatePath(`/contacts/${data.contactId}`);
  revalidatePath(`/organizations/${contact.organizationId}`);
  redirect(`/contacts/${data.contactId}`);
}

export async function updateBusinessCard(id: string, fd: FormData) {
  const data = businessCardData(fd);
  await db.businessCard.update({ where: { id }, data });
  revalidatePath(`/contacts/${data.contactId}`);
  redirect(`/contacts/${data.contactId}`);
}

export async function deleteBusinessCard(id: string) {
  const card = await db.businessCard.delete({ where: { id } });
  revalidatePath(`/contacts/${card.contactId}`);
}

export async function deleteContact(id: string) {
  const contact = await db.contact.delete({ where: { id } });
  revalidatePath(`/organizations/${contact.organizationId}`);
  revalidatePath("/contacts");
}

/* -------------------------------------------------------------------------- */
/*  교육 과정                                                                   */
/* -------------------------------------------------------------------------- */

function courseData(fd: FormData) {
  return {
    code: str(fd, "code"),
    name: str(fd, "name"),
    category: str(fd, "category") || "직무",
    format: str(fd, "format") || "집합",
    durationHours: optNum(fd, "durationHours") ?? 8,
    defaultPrice: int(fd, "defaultPrice"),
    minHeadcount: optInt(fd, "minHeadcount"),
    description: optStr(fd, "description"),
    isActive: bool(fd, "isActive"),
  };
}

export async function createCourse(fd: FormData) {
  const data = courseData(fd);
  if (!data.code || !data.name) throw new Error("과정코드와 과정명은 필수입니다.");

  await db.course.create({ data });
  revalidatePath("/courses");
  redirect("/courses");
}

export async function updateCourse(id: string, fd: FormData) {
  const data = courseData(fd);
  if (!data.code || !data.name) throw new Error("과정코드와 과정명은 필수입니다.");

  await db.course.update({ where: { id }, data });
  revalidatePath("/courses");
  redirect("/courses");
}

export async function deleteCourse(id: string) {
  await db.course.delete({ where: { id } });
  revalidatePath("/courses");
  redirect("/courses");
}

/* -------------------------------------------------------------------------- */
/*  교육 진행                                                                   */
/* -------------------------------------------------------------------------- */

function trainingData(fd: FormData) {
  const headcount = int(fd, "headcount");
  const pricePerHead = int(fd, "pricePerHead");

  // 총액을 비워두면 인원 × 단가로 채운다.
  const totalRaw = str(fd, "totalAmount");
  const totalAmount =
    totalRaw === "" ? headcount * pricePerHead : int(fd, "totalAmount");

  return {
    organizationId: str(fd, "organizationId"),
    courseId: optStr(fd, "courseId"),
    title: str(fd, "title"),
    startDate: reqDate(fd, "startDate"),
    endDate: optDate(fd, "endDate"),
    headcount,
    pricePerHead,
    totalAmount,
    location: optStr(fd, "location"),
    instructor: optStr(fd, "instructor"),
    status: str(fd, "status") || "예정",
    satisfaction: optNum(fd, "satisfaction"),
    memo: optStr(fd, "memo"),
  };
}

export async function createTraining(fd: FormData) {
  const data = trainingData(fd);
  if (!data.organizationId) throw new Error("고객사를 선택해 주세요.");
  if (!data.title) throw new Error("교육명은 필수입니다.");

  await db.training.create({ data });
  revalidatePath("/trainings");
  revalidatePath(`/organizations/${data.organizationId}`);
  revalidatePath("/");
  redirect(`/organizations/${data.organizationId}`);
}

export async function updateTraining(id: string, fd: FormData) {
  const data = trainingData(fd);
  if (!data.title) throw new Error("교육명은 필수입니다.");

  await db.training.update({ where: { id }, data });
  revalidatePath("/trainings");
  revalidatePath(`/organizations/${data.organizationId}`);
  revalidatePath("/");
  redirect(`/organizations/${data.organizationId}`);
}

export async function deleteTraining(id: string) {
  const training = await db.training.delete({ where: { id } });
  revalidatePath("/trainings");
  revalidatePath(`/organizations/${training.organizationId}`);
  revalidatePath("/");
}

/* -------------------------------------------------------------------------- */
/*  영업 기회                                                                   */
/* -------------------------------------------------------------------------- */

function dealData(fd: FormData) {
  const stage = str(fd, "stage") || "문의";
  const probRaw = str(fd, "probability");

  return {
    organizationId: str(fd, "organizationId"),
    contactId: optStr(fd, "contactId"),
    title: str(fd, "title"),
    stage,
    expectedAmount: int(fd, "expectedAmount"),
    // 확률을 비워두면 단계 기본값을 쓴다.
    probability:
      probRaw === "" ? (DEAL_STAGE_PROBABILITY[stage] ?? 20) : int(fd, "probability"),
    expectedCloseDate: optDate(fd, "expectedCloseDate"),
    closedAt: stage === "완료" || stage === "실패" ? new Date() : null,
    lostReason: stage === "실패" ? optStr(fd, "lostReason") : null,
    ownerName: optStr(fd, "ownerName"),
    memo: optStr(fd, "memo"),
  };
}

export async function createDeal(fd: FormData) {
  const data = dealData(fd);
  if (!data.organizationId) throw new Error("고객사를 선택해 주세요.");
  if (!data.title) throw new Error("영업건 제목은 필수입니다.");

  await db.deal.create({ data });
  revalidatePath("/deals");
  revalidatePath(`/organizations/${data.organizationId}`);
  revalidatePath("/");
  redirect("/deals");
}

export async function updateDeal(id: string, fd: FormData) {
  const data = dealData(fd);
  if (!data.title) throw new Error("영업건 제목은 필수입니다.");

  // 이미 종료된 건을 다시 열면 종료일을 지운다.
  const existing = await db.deal.findUnique({ where: { id } });
  const closedAt =
    data.closedAt && existing?.closedAt ? existing.closedAt : data.closedAt;

  await db.deal.update({ where: { id }, data: { ...data, closedAt } });
  revalidatePath("/deals");
  revalidatePath(`/organizations/${data.organizationId}`);
  revalidatePath("/");
  redirect("/deals");
}

/** 파이프라인 보드에서 단계만 한 칸 옮길 때 쓴다. */
export async function moveDealStage(id: string, stage: string) {
  const isClosed = stage === "완료" || stage === "실패";
  const existing = await db.deal.findUnique({ where: { id } });

  await db.deal.update({
    where: { id },
    data: {
      stage,
      probability: DEAL_STAGE_PROBABILITY[stage] ?? existing?.probability ?? 20,
      closedAt: isClosed ? (existing?.closedAt ?? new Date()) : null,
      lostReason: stage === "실패" ? existing?.lostReason : null,
    },
  });

  revalidatePath("/deals");
  revalidatePath("/");
}

export async function deleteDeal(id: string) {
  const deal = await db.deal.delete({ where: { id } });
  revalidatePath("/deals");
  revalidatePath(`/organizations/${deal.organizationId}`);
  revalidatePath("/");
}

/* -------------------------------------------------------------------------- */
/*  활동 기록                                                                   */
/* -------------------------------------------------------------------------- */

function activityData(fd: FormData) {
  return {
    organizationId: str(fd, "organizationId"),
    contactId: optStr(fd, "contactId"),
    dealId: optStr(fd, "dealId"),
    type: str(fd, "type") || "전화",
    occurredAt: reqDate(fd, "occurredAt"),
    summary: str(fd, "summary"),
    content: optStr(fd, "content"),
    nextAction: optStr(fd, "nextAction"),
    nextActionDate: optDate(fd, "nextActionDate"),
    isDone: bool(fd, "isDone"),
    ownerName: optStr(fd, "ownerName"),
  };
}

export async function createActivity(fd: FormData) {
  const data = activityData(fd);
  if (!data.organizationId) throw new Error("고객사를 선택해 주세요.");
  if (!data.summary) throw new Error("활동 요약은 필수입니다.");

  await db.activity.create({ data });
  revalidatePath("/activities");
  revalidatePath(`/organizations/${data.organizationId}`);
  revalidatePath("/");
  redirect(`/organizations/${data.organizationId}`);
}

export async function updateActivity(id: string, fd: FormData) {
  const data = activityData(fd);
  if (!data.summary) throw new Error("활동 요약은 필수입니다.");

  await db.activity.update({ where: { id }, data });
  revalidatePath("/activities");
  revalidatePath(`/organizations/${data.organizationId}`);
  revalidatePath("/");
  redirect(`/organizations/${data.organizationId}`);
}

/** 대시보드의 후속조치 목록에서 체크만 하는 용도. */
export async function toggleActivityDone(id: string, isDone: boolean) {
  await db.activity.update({ where: { id }, data: { isDone } });
  revalidatePath("/activities");
  revalidatePath("/");
}

export async function deleteActivity(id: string) {
  const activity = await db.activity.delete({ where: { id } });
  revalidatePath("/activities");
  revalidatePath(`/organizations/${activity.organizationId}`);
  revalidatePath("/");
}
