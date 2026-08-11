import { db } from "@/lib/db";
import { ORG_COLUMNS, buildExport } from "@/lib/excel";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/** 지금 등록된 고객사를 엑셀로 내려받는다. 보고용으로도, 백업 확인용으로도 쓴다. */
export async function GET() {
  await requireUser();

  const organizations = await db.organization.findMany({
    orderBy: { name: "asc" },
    select: Object.fromEntries(
      ORG_COLUMNS.map((c) => [c.key, true]),
    ) as Record<string, true>,
  });

  const buffer = await buildExport(organizations as Record<string, unknown>[]);
  const today = new Date().toISOString().slice(0, 10);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        `attachment; filename="crm-organizations-${today}.xlsx"; ` +
        `filename*=UTF-8''${encodeURIComponent(`고객사_${today}.xlsx`)}`,
      "Cache-Control": "no-store",
    },
  });
}
