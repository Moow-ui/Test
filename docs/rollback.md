# 되돌리기 (화면 변경을 취소할 때)

큰 화면 변경을 하기 전에는 그 직전 상태를 **백업 브랜치**(`backup/...`)로 GitHub 에 남겨 두고, 변경은 **커밋 1개**로 만든다.
이상하면 아래 방법으로 되돌린다. push 하면 자동 배포되므로 되돌린 화면도 몇 분 뒤 사이트에 반영된다.

## 기록

| 날짜 | 변경 | 백업 브랜치 (변경 직전 상태) | 변경 커밋 메시지 |
|---|---|---|---|
| 2026-10-18 | 왼쪽 메뉴(☰ 메뉴 버튼·메뉴판) + 질문 & 답변·공지사항 빈 페이지 | `backup/before-side-menu-2026-10-18` | `ui: add side menu` |

## 방법 1 (추천) — 그 변경만 취소

그 뒤에 들어간 매일 루틴(자격증 추가)은 그대로 두고, 메뉴 변경 커밋만 취소한다.

```
git fetch origin main && git checkout main && git pull origin main
git log --oneline --grep "ui: add side menu"      # 커밋 번호 확인
git revert <커밋 번호>                              # 취소 커밋이 새로 생긴다
npm test && npm run build
git push origin main
```

Claude 에게는 "메뉴 추가한 거 되돌려 줘 (docs/rollback.md)" 라고 하면 된다.

## 방법 2 — 변경 직전과 비교만 하기

```
git fetch origin backup/before-side-menu-2026-10-18
git diff FETCH_HEAD main -- components app messages
```

백업 브랜치 시점으로 사이트 전체를 되감는 것(`git reset`)은 그 뒤에 추가된 자격증까지 사라지므로 쓰지 않는다.
