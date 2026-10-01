import Link from "next/link";
import { COPYRIGHT_NOTICE, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="cv no-print mt-12 border-t border-line-soft bg-surface">
      <div className="mx-auto w-full max-w-5xl space-y-2 px-4 py-6 text-[0.85rem] text-ink-sub">
        <p className="font-bold text-ink">
          {SITE_NAME} · {SITE_TAGLINE}
        </p>
        <p>{COPYRIGHT_NOTICE}</p>
        <p>
          시험 일정·응시 자격 등 공식 정보는 시행기관(한국산업인력공단 큐넷, 대한상공회의소 자격평가사업단)에서 꼭 다시 확인하세요.
        </p>
        <nav aria-label="하단 메뉴" className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
          <Link href="/" className="link">
            자격증 목록
          </Link>
          <Link href="/notes" className="link">
            오답노트
          </Link>
        </nav>
      </div>
    </footer>
  );
}
