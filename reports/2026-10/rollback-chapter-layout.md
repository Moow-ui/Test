# 되돌리기: 단원 핵심정리 레이아웃 정리 (2026-10-15)

바꾼 내용은 커밋 **하나**(`7112f08`)에 모두 들어 있다. 마음에 안 들면 그 커밋만 되돌린다.

- 바꾸기 전 커밋: `392be9e` (docs: pause afternoon routine indefinitely)
- 바꾼 커밋: `7112f08` (ui: 단원 핵심정리 페이지 레이아웃 정리 + 화면 설정 Aa 팝오버)

## 되돌리는 방법

```bash
git revert --no-edit 7112f08
npm test && npm run build
git push
```

`git revert` 는 기록을 지우지 않고 "되돌리는 커밋"을 하나 더 만든다. 나중에 다시 적용하고 싶으면 그 되돌리기 커밋을 다시 `git revert` 하면 된다.

## 바꾼 파일

- `app/[lang]/(site)/cert/[slug]/[chapterId]/page.tsx` — 단원 페이지 템플릿 (순서·메타 한 줄·CTA·작성 안내)
- `components/DisplayControls.tsx` — "Aa" 버튼 + 팝오버 (글씨 크기·화면 밝기)
- `components/Stars.tsx`, `app/tokens.css`, `app/globals.css` — 별 전용 색(`--star`), `.muted-accent`
- `messages/ko.json`, `messages/en.json` — 문구
- `scripts/check-meta.ts`, `docs/code-rules.md` — 단원 페이지 H1 규칙
- `components/Header.tsx`, `components/TopBar.tsx` — 주석
- `tests/exam-badge.test.ts` — 글자 크기 버튼이 팝오버 안으로 옮겨진 것 반영
