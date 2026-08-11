/**
 * 브리핑 본문(마크다운 일부)을 그린다.
 *
 * 라이브러리를 쓰지 않은 이유: 브리핑은 우리가 프롬프트로 형식을 정해 두었기 때문에
 * 제목·목록·굵게 정도만 나온다. 그걸 위해 파서 의존성을 들이는 것보다
 * 필요한 만큼만 직접 처리하는 편이 유지보수가 쉽다.
 */

function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  parts.forEach((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      out.push(<strong key={`${keyBase}-${i}`}>{part.slice(2, -2)}</strong>);
    } else if (part) {
      out.push(part);
    }
  });
  return out;
}

export function BriefMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let key = 0;

  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={`ul-${key++}`} className="my-2 grid gap-1.5 pl-1">
        {list.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span className="text-accent">·</span>
            <span>{inline(item, `li-${key}-${i}`)}</span>
          </li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (/^[-*]\s+/.test(trimmed)) {
      list.push(trimmed.replace(/^[-*]\s+/, ""));
      continue;
    }
    flushList();

    if (trimmed.startsWith("### ")) {
      blocks.push(
        <h4 key={`h-${key++}`} className="mt-4 text-sm font-bold">
          {trimmed.slice(4)}
        </h4>,
      );
    } else if (trimmed.startsWith("## ")) {
      blocks.push(
        <h3 key={`h-${key++}`} className="mt-5 border-b border-line pb-1 text-base font-bold">
          {trimmed.slice(3)}
        </h3>,
      );
    } else if (trimmed.startsWith("# ")) {
      blocks.push(
        <h2 key={`h-${key++}`} className="mt-5 text-lg font-bold">
          {trimmed.slice(2)}
        </h2>,
      );
    } else if (/^\d+\.\s+/.test(trimmed)) {
      blocks.push(
        <p key={`p-${key++}`} className="mt-2 flex gap-2 text-sm leading-relaxed">
          <span className="tnum font-bold text-accent">{trimmed.match(/^\d+/)?.[0]}.</span>
          <span>{inline(trimmed.replace(/^\d+\.\s+/, ""), `ol-${key}`)}</span>
        </p>,
      );
    } else if (trimmed) {
      blocks.push(
        <p key={`p-${key++}`} className="mt-2 text-sm leading-relaxed">
          {inline(trimmed, `p-${key}`)}
        </p>,
      );
    }
  }
  flushList();

  return <div>{blocks}</div>;
}
