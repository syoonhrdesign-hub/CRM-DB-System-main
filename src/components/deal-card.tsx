import Link from "next/link";
import { DEAL_STAGES } from "@/lib/constants";
import { formatDate, formatKRWShort, daysUntil } from "@/lib/format";
import { moveDealStage } from "@/lib/actions";

type DealCardData = {
  id: string;
  title: string;
  stage: string;
  expectedAmount: number;
  probability: number;
  expectedCloseDate: Date | null;
  ownerName: string | null;
  organization: { id: string; name: string };
};

/**
 * 파이프라인 보드의 카드 한 장.
 * 드래그 앤 드롭 대신 좌/우 버튼으로 단계를 옮긴다 — 자바스크립트가 꺼져 있어도 동작한다.
 */
export function DealCard({ deal }: { deal: DealCardData }) {
  const index = DEAL_STAGES.indexOf(deal.stage as (typeof DEAL_STAGES)[number]);
  const prev = index > 0 ? DEAL_STAGES[index - 1] : null;
  const next =
    index >= 0 && index < DEAL_STAGES.length - 1 ? DEAL_STAGES[index + 1] : null;

  const dday =
    deal.expectedCloseDate != null ? daysUntil(deal.expectedCloseDate) : null;
  const isOpen = deal.stage !== "완료" && deal.stage !== "실패";
  const overdue = isOpen && dday != null && dday < 0;

  return (
    <article className="rounded-lg border border-line bg-surface p-3">
      <Link
        href={`/deals/${deal.id}/edit`}
        className="text-sm font-semibold hover:underline"
      >
        {deal.title}
      </Link>

      <Link
        href={`/organizations/${deal.organization.id}`}
        className="mt-0.5 block truncate text-xs text-muted hover:underline"
      >
        {deal.organization.name}
      </Link>

      <div className="tnum mt-2 flex items-baseline justify-between text-xs">
        <span className="font-bold">{formatKRWShort(deal.expectedAmount)}</span>
        <span className="text-faint">{deal.probability}%</span>
      </div>

      {deal.expectedCloseDate && (
        <p
          className={`tnum mt-1 text-xs ${overdue ? "font-semibold text-[var(--danger)]" : "text-faint"}`}
        >
          {formatDate(deal.expectedCloseDate)}
          {overdue && ` · ${Math.abs(dday!)}일 경과`}
        </p>
      )}

      {deal.ownerName && (
        <p className="mt-1 text-xs text-faint">담당 {deal.ownerName}</p>
      )}

      <div className="mt-2 flex gap-1">
        {prev && <StageButton id={deal.id} stage={prev} label={`← ${prev}`} />}
        {next && <StageButton id={deal.id} stage={next} label={`${next} →`} />}
      </div>
    </article>
  );
}

function StageButton({
  id,
  stage,
  label,
}: {
  id: string;
  stage: string;
  label: string;
}) {
  const move = moveDealStage.bind(null, id, stage);
  return (
    <form action={move} className="flex-1">
      <button
        type="submit"
        className="w-full rounded border border-line px-1.5 py-1 text-[11px] font-medium text-muted hover:bg-surface-2 hover:text-ink"
      >
        {label}
      </button>
    </form>
  );
}
