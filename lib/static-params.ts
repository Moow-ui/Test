import { getCertList, getReadyCertifications } from "./data";
import { LOCALES, localeCountry } from "./i18n";

/**
 * 빌드 때 미리 만들 주소 목록 (generateStaticParams 용).
 *
 * 항상 "모든 언어"의 주소를 { lang, slug } 로 한꺼번에 돌려준다.
 * Next.js 는 상위([lang])의 값마다 이 함수를 부르는데, 어느 한 언어에서 빈 목록을 돌려주면
 * (예: /en 에 준비된 자격증이 아직 없을 때) 그 화면 전체를 미리 만들지 않는다.
 * 그러면 실행 중에 파일을 읽으려다 실패하므로, 언어를 가리지 않고 전체를 돌려준다 (중복은 Next.js 가 걸러 낸다).
 */

/** 자격증 화면: 목록에 있는 모든 자격증 ("준비 중" 포함) */
export async function certParams(): Promise<Array<{ lang: string; slug: string }>> {
  const result = [];
  for (const lang of LOCALES) {
    for (const cert of await getCertList(localeCountry(lang))) result.push({ lang, slug: cert.id });
  }
  return result;
}

/** 풀이·기출·오답노트 화면: 문제가 준비된 자격증만 */
export async function readyCertParams(): Promise<Array<{ lang: string; slug: string }>> {
  const result = [];
  for (const lang of LOCALES) {
    for (const cert of await getReadyCertifications(localeCountry(lang))) result.push({ lang, slug: cert.id });
  }
  return result;
}

/** 단원 화면: 준비된 자격증의 모든 단원 */
export async function chapterParams(): Promise<Array<{ lang: string; slug: string; chapterId: string }>> {
  const result = [];
  for (const lang of LOCALES) {
    for (const cert of await getReadyCertifications(localeCountry(lang))) {
      for (const subject of cert.subjects) {
        for (const chapter of subject.chapters) result.push({ lang, slug: cert.id, chapterId: chapter.id });
      }
    }
  }
  return result;
}
