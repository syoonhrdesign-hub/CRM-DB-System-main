import { db } from "@/lib/db";
import { COURSE_COLUMNS, buildCourseExport } from "@/lib/excel";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser();

  const courses = await db.course.findMany({
    orderBy: [{ category: "asc" }, { code: "asc" }],
    select: Object.fromEntries(
      COURSE_COLUMNS.map((c) => [c.key, true]),
    ) as Record<string, true>,
  });

  const buffer = await buildCourseExport(courses as Record<string, unknown>[]);
  const today = new Date().toISOString().slice(0, 10);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        `attachment; filename="crm-courses-${today}.xlsx"; ` +
        `filename*=UTF-8''${encodeURIComponent(`교육과정_${today}.xlsx`)}`,
      "Cache-Control": "no-store",
    },
  });
}
