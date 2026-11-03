/**
 * 단원 링크 주소. 단원 페이지를 합친 단원(merged: lib/data 의 getMergedChapterIds)은 개념 정리 단원 페이지로,
 * 나머지는 단원 핵심정리 페이지로 간다 (합친 단원의 /{단원} 은 영구 이동이라 링크가 바로 도착지를 가리키게 한다).
 */
export function chapterHref(certPath: string, chapterId: string, merged: ReadonlySet<string>): string {
  return merged.has(chapterId) ? `${certPath}/concepts/${chapterId}` : `${certPath}/${chapterId}`;
}
