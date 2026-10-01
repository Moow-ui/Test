import fs from "node:fs";
import path from "node:path";
import type { DataStore } from "./store";

/** /data 폴더의 파일을 읽고 쓰는 저장소 (서버·스크립트 전용) */

export const DATA_ROOT = path.join(process.cwd(), "data");

const abs = (relative: string) => path.join(DATA_ROOT, ...relative.split("/"));

export const fsStore: DataStore = {
  async list(dir) {
    const full = abs(dir);
    if (!fs.existsSync(full)) return [];
    return fs
      .readdirSync(full)
      .filter((name) => !name.startsWith("."))
      .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  },
  async readJson(file) {
    const full = abs(file);
    if (!fs.existsSync(full)) return null;
    return JSON.parse(fs.readFileSync(full, "utf8"));
  },
};

// ───────── 쓰기 (scripts 전용) ─────────

export function writeDataJson(file: string, value: unknown): void {
  const full = abs(file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(value, null, 2)}\n`);
}

/** data 폴더의 파일을 다른 곳으로 복사한다 (문제 그림 → public) */
export function copyDataFile(file: string, target: string): void {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(abs(file), target);
}
