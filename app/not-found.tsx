import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-3xl space-y-3 p-5">
      <h1 className="text-2xl font-extrabold">페이지를 찾을 수 없습니다</h1>
      <p>주소가 바뀌었거나 잘못 입력되었을 수 있습니다. 아래 버튼으로 자격증 목록에서 다시 찾아 주세요.</p>
      <Link href="/" className="btn btn-primary btn-lg">
        자격증 목록으로 가기 →
      </Link>
    </div>
  );
}
