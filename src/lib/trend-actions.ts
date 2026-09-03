"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "./db";
import { requireUser } from "./session";
import { collectAll, collectSource, type CollectResult } from "./trend-collect";
import { KEYWORD_KINDS, STARTER_SOURCES } from "./trends";

export type TrendState = { error?: string; ok?: string };

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function optStr(fd: FormData, key: string): string | null {
  return str(fd, key) || null;
}

export async function createSource(
  _prev: TrendState,
  fd: FormData,
): Promise<TrendState> {
  await requireUser();

  const name = str(fd, "name");
  if (!name) return { error: "이름을 입력해 주세요." };

  const kind = str(fd, "kind") || "rss";
  const url = optStr(fd, "url");
  const keyword = optStr(fd, "keyword");

  if (kind === "rss" && !url) return { error: "RSS 주소를 입력해 주세요." };
  if (KEYWORD_KINDS.includes(kind) && !keyword) return { error: "검색어를 입력해 주세요." };

  await db.trendSource.create({
    data: {
      name,
      kind,
      url,
      keyword,
      category: str(fd, "category") || "HRD",
      isActive: fd.get("isActive") !== null,
    },
  });

  revalidatePath("/trends/sources");
  return { ok: `${name} 을(를) 추가했습니다.` };
}

export async function toggleSource(id: string) {
  await requireUser();
  const s = await db.trendSource.findUnique({ where: { id }, select: { isActive: true } });
  if (!s) return;
  await db.trendSource.update({ where: { id }, data: { isActive: !s.isActive } });
  revalidatePath("/trends/sources");
}

export async function deleteSource(id: string) {
  await requireUser();
  await db.trendSource.delete({ where: { id } });
  revalidatePath("/trends/sources");
}

/** 수집 결과를 한 줄 문장으로 — 버튼 옆에 바로 보여 준다 */
function describe(results: CollectResult[]): TrendState {
  const added = results.reduce((n, r) => n + r.added, 0);
  const failed = results.filter((r) => r.error);
  const noted = results.filter((r) => r.note);

  const parts = [`${results.length}곳 확인 · 새 글 ${added}건`];
  if (failed.length > 0) {
    parts.push(
      `실패 ${failed.length}곳 (${failed.map((f) => `${f.name}: ${f.error}`).join(" / ")})`,
    );
  }
  if (noted.length > 0) parts.push(`${noted.length}곳은 ${noted[0].note}`);

  const text = parts.join(" · ");
  // 전부 실패했으면 빨간 글씨로, 하나라도 됐으면 초록으로
  return failed.length === results.length && results.length > 0
    ? { error: text }
    : { ok: text };
}

/** 이 소스 하나만 지금 가져와 본다 — 주소가 맞는지 확인하는 용도 */
export async function testSource(
  id: string,
  _prev: TrendState,
  _fd: FormData,
): Promise<TrendState> {
  await requireUser();
  const s = await db.trendSource.findUnique({
    where: { id },
    select: { id: true, name: true, kind: true, url: true, keyword: true, category: true },
  });
  if (!s) return { error: "소스를 찾을 수 없습니다." };
  if (s.kind === "manual") return { ok: "직접 등록 소스는 자동 수집하지 않습니다." };

  const r = await collectSource(s);
  revalidatePath("/trends/sources");
  revalidatePath("/trends");
  if (r.error) return { error: `실패 — ${r.error}` };
  return { ok: `연결됨 · 새 글 ${r.added}건${r.note ? ` (${r.note})` : ""}` };
}

export async function collectNow(_prev: TrendState, _fd: FormData): Promise<TrendState> {
  await requireUser();
  const results = await collectAll();
  revalidatePath("/trends");
  revalidatePath("/trends/sources");

  if (results.length === 0) {
    return {
      error:
        "자동으로 모을 소스가 없습니다. 소스 관리에서 추천 소스를 넣거나 RSS·검색어 소스를 켜 주세요.",
    };
  }
  return describe(results);
}

/** 주간 브리핑 생성 — Claude API 키가 있어야 한다 */
export async function createBrief(
  _prev: TrendState,
  _fd: FormData,
): Promise<TrendState> {
  const user = await requireUser();
  const { generateBrief } = await import("./trend-brief");

  const result = await generateBrief(7, user.name);
  if (!result.ok) return { error: result.error };

  revalidatePath("/trends/brief");
  redirect(`/trends/brief#${result.briefId}`);
}

export async function deleteBrief(id: string) {
  await requireUser();
  await db.trendBrief.delete({ where: { id } });
  revalidatePath("/trends/brief");
}

/** 처음 한 번 — 추천 소스를 넣어 둔다. 이미 있으면 건드리지 않는다. */
export async function seedSources(): Promise<void> {
  await requireUser();

  let added = 0;
  for (const s of STARTER_SOURCES) {
    const exists = await db.trendSource.findFirst({
      where: { name: s.name },
      select: { id: true },
    });
    if (exists) continue;

    await db.trendSource.create({
      data: {
        name: s.name,
        kind: s.kind,
        url: s.url ?? null,
        keyword: s.keyword ?? null,
        category: s.category,
        // manual 은 자동 수집 대상이 아니라 켜 두어도 아무 일도 하지 않는다
        isActive: true,
      },
    });
    added += 1;
  }

  revalidatePath("/trends/sources");
}

export async function togglePin(id: string) {
  await requireUser();
  const item = await db.trendItem.findUnique({ where: { id }, select: { isPinned: true } });
  if (!item) return;
  await db.trendItem.update({ where: { id }, data: { isPinned: !item.isPinned } });
  revalidatePath("/trends");
}

export async function markRead(id: string) {
  await requireUser();
  await db.trendItem.update({ where: { id }, data: { readAt: new Date() } });
  revalidatePath("/trends");
}

export async function deleteItem(id: string) {
  await requireUser();
  await db.trendItem.delete({ where: { id } });
  revalidatePath("/trends");
}

/** 직접 본 자료를 손으로 남긴다 — RSS 가 없는 기관 자료용 */
export async function addManualItem(
  _prev: TrendState,
  fd: FormData,
): Promise<TrendState> {
  await requireUser();

  const title = str(fd, "title");
  const url = str(fd, "url");
  if (!title) return { error: "제목을 입력해 주세요." };
  if (!url) return { error: "주소를 입력해 주세요." };

  const exists = await db.trendItem.findUnique({ where: { url }, select: { id: true } });
  if (exists) return { error: "이미 등록된 주소입니다." };

  const category = str(fd, "category") || "HRD";

  // 손으로 넣은 것을 담아 둘 소스가 하나 필요하다
  let manual = await db.trendSource.findFirst({
    where: { kind: "manual", name: "직접 등록" },
    select: { id: true },
  });
  if (!manual) {
    manual = await db.trendSource.create({
      data: { name: "직접 등록", kind: "manual", category, isActive: true },
      select: { id: true },
    });
  }

  const publishedAt = str(fd, "publishedAt");
  const d = publishedAt ? new Date(publishedAt) : null;

  await db.trendItem.create({
    data: {
      sourceId: manual.id,
      title,
      url,
      publisher: optStr(fd, "publisher"),
      summary: optStr(fd, "summary"),
      category,
      publishedAt: d && Number.isFinite(d.getTime()) ? d : new Date(),
    },
  });

  revalidatePath("/trends");
  redirect("/trends");
}
