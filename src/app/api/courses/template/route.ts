import { buildCourseTemplate } from "@/lib/excel";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser();
  const buffer = await buildCourseTemplate();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        `attachment; filename="crm-courses-template.xlsx"; ` +
        `filename*=UTF-8''${encodeURIComponent("교육과정_일괄등록_양식.xlsx")}`,
      "Cache-Control": "no-store",
    },
  });
}
