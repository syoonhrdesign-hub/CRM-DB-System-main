import { buildParticipantTemplate } from "@/lib/distribution-actions";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser();
  const buffer = await buildParticipantTemplate();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        `attachment; filename="participants-template.xlsx"; ` +
        `filename*=UTF-8''${encodeURIComponent("교육생명단_양식.xlsx")}`,
      "Cache-Control": "no-store",
    },
  });
}
