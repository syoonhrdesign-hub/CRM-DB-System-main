import { XMLParser } from "fast-xml-parser";
import { db } from "./db";

/**
 * 트렌드 수집.
 *
 * 두 가지 방식만 쓴다.
 *  - rss   : RSS/Atom 주소를 그대로 읽는다
 *  - naver : 네이버 뉴스 검색 API (공식 API, 무료). 키가 없으면 건너뛴다
 *
 * 채용 사이트(잡코리아·사람인)는 이용약관상 긁을 수 없어 넣지 않았다.
 */

export type CollectResult = {
  sourceId: string;
  name: string;
  added: number;
  error?: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
});

/** 태그가 섞여 오는 제목·요약을 사람이 읽을 수 있게 만든다 */
function clean(s: unknown): string {
  if (s == null) return "";
  const text = typeof s === "object" ? String((s as { "#text"?: string })["#text"] ?? "") : String(s);
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isFinite(d.getTime()) ? d : null;
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

type RawItem = {
  title: string;
  url: string;
  publisher: string | null;
  publishedAt: Date | null;
  summary: string | null;
};

/** RSS 2.0 과 Atom 을 모두 받는다 — 어느 쪽인지는 문서를 보고 판단한다 */
export function parseFeed(xml: string): RawItem[] {
  const doc = parser.parse(xml) as Record<string, unknown>;

  // RSS 2.0
  const channel = (doc.rss as { channel?: Record<string, unknown> } | undefined)?.channel;
  if (channel) {
    const publisher = clean(channel.title) || null;
    return asArray(channel.item as Record<string, unknown>[]).flatMap((it) => {
      const url = clean(it.link);
      const title = clean(it.title);
      if (!url || !title) return [];
      return [
        {
          title,
          url,
          publisher,
          publishedAt: toDate(it.pubDate ?? it["dc:date"]),
          summary: clean(it.description).slice(0, 500) || null,
        },
      ];
    });
  }

  // Atom
  const feed = doc.feed as Record<string, unknown> | undefined;
  if (feed) {
    const publisher = clean(feed.title) || null;
    return asArray(feed.entry as Record<string, unknown>[]).flatMap((it) => {
      const linkRaw = it.link as
        | { "@_href"?: string }
        | { "@_href"?: string }[]
        | undefined;
      const link = Array.isArray(linkRaw) ? linkRaw[0] : linkRaw;
      const url = clean(link?.["@_href"]);
      const title = clean(it.title);
      if (!url || !title) return [];
      return [
        {
          title,
          url,
          publisher,
          publishedAt: toDate(it.published ?? it.updated),
          summary: clean(it.summary ?? it.content).slice(0, 500) || null,
        },
      ];
    });
  }

  return [];
}

async function fetchRss(url: string): Promise<RawItem[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "neoize-CRM/1.0 (trend reader)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseFeed(await res.text());
}

async function fetchNaver(keyword: string): Promise<RawItem[]> {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error(
      "네이버 검색 키가 없습니다. .env 에 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 을 넣어 주세요.",
    );
  }

  const url =
    "https://openapi.naver.com/v1/search/news.json?display=30&sort=date&query=" +
    encodeURIComponent(keyword);

  const res = await fetch(url, {
    headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`네이버 API HTTP ${res.status}`);

  const json = (await res.json()) as {
    items?: { title?: string; link?: string; originallink?: string; description?: string; pubDate?: string }[];
  };

  return (json.items ?? []).flatMap((it) => {
    // 원문 주소가 있으면 그쪽을 쓴다. 네이버 중계 주소는 나중에 깨진다.
    const url = clean(it.originallink) || clean(it.link);
    const title = clean(it.title);
    if (!url || !title) return [];
    let publisher: string | null = null;
    try {
      publisher = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      /* 주소가 이상하면 매체명 없이 둔다 */
    }
    return [
      {
        title,
        url,
        publisher,
        publishedAt: toDate(it.pubDate),
        summary: clean(it.description).slice(0, 500) || null,
      },
    ];
  });
}

/** 소스 한 곳을 수집한다. 실패해도 예외를 던지지 않고 결과에 담아 돌려준다. */
export async function collectSource(source: {
  id: string;
  name: string;
  kind: string;
  url: string | null;
  keyword: string | null;
  category: string;
}): Promise<CollectResult> {
  const base = { sourceId: source.id, name: source.name };

  try {
    let items: RawItem[] = [];

    if (source.kind === "rss") {
      if (!source.url) throw new Error("RSS 주소가 없습니다.");
      items = await fetchRss(source.url);
    } else if (source.kind === "naver") {
      if (!source.keyword) throw new Error("검색어가 없습니다.");
      items = await fetchNaver(source.keyword);
    } else {
      // manual — 자동 수집 대상이 아니다
      return { ...base, added: 0 };
    }

    let added = 0;
    for (const it of items) {
      // url 이 유니크라 이미 있으면 조용히 넘어간다.
      // 여러 소스가 같은 기사를 물어와도 한 번만 남는다.
      const existing = await db.trendItem.findUnique({
        where: { url: it.url },
        select: { id: true },
      });
      if (existing) continue;

      await db.trendItem.create({
        data: {
          sourceId: source.id,
          title: it.title,
          url: it.url,
          publisher: it.publisher,
          publishedAt: it.publishedAt,
          summary: it.summary,
          category: source.category,
        },
      });
      added += 1;
    }

    await db.trendSource.update({
      where: { id: source.id },
      data: { lastFetchedAt: new Date(), lastError: null, lastItemCount: added },
    });

    return { ...base, added };
  } catch (e) {
    const error = e instanceof Error ? e.message : "알 수 없는 오류";
    await db.trendSource.update({
      where: { id: source.id },
      data: { lastFetchedAt: new Date(), lastError: error },
    });
    return { ...base, added: 0, error };
  }
}

/** 켜져 있는 소스를 모두 수집한다 */
export async function collectAll(): Promise<CollectResult[]> {
  const sources = await db.trendSource.findMany({
    where: { isActive: true, kind: { not: "manual" } },
    select: { id: true, name: true, kind: true, url: true, keyword: true, category: true },
  });

  const out: CollectResult[] = [];
  for (const s of sources) {
    out.push(await collectSource(s));
  }
  return out;
}
