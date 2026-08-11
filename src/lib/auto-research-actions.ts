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
    select: { id: true, name: true },
  });

  if (orgs.length === 0) {
    return { ok: "모든 고객사에 리서치가 있습니다.", remaining: 0 };
  }

  let filled = 0;
  let noData = 0;
  const failures: string[] = [];

  for (const org of orgs) {
    try {
      const research = await db.companyResearch.create({
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
        // 나중에 국민연금 조회 대상을 바로 골라낼 수 있다
        await db.companyResearch.update({
          where: { id: research.id },
          data: { gaps: "DART 미등록 — 비상장 소규모 또는 공공기관. 국민연금·수기 조사 필요" },
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
