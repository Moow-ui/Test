/**
 * 수험 정보 글 품질 보호 (구글이 얕은·비슷한 AI 글로 보지 않게).
 * - 유사도: 같은 언어의 다른 글과 문장이 많이 겹치면 검사(npm run validate)가 막는다.
 * - 지난 일정: 일정 글은 validUntil 이 지나면 화면에 "지난 일정" 안내를 붙이고 검색 색인·sitemap 에서 뺀다.
 */

/** 한국시간 오늘 (YYYY-MM-DD). 빌드한 날 기준 */
export function kstToday(now = Date.now()): string {
  return new Date(now + 9 * 3600_000).toISOString().slice(0, 10);
}

/** 정보의 유효 기간(validUntil)이 지난 글인가 */
export function isGuideExpired(guide: { validUntil?: string }, today = kstToday()): boolean {
  return !!guide.validUntil && guide.validUntil < today;
}

/** 이 값 이상 겹치면 같은 글을 돌려쓴 것으로 보고 막는다 (0~1) */
export const GUIDE_MAX_SIMILARITY = 0.2;

type GuideText = {
  title: string;
  intro: string;
  sections: Array<{ heading: string; body: string }>;
};

function shingles(guide: GuideText, size = 5): Set<string> {
  const text = [guide.title, guide.intro, ...guide.sections.flatMap((s) => [s.heading, s.body])]
    .join(" ")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
  const set = new Set<string>();
  for (let i = 0; i + size <= text.length; i++) set.add(text.slice(i, i + size));
  return set;
}

/** 두 글의 문장 겹침 정도 (글자 5개 묶음의 자카드 유사도, 0~1) */
export function guideSimilarity(a: GuideText, b: GuideText): number {
  const sa = shingles(a);
  const sb = shingles(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let common = 0;
  for (const s of sa) if (sb.has(s)) common++;
  return common / (sa.size + sb.size - common);
}
