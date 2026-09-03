"use client";

/**
 * 레이아웃 자체가 깨졌을 때의 마지막 안전망.
 * 여기서는 글꼴·스타일도 못 믿으므로 아무것도 안 쓰고 글자만 둔다.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: "sans-serif", padding: "4rem 1rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem" }}>화면을 열 수 없습니다</h1>
        <p style={{ color: "#555", marginTop: "0.75rem" }}>
          서버를 켠 검은 창(명령 프롬프트)의 빨간 글씨를 확인해 주세요.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{ marginTop: "1.5rem", padding: "0.5rem 1rem", cursor: "pointer" }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
