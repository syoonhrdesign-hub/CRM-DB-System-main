import { NextResponse } from "next/server";
import { collectAll } from "@/lib/trend-collect";

/**
 * 하루 한 번 자동 수집용.
 *
 * 사무실 PC 작업 스케줄러에서 deploy/windows/collect-trends.bat 이 호출한다.
 * 사람이 로그인해서 부르는 게 아니라, 미들웨어에서 x-cron-token 헤더를
 * .env 의 TRENDS_CRON_TOKEN 과 대조해 통과시킨다.
 */
export async function POST() {
  const results = await collectAll();
  const added = results.reduce((sum, r) => sum + r.added, 0);
  const failed = results.filter((r) => r.error);

  return NextResponse.json({
    ok: true,
    sources: results.length,
    added,
    failed: failed.map((f) => ({ name: f.name, error: f.error })),
  });
}
