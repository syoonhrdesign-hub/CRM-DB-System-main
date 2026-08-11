/** FormData 를 Prisma 에 넣을 값으로 바꾸는 헬퍼. 빈 문자열은 전부 null 로 접는다. */

export function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export function optStr(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}

export function int(fd: FormData, key: string, fallback = 0): number {
  const v = str(fd, key).replace(/,/g, "");
  if (v === "") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function optInt(fd: FormData, key: string): number | null {
  const v = str(fd, key).replace(/,/g, "");
  if (v === "") return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

export function num(fd: FormData, key: string, fallback = 0): number {
  const v = str(fd, key).replace(/,/g, "");
  if (v === "") return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export function optNum(fd: FormData, key: string): number | null {
  const v = str(fd, key).replace(/,/g, "");
  if (v === "") return null;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

/** <input type="date"> 값을 Date 로. 시간대 밀림을 막기 위해 UTC 자정으로 고정한다. */
export function optDate(fd: FormData, key: string): Date | null {
  const v = str(fd, key);
  if (v === "") return null;
  const d = new Date(`${v}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function reqDate(fd: FormData, key: string, fallback = new Date()): Date {
  return optDate(fd, key) ?? fallback;
}
