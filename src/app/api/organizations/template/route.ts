import { buildTemplate } from "@/lib/excel";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/** 빈 양식을 내려준다. 이 열 이름에 맞춰 채우면 업로드가 된다. */
export async function GET() {
  await requireUser();

  const buffer = await buildTemplate();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // 파일명에 한글을 쓰면 브라우저마다 깨져서, ASCII 이름과 UTF-8 이름을 함께 준다
      "Content-Disposition":
        `attachment; filename="crm-organizations-template.xlsx"; ` +
        `filename*=UTF-8''${encodeURIComponent("고객사_일괄등록_양식.xlsx")}`,
      "Cache-Control": "no-store",
    },
  });
}
