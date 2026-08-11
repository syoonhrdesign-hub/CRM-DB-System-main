"use client";

import { useEffect, useState } from "react";

/**
 * 고객사에 전달할 링크.
 *
 * 서버가 자기 주소를 모르기 때문에(사내 IP 로 접속하는지, 나중에 외부 주소로
 * 접속하는지 서버는 알 수 없다) 브라우저에서 지금 보고 있는 주소를 기준으로 만든다.
 */
export function CopyLink({ slug, isActive }: { slug: string; isActive: boolean }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/code/${slug}`);
  }, [slug]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="rounded-card border border-accent bg-accent-soft p-4">
      <h2 className="text-sm font-bold text-accent">교육생에게 전달할 링크</h2>
      <p className="mt-1 text-sm text-muted">
        이 주소만 고객사에 보내면 됩니다. 교육생은 로그인 없이 자기 코드를 확인합니다.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="input min-w-0 flex-1 bg-surface font-mono text-sm"
        />
        <button type="button" onClick={copy} className="btn btn-primary">
          {copied ? "복사했습니다" : "링크 복사"}
        </button>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-secondary"
          >
            미리보기
          </a>
        )}
      </div>

      {!isActive && (
        <p className="mt-3 rounded-md bg-surface px-3 py-2 text-sm text-muted">
          지금은 중지 상태라 교육생이 열어도 조회되지 않습니다.
        </p>
      )}

      <p className="mt-3 text-xs text-faint">
        사내망에서만 접속되는 주소입니다. 고객사 교육생이 밖에서 열려면 외부 접속
        설정이 필요합니다 (README 참고).
      </p>
    </div>
  );
}
