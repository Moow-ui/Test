import fs from "node:fs";
import path from "node:path";

/**
 * /data 폴더의 파일 위치 규칙 (서버·스크립트 전용).
 *
 *   data/certifications.json                        자격증 목록
 *   data/certs/{id}.json                            시험 정보·과목·단원
 *   data/questions/{id}/predicted/*.json            AI 예상문제
 *   data/questions/{id}/past/{난이도}/{단원 id}.json   기출문제 (난이도별 폴더 → 단원별 파일)
 *
 * 기출 파일의 위치는 문제의 level·chapterId 로 정해지므로 손으로 옮기지 않는다.
 * (scripts/import-questions.ts 가 알아서 넣는다)
 */

export const DATA_DIR = path.join(process.cwd(), "data");

export function certDetailFile(certId: string): string {
  return path.join(DATA_DIR, "certs", `${certId}.json`);
}

export function questionDir(certId: string): string {
  return path.join(DATA_DIR, "questions", certId);
}

/** 기출 한 문제가 들어갈 파일 */
export function pastQuestionFile(certId: string, level: string, chapterId: string): string {
  return path.join(questionDir(certId), "past", level, `${chapterId}.json`);
}

export function predictedQuestionFile(certId: string, fileName: string): string {
  return path.join(questionDir(certId), "predicted", fileName);
}

/** 자격증의 문제 파일 전체 (하위 폴더까지, 이름순) */
export function listQuestionFiles(certId: string): string[] {
  const walk = (dir: string): string[] => {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))
      .flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        return entry.name.endsWith(".json") ? [full] : [];
      });
  };
  return walk(questionDir(certId));
}

export function readJsonFile(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** data 폴더 기준의 짧은 경로 (화면·로그 표시용) */
export function shortPath(file: string): string {
  return path.relative(process.cwd(), file).split(path.sep).join("/");
}
