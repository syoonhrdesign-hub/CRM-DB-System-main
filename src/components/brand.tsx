/**
 * 브랜드 요소.
 *
 * 로고의 4색 브러시(빨강·노랑·초록·파랑)는 DISC 유형 색이다.
 * 화면 전체에 흩뿌리면 업무용 표가 시끄러워지므로,
 * 로고와 로그인 화면 같은 "브랜드가 드러나야 할 자리"에만 쓴다.
 */

/** 사선 4색 마크 — 로고의 브러시 획을 단순화한 형태 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      focusable="false"
    >
      {/* 왼쪽 위에서 오른쪽 아래로 기울인 네 획 */}
      <g transform="skewX(-14)">
        <rect x="7" y="3" width="5.4" height="26" rx="1.2" fill="var(--brand-red)" />
        <rect x="13.2" y="3" width="5.4" height="26" rx="1.2" fill="var(--brand-yellow)" />
        <rect x="19.4" y="3" width="5.4" height="26" rx="1.2" fill="var(--brand-green)" />
        <rect x="25.6" y="3" width="5.4" height="26" rx="1.2" fill="var(--brand-blue)" />
      </g>
    </svg>
  );
}

/** 4색 띠 — 로그인 화면처럼 브랜드를 한 번 보여 줄 자리에 쓴다 */
export function BrandStripe({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-1 overflow-hidden rounded-full ${className}`} aria-hidden="true">
      <span className="flex-1 bg-[var(--brand-red)]" />
      <span className="flex-1 bg-[var(--brand-yellow)]" />
      <span className="flex-1 bg-[var(--brand-green)]" />
      <span className="flex-1 bg-[var(--brand-blue)]" />
    </div>
  );
}
