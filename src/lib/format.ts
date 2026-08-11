/** 화면 표시용 포매터. 서버·클라이언트 어디서나 같은 결과를 내도록 UTC 기준으로 다룬다. */

const KRW = new Intl.NumberFormat("ko-KR");

/** 1200000 → "1,200,000원" */
export function formatKRW(value: number | null | undefined): string {
  if (value == null) return "-";
  return `${KRW.format(value)}원`;
}

/** 1200000 → "120만" · 125000000 → "1.3억" — 대시보드 카드처럼 좁은 자리에 쓴다. */
export function formatKRWShort(value: number | null | undefined): string {
  if (value == null) return "-";
  const abs = Math.abs(value);
  if (abs >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000) return `${Math.round(value / 10_000).toLocaleString("ko-KR")}만`;
  return KRW.format(value);
}

/** Date → "2026-03-14" */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10);
}

/** Date → "2026-03-14" 형식의 <input type="date"> 초기값 */
export function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** "2026-03" 형태의 연월 키 */
export function monthKey(value: Date): string {
  return value.toISOString().slice(0, 7);
}

/** "2026-03" → "3월" */
export function monthLabel(key: string): string {
  return `${Number(key.slice(5, 7))}월`;
}

/** 기준일로부터 며칠 남았는지 — 음수면 지났다는 뜻 */
export function daysUntil(value: Date | string): number {
  const d = typeof value === "string" ? new Date(value) : value;
  const today = new Date();
  const a = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const b = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((a - b) / 86_400_000);
}

/** 사업자등록번호를 000-00-00000 으로 정리 */
export function formatBizRegNo(value: string | null | undefined): string {
  if (!value) return "-";
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 10) return value;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}
