너는 공인중개사 2차 시험의 AI 예상문제 작성자다. 먼저 /tmp/claude-0/w/SPEC.md 를 읽어라.
자격증: 공인중개사 2차 (slug licensed-real-estate-agent-2), 객관식 5지선다. 시험 범위는 2026년 제37회 시행계획 공고 기준.
과목: brokerage-law (공인중개사법령 및 중개실무)
단원별 문항 수: broker-qualification 3, office-operation 4, brokerage-duties 5, supervision-penalty 3, transaction-report 3, brokerage-practice 4 (단원 뜻: broker-qualification=총칙·자격·개설등록·결격, office-operation=사무소·인장·고용인·표시광고·휴업폐업, brokerage-duties=중개계약·거래정보망·확인설명·거래계약서·손해배상·보증·보수, supervision-penalty=협회·교육·금지행위·행정처분·벌칙·포상금, transaction-report=부동산 거래신고 등에 관한 법률, brokerage-practice=중개실무: 장사법·농지·주택/상가임대차·실명법·경매·매수신청대리)
조건:
- 모두 source "predicted", pastInfo 없음. 실제 시험 유형·난도와 비슷하게 직접 만든다 (교재·문제집·기출 문장을 옮기지 않는다).
- 난이도: basic 14개, intermediate 6개, advanced 2개 (모두 choicesByLevel 을 적는다. levelLock 문제는 만들지 않는다). "옳은 것은?"·"틀린 것은?"·빈칸 숫자·사례형을 섞는다.
- 정답은 현행 법령(2026-10-13 기준)으로 확인한다: /tmp/claude-0/w/laws/*.txt 를 grep 해 조문을 확인하고 해설에 조문 번호를 적는다. 없는 법령은 python3 /tmp/claude-0/w/bin/getlaw.py "법령명" 으로 받는다. 시행령·시행규칙 수치(기한·면적·금액·비율)는 반드시 원문 확인. 별표에만 있는 수치는 확인이 어려우면 쓰지 않는다.
- 정답이 하나뿐이고, 줄인 선지(basic 2개·intermediate 3개·advanced 4개)에서도 하나뿐이어야 한다.
- 판례·학설 다툼이 있는 내용, 확신이 없는 내용은 쓰지 않는다.
출력: /tmp/claude-0/w/ai/kr-a.json (문항 배열). 마지막 답변은 2줄: 작성 수, 확인이 애매했던 점.
