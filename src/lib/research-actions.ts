"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { requireUser } from "./session";
import { RESEARCH_FIELDS } from "./research";

export type ResearchState = { error?: string; ok?: string };

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function optStr(fd: FormData, key: string): string | null {
  return str(fd, key) || null;
}
function optInt(fd: FormData, key: string): number | null {
  const v = str(fd, key).replace(/[,\s]/g, "");
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}
function optFloat(fd: FormData, key: string): number | null {
  const v = str(fd, key).replace(/[,\s]/g, "");
  if (!v) return null;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

/** 폼에서 온 값을 필드 정의에 맞춰 형변환한다 */
function collectFields(fd: FormData): Record<string, string | number | null> {
  const data: Record<string, string | number | null> = {};
  for (const f of RESEARCH_FIELDS) {
    if (f.kind === "number") data[f.key] = optInt(fd, f.key);
    else if (f.kind === "decimal") data[f.key] = optFloat(fd, f.key);
    else data[f.key] = optStr(fd, f.key);
  }
  return data;
}

export async function createResearch(
  _prev: ResearchState,
  fd: FormData,
): Promise<ResearchState> {
  const user = await requireUser();

  const companyName = str(fd, "companyName");
  if (!companyName) return { error: "회사명을 입력해 주세요." };

  const organizationId = optStr(fd, "organizationId");

  // 한 고객사에 리서치는 하나만 둔다. 이미 있으면 그리로 보낸다.
  if (organizationId) {
    const existing = await db.companyResearch.findUnique({
      where: { organizationId },
      select: { id: true },
    });
    if (existing) redirect(`/research/${existing.id}`);
  }

  const created = await db.companyResearch.create({
    data: {
      companyName,
      organizationId,
      researchedBy: user.name,
      researchedAt: new Date(),
    },
  });

  revalidatePath("/research");
  redirect(`/research/${created.id}`);
}

export async function updateResearch(
  id: string,
  _prev: ResearchState,
  fd: FormData,
): Promise<ResearchState> {
  const user = await requireUser();

  const companyName = str(fd, "companyName");
  if (!companyName) return { error: "회사명을 입력해 주세요." };

  await db.companyResearch.update({
    where: { id },
    data: {
      ...collectFields(fd),
      companyName,
      summary: optStr(fd, "summary"),
      gaps: optStr(fd, "gaps"),
      organizationId: optStr(fd, "organizationId"),
      researchedBy: user.name,
      researchedAt: new Date(),
    },
  });

  revalidatePath(`/research/${id}`);
  redirect(`/research/${id}`);
}

export async function deleteResearch(id: string) {
  await requireUser();
  await db.companyResearch.delete({ where: { id } });
  revalidatePath("/research");
  redirect("/research");
}

/* -------------------------------------------------------------------------- */
/*  근거(출처)                                                                 */
/* -------------------------------------------------------------------------- */

export async function addSource(
  researchId: string,
  _prev: ResearchState,
  fd: FormData,
): Promise<ResearchState> {
  await requireUser();

  const title = str(fd, "title");
  if (!title) return { error: "제목을 입력해 주세요." };

  const publishedAt = str(fd, "publishedAt");
  const d = publishedAt ? new Date(publishedAt) : null;

  await db.researchSource.create({
    data: {
      researchId,
      kind: str(fd, "kind") || "기타",
      title,
      publisher: optStr(fd, "publisher"),
      url: optStr(fd, "url"),
      publishedAt: d && Number.isFinite(d.getTime()) ? d : null,
    },
  });

  revalidatePath(`/research/${researchId}`);
  return { ok: "근거를 추가했습니다." };
}

export async function deleteSource(researchId: string, sourceId: string) {
  await requireUser();
  await db.researchSource.delete({ where: { id: sourceId } });
  revalidatePath(`/research/${researchId}`);
}

/* -------------------------------------------------------------------------- */
/*  조사 결과 파일 올리기                                                       */
/*                                                                            */
/*  회사명만으로 자동 조사하려면 외부 API 키가 필요하다(README 참고).            */
/*  키가 없는 동안에는 조사한 내용을 json 으로 만들어 여기서 한 번에 넣는다.      */
/* -------------------------------------------------------------------------- */

type ImportShape = Record<string, unknown> & {
  companyName?: string;
  sources?: {
    kind?: string;
    title?: string;
    publisher?: string;
    url?: string;
    publishedAt?: string;
  }[];
};

export async function importResearch(
  _prev: ResearchState,
  fd: FormData,
): Promise<ResearchState> {
  const user = await requireUser();

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "json 파일을 선택해 주세요." };
  }
  if (file.size > 2 * 1024 * 1024) return { error: "파일이 너무 큽니다 (2MB 이하)." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    return { error: "json 형식이 아닙니다. 파일을 다시 확인해 주세요." };
  }

  const list: ImportShape[] = Array.isArray(parsed)
    ? (parsed as ImportShape[])
    : [parsed as ImportShape];

  const valid = list.filter((r) => typeof r?.companyName === "string" && r.companyName.trim());
  if (valid.length === 0) {
    return { error: "companyName 이 있는 항목이 없습니다." };
  }

  const known = new Set(RESEARCH_FIELDS.map((f) => f.key));
  let created = 0;
  let updated = 0;

  for (const row of valid) {
    const companyName = String(row.companyName).trim();

    // 알고 있는 필드만 골라 담는다. 모르는 키가 섞여 있어도 그냥 무시한다.
    const data: Record<string, unknown> = {};
    for (const f of RESEARCH_FIELDS) {
      if (!(f.key in row)) continue;
      const raw = row[f.key];
      if (raw === null || raw === undefined || raw === "") continue;

      if (f.kind === "number") {
        const n = Number.parseInt(String(raw).replace(/[,\s]/g, ""), 10);
        if (Number.isFinite(n)) data[f.key] = n;
      } else if (f.kind === "decimal") {
        const n = Number.parseFloat(String(raw).replace(/[,\s]/g, ""));
        if (Number.isFinite(n)) data[f.key] = n;
      } else {
        data[f.key] = String(raw);
      }
    }
    if (typeof row.summary === "string") data.summary = row.summary;
    if (typeof row.gaps === "string") data.gaps = row.gaps;

    // 이름이 같은 고객사가 이미 있으면 자동으로 이어 붙인다
    const org = await db.organization.findFirst({
      where: { OR: [{ name: companyName }, { shortName: companyName }] },
      select: { id: true },
    });

    // 그 고객사에 이미 붙은 리서치가 있으면 그것이 우선. 없으면 회사명으로 찾는다.
    const linked = org
      ? await db.companyResearch.findUnique({
          where: { organizationId: org.id },
          select: { id: true, organizationId: true },
        })
      : null;
    const existing =
      linked ??
      (await db.companyResearch.findFirst({
        where: { companyName },
        select: { id: true, organizationId: true },
      }));

    let target: string;
    if (existing) {
      // 리서치를 고객사 등록보다 먼저 올려서 연결이 비었으면, 지금이라도 이어 붙인다
      const relink =
        org && !existing.organizationId && !linked ? { organizationId: org.id } : {};
      await db.companyResearch.update({
        where: { id: existing.id },
        data: { ...data, ...relink, researchedBy: user.name, researchedAt: new Date() },
      });
      target = existing.id;
      updated += 1;
    } else {
      const rec = await db.companyResearch.create({
        data: {
          ...data,
          companyName,
          organizationId: org?.id ?? null,
          researchedBy: user.name,
          researchedAt: new Date(),
        },
      });
      target = rec.id;
      created += 1;
    }

    // 근거는 항상 덧붙인다 (지우지 않는다)
    if (Array.isArray(row.sources)) {
      for (const s of row.sources) {
        if (!s?.title) continue;
        const d = s.publishedAt ? new Date(s.publishedAt) : null;
        await db.researchSource.create({
          data: {
            researchId: target,
            kind: s.kind ?? "기타",
            title: s.title,
            publisher: s.publisher ?? null,
            url: s.url ?? null,
            publishedAt: d && Number.isFinite(d.getTime()) ? d : null,
          },
        });
      }
    }
  }

  revalidatePath("/research");
  return { ok: `${created}건 새로 만들고 ${updated}건 갱신했습니다.` };
}
