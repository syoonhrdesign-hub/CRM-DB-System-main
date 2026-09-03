"use client";

import { useEffect } from "react";

/**
 * 화면 하나가 깨졌을 때 보여 주는 안내.
 *
 * 이 파일이 없으면 Next.js 의 영어 기본 문구("Application error…")가 뜬다.
 * 오류 원인은 서버 창(콘솔)에 찍히므로 여기서는 사람이 할 일만 적는다.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 브라우저 콘솔에도 남겨 둔다 — 개발자에게 전달할 때 쓴다
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-sm font-semibold text-[var(--danger)]">문제가 생겼습니다</p>
      <h1 className="mt-2 text-xl font-bold">이 화면을 그리지 못했습니다</h1>
      <p className="mt-3 text-sm text-muted">
        입력한 내용은 저장이 끝난 것까지만 남아 있습니다. 먼저 &ldquo;다시 시도&rdquo;를 눌러
        보시고, 계속 그러면 서버를 켠 검은 창(명령 프롬프트)에 찍힌 빨간 글씨를
        개발 담당자에게 보내 주세요.
      </p>
      {error.digest && (
        <p className="tnum mt-2 text-xs text-faint">오류 번호 {error.digest}</p>
      )}
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" onClick={reset} className="btn btn-primary">
          다시 시도
        </button>
        <a href="/" className="btn btn-secondary">
          대시보드로
        </a>
      </div>
    </div>
  );
}
