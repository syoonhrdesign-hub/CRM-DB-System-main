"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requireUser } from "./session";
import {
  fetchCompany,
  fetchEmployees,
  findCorp,
  hasDartKey,
} from "./dart";
import { fetchNpsSummary, hasNpsKey } from "./nps";
import { NPS_MISS_MARK, NPS_TARGET_WHERE } from "./research";

/**
 * DART 자동 조회.
 *
 * 원칙: 사람이 적어 둔 값은 절대 덮지 않는다. 빈칸만 채운다.
 * 채운 값에는 반드시 근거(DART 링크)를 남긴다.
 */

export type AutoFillResult = {
  ok?: string;
  error?: string;
  /** 일괄 처리에서 남은 건수 — 0 이면 끝 */
  remaining?: number;
  failures?: string[];
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type FillOutcome =
  | { status: "filled"; employeeData: boolean }
  | { status: "notFound" }
  | { status: "error"; message: string };

/** 리서치 한 건을 DART 로 채운다. 반환값으로 결과를 알린다. */
async function fillOne(researchId: string): Promise<FillOutcome> {
  const research = await db.companyResearch.findUnique({
    where: { id: researchId },
    include: { sources: { select: { publisher: true, kind: true } } },
  });
  if (!research) return { status: "error", message: "리서치가 없습니다" };

  const found = await findCorp(research.companyName);
  if (!found) return { status: "notFound" };
  const { corp, alternatives } = found;

  const company = await fetchCompany(corp.corpCode);
  const employees = await fetchEmployees(corp.corpCode);

  if (!company && !employees) return { status: "notFound" };

  // 빈칸만 채운다 — 사람이 조사한 값이 항상 우선이다
  const data: Record<string, unknown> = {};
  const fill = (key: keyof typeof research, value: unknown) => {
    if (value == null || value === "") return;
    if (research[key] == null || research[key] === "") data[key] = value;
  };

  fill("corpCode", corp.corpCode);
  if (company) {
    fill("legalName", company.legalName);
    fill("ceoName", company.ceoName);
    fill("listingStatus", company.listingStatus);
    fill("bizRegNo", company.bizRegNo);
    fill("address", company.address);
    fill("website", company.website);
    fill("phone", company.phone);
    fill("foundedYear", company.foundedYear);
  }
  if (employees) {
    fill("employeeTotal", employees.total);
    fill("employeeRegular", employees.regular);
    fill("employeeIrregular", employees.contract);
    fill("avgTenureYears", employees.avgTenureYears);
  }

  // 확인 안 된 항목 기록 — 지어내지 않았음을 화면에서 알 수 있게
  const gapLines = new Set(
    (research.gaps ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
  );
  if (!employees) {
    gapLines.add("직원현황 — DART 정기보고서 없음 (비상장 추정, 국민연금으로 확인 필요)");
  }
  if (alternatives > 0) {
    gapLines.add(`동명 법인 ${alternatives}곳 존재 — 상장사 우선으로 매칭했으니 상호 확인 필요`);
  }
  data.gaps = [...gapLines].join("\n") || null;
  data.researchedAt = new Date();

  await db.companyResearch.update({ where: { id: researchId }, data });

  // 근거 — 이미 DART 근거가 있으면 또 달지 않는다
  const hasDartSource = research.sources.some((s) => s.publisher === "DART");
  if (!hasDartSource) {
    await db.researchSource.create({
      data: {
        researchId,
        kind: "공시",
        title: `DART 기업개황${employees ? ` · ${employees.year} 사업보고서 직원현황` : ""}`,
        publisher: "DART",
        url: `https://dart.fss.or.kr/dsae001/main.do?autoSearch=true&textCrpNm=${encodeURIComponent(corp.name)}`,
      },
    });
  }

  return { status: "filled", employeeData: Boolean(employees) };
}

/** 리서치 상세에서 — 이 회사 하나만 채우기 */
export async function autoFillResearch(
  id: string,
  _prev: AutoFillResult,
  _fd: FormData,
): Promise<AutoFillResult> {
  await requireUser();

  if (!hasDartKey()) {
    return {
      error:
        "DART 키가 없습니다. opendart.fss.or.kr 에서 발급해 .env 에 DART_API_KEY 로 넣고 서버를 다시 시작해 주세요.",
    };
  }

  try {
    const outcome = await fillOne(id);
    revalidatePath(`/research/${id}`);
    if (outcome.status === "filled") {
      return {
        ok: outcome.employeeData
          ? "공시에서 기본 정보와 직원현황(정규/기간제·근속)을 채웠습니다."
          : "공시에서 기본 정보를 채웠습니다. 직원현황은 정기보고서가 없어 못 가져왔습니다.",
      };
    }
    if (outcome.status === "notFound") {
      return {
        error:
          "DART 에서 이 회사를 찾지 못했습니다. 비상장 소규모거나 상호가 다를 수 있습니다 — 정식 상호로 회사명을 고쳐 다시 시도해 보세요.",
      };
    }
    return { error: outcome.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "DART 조회에 실패했습니다." };
  }
}

/**
 * 일괄 처리 — 아직 리서치가 없는 고객사에 리서치를 만들고 DART 로 채운다.
 * 한 번에 BATCH 곳씩 처리하고 남은 수를 돌려준다. 화면에서 "이어서" 를 누르면 계속.
 */
const BATCH = 100;

export async function bulkAutoResearch(
  _prev: AutoFillResult,
  _fd: FormData,
): Promise<AutoFillResult> {
  const user = await requireUser();

  if (!hasDartKey()) {
    return {
      error:
        "DART 키가 없습니다. opendart.fss.or.kr 에서 발급해 .env 에 DART_API_KEY 로 넣고 서버를 다시 시작해 주세요.",
    };
  }

  // 리서치가 아직 없는 고객사
  const orgs = await db.organization.findMany({
    where: { research: null },
    orderBy: [{ status: "asc" }, { name: "asc" }], // 거래중 먼저
    take: BATCH,
    select: { id: true, name: true, shortName: true },
  });

  if (orgs.length === 0) {
    return { ok: "모든 고객사에 리서치가 있습니다.", remaining: 0 };
  }

  let filled = 0;
  let noData = 0;
  const failures: string[] = [];

  for (const org of orgs) {
    try {
      // 회사명이 같은 미연결 리서치(먼저 올린 손조사)가 있으면
      // 새로 만들지 않고 이 고객사에 이어 붙인다 — 중복 카드를 막는다
      const names = [org.name, org.shortName].filter((s): s is string => Boolean(s));
      const orphan = await db.companyResearch.findFirst({
        where: { companyName: { in: names }, organizationId: null },
        select: { id: true },
      });
      const research = orphan
        ? await db.companyResearch.update({
            where: { id: orphan.id },
            data: { organizationId: org.id },
          })
        : await db.companyResearch.create({
            data: {
              companyName: org.name,
              organizationId: org.id,
              researchedBy: `${user.name} (DART 자동)`,
            },
          });
      const outcome = await fillOne(research.id);
      if (outcome.status === "filled") filled += 1;
      else {
        noData += 1;
        // 못 찾은 곳도 리서치는 남긴다 — "DART 미등록" 을 기록해 두면
        // 나중에 국민연금 조회 대상을 바로 골라낼 수 있다.
        // 손조사에서 적어 둔 gaps 는 지우지 않고 한 줄 덧붙인다.
        const cur = await db.companyResearch.findUnique({
          where: { id: research.id },
          select: { gaps: true },
        });
        const lines = new Set(
          (cur?.gaps ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
        );
        lines.add("DART 미등록 — 비상장 소규모 또는 공공기관. 국민연금·수기 조사 필요");
        await db.companyResearch.update({
          where: { id: research.id },
          data: { gaps: [...lines].join("\n") },
        });
      }
    } catch (e) {
      failures.push(`${org.name}: ${e instanceof Error ? e.message : "실패"}`);
      if (failures.length >= 5) break; // 연쇄 실패면 멈춘다 — 키 한도 초과 등
    }
    await wait(120); // DART 를 몰아치지 않는다
  }

  const remaining = await db.organization.count({ where: { research: null } });
  revalidatePath("/research");

  const parts = [`${filled}곳 공시로 채움`, `${noData}곳 DART 미등록`];
  if (failures.length) parts.push(`${failures.length}곳 실패`);
  return {
    ok: `${parts.join(" · ")}. 남은 고객사 ${remaining}곳.`,
    remaining,
    failures: failures.length ? failures : undefined,
  };
}

/* -------------------------------------------------------------------------- */
/*  국민연금 — DART 가 못 채운 회사의 규모(가입자 수 ≒ 상시 직원 수)             */
/* -------------------------------------------------------------------------- */

const NPS_SOURCE_URL = "https://www.data.go.kr/data/15083277/openapi.do";

const NO_NPS_KEY_ERROR =
  "국민연금 키가 없습니다. data.go.kr 에서 '국민연금 가입 사업장 내역' 활용신청 후 .env 에 NPS_API_KEY 로 넣고 서버를 다시 시작해 주세요.";

async function appendGapLine(researchId: string, line: string) {
  const cur = await db.companyResearch.findUnique({
    where: { id: researchId },
    select: { gaps: true },
  });
  const lines = new Set(
    (cur?.gaps ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
  );
  lines.add(line);
  await db.companyResearch.update({
    where: { id: researchId },
    data: { gaps: [...lines].join("\n") },
  });
}

/** 리서치 한 건을 국민연금으로 채운다. 빈칸만 채운다 — 원칙은 DART 와 같다. */
async function npsFillOne(researchId: string): Promise<"filled" | "notFound"> {
  const research = await db.companyResearch.findUnique({
    where: { id: researchId },
    include: { sources: { select: { publisher: true } } },
  });
  if (!research) throw new Error("리서치가 없습니다");

  const summary = await fetchNpsSummary({
    name: research.companyName,
    bizRegNo: research.bizRegNo,
  });

  if (!summary) {
    await appendGapLine(
      researchId,
      `${NPS_MISS_MARK} (상호가 다르거나 검색에 안 잡힘. 정식 상호로 다시 시도)`,
    );
    return "notFound";
  }

  const data: Record<string, unknown> = { researchedAt: new Date() };
  if (research.pensionSubscribers == null) data.pensionSubscribers = summary.subscribers;
  if (!research.pensionAsOf && summary.asOf) data.pensionAsOf = summary.asOf;
  await db.companyResearch.update({ where: { id: researchId }, data });

  const hasNpsSource = research.sources.some((s) => s.publisher === "국민연금공단");
  if (!hasNpsSource) {
    await db.researchSource.create({
      data: {
        researchId,
        kind: "공공데이터",
        title: `국민연금 가입 사업장 내역${summary.asOf ? ` (기준 ${summary.asOf})` : ""}${
          summary.siteCount > 1 ? ` · 사업장 ${summary.siteCount}곳 합산` : ""
        }`,
        publisher: "국민연금공단",
        url: NPS_SOURCE_URL,
      },
    });
  }

  return "filled";
}

/** 리서치 상세에서 — 이 회사 하나만 국민연금으로 채우기 */
export async function npsFillResearch(
  id: string,
  _prev: AutoFillResult,
  _fd: FormData,
): Promise<AutoFillResult> {
  await requireUser();
  if (!hasNpsKey()) return { error: NO_NPS_KEY_ERROR };

  try {
    const outcome = await npsFillOne(id);
    revalidatePath(`/research/${id}`);
    if (outcome === "filled") {
      return { ok: "국민연금 가입자 수(≒ 상시 직원 수)를 채웠습니다." };
    }
    return {
      error:
        "국민연금에서 이 회사를 찾지 못했습니다. 정식 상호나 사업자등록번호를 채운 뒤 다시 시도해 보세요.",
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "국민연금 조회에 실패했습니다." };
  }
}

/**
 * 국민연금 일괄 조회 — 직원 규모가 아직 없는 리서치가 대상.
 * (DART 직원현황도, 국민연금 가입자 수도 없는 곳)
 */
const NPS_BATCH = 50;

export async function bulkNpsResearch(
  _prev: AutoFillResult,
  _fd: FormData,
): Promise<AutoFillResult> {
  await requireUser();
  if (!hasNpsKey()) return { error: NO_NPS_KEY_ERROR };

  // 이전 배치에서 "미확인" 으로 남긴 곳은 다시 돌지 않는다 — 무한 반복 방지
  const targets = await db.companyResearch.findMany({
    where: NPS_TARGET_WHERE,
    orderBy: { companyName: "asc" },
    take: NPS_BATCH,
    select: { id: true, companyName: true },
  });

  if (targets.length === 0) {
    return { ok: "직원 규모가 비어 있는 리서치가 없습니다.", remaining: 0 };
  }

  let filled = 0;
  let notFound = 0;
  const failures: string[] = [];

  for (const t of targets) {
    try {
      const outcome = await npsFillOne(t.id);
      if (outcome === "filled") filled += 1;
      else notFound += 1;
    } catch (e) {
      failures.push(`${t.companyName}: ${e instanceof Error ? e.message : "실패"}`);
      if (failures.length >= 5) break; // 키 한도 초과 등 연쇄 실패면 멈춘다
    }
    await wait(150); // 공공데이터포털을 몰아치지 않는다
  }

  // "미확인" 으로 기록된 곳은 남은 수에서 빠지도록 gaps 로 거른다
  const remaining = await db.companyResearch.count({ where: NPS_TARGET_WHERE });
  revalidatePath("/research");

  const parts = [`${filled}곳 가입자 수 채움`, `${notFound}곳 검색 안 됨`];
  if (failures.length) parts.push(`${failures.length}곳 실패`);
  return {
    ok: `${parts.join(" · ")}. 남은 대상 ${remaining}곳.`,
    remaining,
    failures: failures.length ? failures : undefined,
  };
}
