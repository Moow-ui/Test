/** 한글 초성 검색 */

const CHOSUNG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const SYLLABLES_PER_CHOSUNG = 588;

function isChosungJamo(ch: string): boolean {
  return CHOSUNG.includes(ch);
}

/** 한 글자의 초성. 한글 음절이 아니면 글자를 그대로 돌려준다 */
export function chosungOf(ch: string): string {
  const code = ch.charCodeAt(0);
  if (code < HANGUL_START || code > HANGUL_END) return ch;
  return CHOSUNG[Math.floor((code - HANGUL_START) / SYLLABLES_PER_CHOSUNG)];
}

/** "전기기능사" → "ㅈㄱㄱㄴㅅ" */
export function toChosung(text: string): string {
  return Array.from(text).map(chosungOf).join("");
}

/** 공백·기호를 지우고 소문자로 */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[\s·・.,()\-_/]+/g, "");
}

/**
 * target 안에 query 가 들어 있는지 검사한다.
 * query 의 글자가 초성 자음(ㄱ~ㅎ)이면 그 자리는 초성만 비교하므로
 * "ㅈㄱㄱㄴㅅ", "전기ㄱㄴㅅ" 모두 "전기기능사"와 맞는다.
 */
export function matchesQuery(target: string, query: string): boolean {
  const q = Array.from(normalizeText(query));
  if (q.length === 0) return true;
  const t = Array.from(normalizeText(target));
  if (q.length > t.length) return false;

  for (let start = 0; start + q.length <= t.length; start++) {
    let ok = true;
    for (let j = 0; j < q.length; j++) {
      const qc = q[j];
      const tc = t[start + j];
      const same = isChosungJamo(qc) ? chosungOf(tc) === qc : tc === qc;
      if (!same) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

export interface SearchableCert {
  name: string;
  officialName: string;
  spacedName: string;
  shortNames: string[];
}

/** target 이 query 로 시작하는지 (초성 포함) */
export function startsWithQuery(target: string, query: string): boolean {
  const qLength = Array.from(normalizeText(query)).length;
  const head = Array.from(normalizeText(target)).slice(0, qLength).join("");
  return head.length === qLength && matchesQuery(head, query);
}

/**
 * 자격증 검색: 이름·공식 명칭·띄어쓰기 변형·줄임말을 모두 검색 대상에 넣는다.
 * 이름이 검색어로 시작하는 것 → 이름에 검색어가 들어 있는 것 → 줄임말만 맞는 것 순서로 보여 준다.
 */
export function searchCerts<T extends SearchableCert>(certs: T[], query: string): T[] {
  if (normalizeText(query).length === 0) return certs;
  const ranked: Array<{ cert: T; rank: number; index: number }> = [];
  certs.forEach((cert, index) => {
    const names = [cert.name, cert.officialName, cert.spacedName];
    let rank: number;
    if (names.some((n) => startsWithQuery(n, query))) rank = 0;
    else if (names.some((n) => matchesQuery(n, query))) rank = 1;
    else if (cert.shortNames.some((n) => matchesQuery(n, query))) rank = 2;
    else return;
    ranked.push({ cert, rank, index });
  });
  return ranked.sort((a, b) => a.rank - b.rank || a.index - b.index).map((r) => r.cert);
}
