import { formatKRW, formatKRWShort, monthLabel } from "@/lib/format";

export type MonthlyPoint = { key: string; revenue: number; count: number };

/**
 * 월별 매출 막대그래프.
 *
 * 계열이 하나뿐이라 범례는 두지 않고 제목이 계열을 설명한다(색만으로 구분하는 정보 없음).
 * 자바스크립트 없이 동작하도록 CSS 만으로 그리고, 숫자는 아래 표에서도 그대로 읽을 수 있다.
 */
export function MonthlyRevenueChart({ data }: { data: MonthlyPoint[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const total = data.reduce((s, d) => s + d.revenue, 0);

  if (total === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-muted">
        완료된 교육이 아직 없어 표시할 매출이 없습니다.
      </p>
    );
  }

  return (
    <figure className="m-0">
      {/* 최고값 눈금 — 막대 높이를 읽을 기준선 */}
      <div className="tnum mb-1 flex items-center gap-2 text-[10px] text-faint">
        <span>{formatKRWShort(max)}</span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      {/* 각 열이 h-48 을 그대로 물려받아야 막대의 height:% 가 계산된다.
          items-end 를 주면 열 높이가 내용에 맞춰져 퍼센트 기준이 사라진다. */}
      <div className="flex h-48 gap-[2px]" role="img" aria-label="최근 12개월 월별 매출">
        {data.map((d) => {
          const pct = (d.revenue / max) * 100;
          return (
            <div key={d.key} className="group relative flex flex-1 flex-col justify-end">
              {/* 값이 0이어도 자리를 알 수 있게 최소 2px 은 남긴다 */}
              <div
                className="rounded-t bg-accent transition-opacity group-hover:opacity-80"
                style={{ height: `max(2px, ${pct}%)` }}
              />

              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1 text-xs shadow-lg group-hover:block">
                <span className="font-semibold">{d.key}</span>
                <br />
                <span className="tnum">{formatKRW(d.revenue)}</span>
                <br />
                <span className="tnum text-faint">교육 {d.count}건</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 flex gap-[2px] border-t border-line pt-1.5">
        {data.map((d) => (
          <div key={d.key} className="tnum flex-1 text-center text-[10px] text-faint">
            {monthLabel(d.key)}
          </div>
        ))}
      </div>

      <figcaption className="mt-2 text-xs text-muted">
        최근 12개월 합계{" "}
        <span className="tnum font-semibold text-ink">{formatKRWShort(total)}</span>
        <span className="text-faint"> · 완료 상태 교육의 계약금액 기준</span>
      </figcaption>
    </figure>
  );
}
