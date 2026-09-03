import Link from "next/link";

/** 없는 주소로 왔을 때 — 지운 고객사 링크를 눌렀거나 주소를 잘못 친 경우 */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-sm font-semibold text-muted">404</p>
      <h1 className="mt-2 text-xl font-bold">그런 화면이 없습니다</h1>
      <p className="mt-3 text-sm text-muted">
        지워진 항목의 링크이거나 주소가 잘못됐을 수 있습니다.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/" className="btn btn-primary">
          대시보드로
        </Link>
        <Link href="/organizations" className="btn btn-secondary">
          고객사 목록
        </Link>
      </div>
    </div>
  );
}
