import Anthropic from "@anthropic-ai/sdk";
import { db } from "./db";

/**
 * 주간 브리핑 — 모아둔 기사를 읽고 "그래서 우리는 어디로 가야 하는가"를 정리한다.
 *
 * Claude API 를 호출하므로 .env 에 ANTHROPIC_API_KEY 가 있어야 한다.
 * 키가 없으면 버튼 대신 안내가 뜬다 — 기능이 조용히 실패하는 일은 없다.
 */

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const MODEL = "claude-opus-5";

const SYSTEM = `너는 한국의 기업교육 전문기업 neoize 의 전략 애널리스트다.
neoize 는 기업·기관을 상대로 K-DISC 행동유형 진단, 신입 과정, 리더십·조직문화 교육을 판다.
독자는 이 회사의 대표와 직원 3명이다. 이들이 읽고 "다음 분기에 무엇을 준비할지"를
정할 수 있어야 한다.

브리핑 원칙:
- 기사 나열이 아니라 해석을 쓴다. "무슨 일이 있었나"보다 "그래서 우리에게 무슨 뜻인가"
- 근거 없는 단정을 하지 않는다. 기사에 없는 내용은 추측임을 밝힌다
- neoize 의 주력(K-DISC 진단, 신입, 리더십·조직문화)과 연결되는 지점을 반드시 짚는다
- 한국어로, 마크다운으로 쓴다`;

function buildPrompt(items: {
  title: string;
  publisher: string | null;
  category: string;
  publishedAt: Date | null;
  summary: string | null;
}[]): string {
  const lines = items.map((it) => {
    const date = it.publishedAt ? it.publishedAt.toISOString().slice(0, 10) : "날짜미상";
    const src = it.publisher ?? "출처미상";
    const sum = it.summary ? ` — ${it.summary}` : "";
    return `- [${it.category}] (${date}, ${src}) ${it.title}${sum}`;
  });

  return `다음은 최근 수집한 HRD·채용·경제·AI 관련 기사 목록이다.

${lines.join("\n")}

이 기사들을 바탕으로 주간 브리핑을 작성하라. 구성:

## 이번 주 핵심 3가지
가장 중요한 흐름 3개. 각각 2~3문장.

## HRD 방향
업계가 어디로 움직이는지. 교육 예산·주제·방식의 변화.

## 경제·채용 신호
교육 예산과 채용 시즌에 영향을 줄 경제 흐름.

## 우리가 할 일
neoize 가 다음 2~4주 안에 준비하거나 확인할 것. 구체적으로.
(예: "OO 주제 제안서 준비", "고객사 OO 업종에 이 이슈 언급")

전체 A4 한 장 분량을 넘기지 마라.`;
}

export type BriefResult =
  | { ok: true; briefId: string }
  | { ok: false; error: string };

/** 최근 days 일치 기사를 요약해 저장한다 */
export async function generateBrief(days: number, createdBy: string): Promise<BriefResult> {
  if (!hasAnthropicKey()) {
    return {
      ok: false,
      error:
        "Claude API 키가 없습니다. console.anthropic.com 에서 키를 만들어 .env 에 ANTHROPIC_API_KEY 로 넣고 서버를 다시 시작해 주세요.",
    };
  }

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - days * 24 * 60 * 60 * 1000);

  const items = await db.trendItem.findMany({
    where: {
      OR: [
        { publishedAt: { gte: periodStart } },
        { publishedAt: null, createdAt: { gte: periodStart } },
      ],
    },
    orderBy: [{ category: "asc" }, { publishedAt: "desc" }],
    take: 150,
    select: {
      title: true,
      publisher: true,
      category: true,
      publishedAt: true,
      summary: true,
    },
  });

  if (items.length < 3) {
    return {
      ok: false,
      error: `최근 ${days}일 기사가 ${items.length}건뿐입니다. 먼저 '지금 수집'으로 기사를 모아 주세요.`,
    };
  }

  const client = new Anthropic();

  try {
    // 브리핑은 길 수 있어 스트리밍으로 받는다 — 타임아웃을 피하기 위해서다
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: "user", content: buildPrompt(items) }],
    });
    const message = await stream.finalMessage();

    const content = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!content) {
      return { ok: false, error: "요약이 비어 있습니다. 다시 시도해 주세요." };
    }

    const brief = await db.trendBrief.create({
      data: {
        periodStart,
        periodEnd,
        itemCount: items.length,
        content,
        model: message.model,
        createdBy,
      },
    });

    return { ok: true, briefId: brief.id };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: "Claude API 키가 올바르지 않습니다. .env 의 ANTHROPIC_API_KEY 를 확인해 주세요." };
    }
    if (e instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "요청이 몰려 잠시 막혔습니다. 1~2분 뒤 다시 시도해 주세요." };
    }
    if (e instanceof Anthropic.APIConnectionError) {
      return { ok: false, error: "Claude API 에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요." };
    }
    if (e instanceof Anthropic.APIError) {
      return { ok: false, error: `Claude API 오류 (${e.status}): ${e.message}` };
    }
    throw e;
  }
}
