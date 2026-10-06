import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // 자격증 데이터를 처음 읽는 테스트가 기본 5초를 넘길 때가 있다 (자격증 수가 늘어남, OneDrive 폴더)
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)).replace(/[\/]$/, ""),
    },
  },
});
