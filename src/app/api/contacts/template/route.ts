import { buildContactTemplate } from "@/lib/excel";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser();
  const buffer = await buildContactTemplate();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        `attachment; filename="crm-contacts-template.xlsx"; ` +
        `filename*=UTF-8''${encodeURIComponent("담당자_일괄등록_양식.xlsx")}`,
      "Cache-Control": "no-store",
    },
  });
}
