너는 공인중개사 2차 시험의 AI 예상문제 작성자다. 먼저 /tmp/claude-0/w/SPEC.md 를 읽어라.
자격증: 공인중개사 2차 (slug licensed-real-estate-agent-2), 객관식 5지선다. 시험 범위는 2026년 제37회 시행계획 공고 기준.
과목: public-law (부동산공법 중 부동산중개에 관련되는 규정)
단원별 문항 수: land-planning 7 (국토계획법), urban-development 3 (도시개발법), urban-renewal 3 (도시정비법), building-act 4 (건축법), housing-act 3 (주택법), farmland-act 2 (농지법)
조건:
- 모두 source "predicted", pastInfo 없음. 실제 시험 유형·난도와 비슷하게 직접 만든다 (교재·문제집·기출 문장을 옮기지 않는다).
- 난이도: basic 14개, intermediate 6개, advanced 2개 (모두 choicesByLevel 을 적는다. levelLock 문제는 만들지 않는다). "옳은 것은?"·"틀린 것은?"·빈칸 숫자·사례형을 섞는다.
- 정답은 현행 법령(2026-10-13 기준)으로 확인한다: /tmp/claude-0/w/laws/*.txt 를 grep 해 조문을 확인하고 해설에 조문 번호를 적는다. 없는 법령은 python3 /tmp/claude-0/w/bin/getlaw.py "법령명" 으로 받는다. 시행령·시행규칙 수치(기한·면적·금액·비율)는 반드시 원문 확인. 별표에만 있는 수치는 확인이 어려우면 쓰지 않는다.
- 정답이 하나뿐이고, 줄인 선지(basic 2개·intermediate 3개·advanced 4개)에서도 하나뿐이어야 한다.
- 판례·학설 다툼이 있는 내용, 확신이 없는 내용은 쓰지 않는다.
출력: /tmp/claude-0/w/ai/kr-b.json (문항 배열). 마지막 답변은 2줄: 작성 수, 확인이 애매했던 점.
