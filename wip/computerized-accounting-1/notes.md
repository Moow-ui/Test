# computerized-accounting-1 (전산회계 1급) — author notes (2026-10-31 KST)

## Official site access
- license.kacpta.or.kr could not be reached from this environment: HTTP 503 and connection resets, with WebFetch also returning 503. www.kacpta.or.kr got a proxy CONNECT 403. web.archive.org and bing are blocked.
- Because of that, the official facts below come from search-engine snippets of the official pages (WebSearch restricted to license.kacpta.or.kr). I did not read the pages directly. A verifier with access should re-check them.

## Official facts used
| Fact | Source URL (official) | Confidence |
|---|---|---|
| Theory 30% (객관식 4지선다형) + practical 70% (컴퓨터 프로그램 이용) | https://license.kacpta.or.kr/web/info/info_outline.aspx | snippet, consistent across sources |
| Theory scope: 회계원리 15%, 원가회계 10%, 세무회계 5% (부가가치세 중심); 1급 includes 2급 content; ranges ±10% | info_outline.aspx (snippet; one snippet said the table was garbled and showed "10% each") | medium. The site uses 8/4/3 as a 학습용 구분 |
| Practical scope: 기초정보 등록·수정 15%, 거래자료 입력 30%, 부가가치세 15%, 입력자료 및 제장부 조회 10% | info_outline.aspx (snippet) | medium (not used in data) |
| Pass: 100점 만점 70점 이상 | info_outline.aspx (snippet) | high |
| 시험시간 60분 (15:00~16:00) for 전산회계 1급, covering 이론 and 실무 together | https://license.kacpta.or.kr/web/info/info_diary.aspx (schedule snippet) | medium. One snippet described it as "60 minutes for theory and 60 for practical", but the schedule table shows a single 60-minute slot |
| 응시자격 제한 없음; 부정행위자 시험 중지/무효 + 2년 응시 제한 | license.kacpta.or.kr (snippet, likely info_outline / Personal.aspx) | snippet |
| 접수수수료 30,000원 (2023년부터), 자격증 발급비 5,000원 | license.kacpta.or.kr snippet | NOT used in meta (not directly confirmed) |
| 이론 15문항 (×2점 = 30점) | not seen on the official page; it matches 30% = 15 × 2 and appears in commercial guides | NOT confirmed officially. totalQuestions=15 is based on this |

- examInfo: totalQuestions 15, choiceCount 4, timeLimitMinutes 20 (described as the site's own 연습용 time, not official), averageScore 70, subjectMinScore null. The description explains the real rule is 이론+실무 합산 70점.
- writtenExam: false, because the exam has no 필기/실기 split. 이론 and 실무 are taken together in one sitting.
- relatedCertIds: [] because computerized-accounting-2 has no folder yet (queue only).

## 기출 이용 조건
- Decision: **이용 조건 불가 → 기출 미수록 (AI 예상문제만)**.
- The official site offers past papers for free download. I could not find any 공공누리 mark or statement allowing commercial reuse or modification.
- 한국세무사회 sites carry a general notice: "한국세무사회의 모든 콘텐츠는 저작권법의 보호를 받는 바, 무단 전재 복사 배포 등을 금합니다." (seen at https://kacpta.or.kr/daejeon/notice/notice_read.asp?notice_idx=2119&board_idx=3&gotopage=35, a regional association page), and a similar notice on edu.kacpta.or.kr: "허락되지 않는 무단 전재, 복사 및 배포를 금지합니다."
- I could not open the official 기출 board page itself (site unreachable), so its exact page-level notice is unverified.

## Law / standards relied on
- 부가가치세법, [시행 2026. 1. 2.]. Full text fetched from law.go.kr (lsInfoR.do, lsiSeq 276117):
  - 제3조 납세의무자; 제5조 과세기간 (간이 1/1~12/31; 일반 1기·2기); 제6조 납세지·하치장; 제8조 사업자등록 20일
  - 제9조·제10조 재화 공급·특례 (면세전용, 개인적 공급 ④, 사업상 증여 ⑤, 폐업 시 잔존재화 ⑥, 담보·사업양도·물납 ⑨); 제12조③ 고용관계 근로
  - 제15조·제16조·제17조 공급시기 (인도 / 역무 완료 / 선발급)
  - 제21조 수출 영세율; 제26조 면세 (미가공 식료품, 수돗물, 연탄, 여객운송 except 항공기·고속버스·택시 등, 도서, 토지 …); 제28조 면세포기 (대상, 3년)
  - 제29조 과세표준 (③ 명목 불문 포함, ⑤ 에누리·환입·파손·보조금·연체이자·할인 제외, ⑥ 장려금·대손금 미공제, ⑦ 110분의 100)
  - 제30조 세율 10%; 제32조 세금계산서 필요적 기재사항·전자세금계산서 (법인); 제34조③ 월합계 다음 달 10일
  - 제38조 공제 매입세액; 제39조 불공제 (1·2·4·5·6 기업업무추진비·7·8 등록 전, 20일 예외); 제45조 대손세액 10/110
  - 제48조 예정신고 25일, ③ 개인 예정고지 50%, 50만원 미만 미징수; 제49조 확정신고 25일, 폐업 시 다음 달 25일
  - 일반과세자 1기·2기 dates: the table did not render in the fetched text. These are standard and widely known; verifier should confirm.
- 일반기업회계기준 (not fetched; from knowledge, verifier should check):
  - 현금성자산 3개월
  - 단기매매증권 취득부대비용 = 비용; 매도가능증권 평가손익 = 기타포괄손익누계액
  - 재고 저가법 평가손실 → 매출원가; 비정상 감모 → 영업외비용
  - 내부창출 영업권 불인정; 무형자산 상각 20년 이내, 정액법 default
  - 충당부채 인식요건; 상품권 매출 at 교환
  - 할부판매 인도시점; 용역 진행기준
- 상법 제458조 이익준비금 (금전배당의 1/10 이상, 자본금 1/2까지, 주식배당 제외). From knowledge, not fetched.

## Files
- /home/user/Test/data/certs/KR/computerized-accounting-1/meta.json
- /home/user/Test/data/certs/KR/computerized-accounting-1/chapters.json
- /home/user/Test/data/certs/KR/computerized-accounting-1/concepts.json (no verifiedAt)
- Draft: /tmp/claude-0/-home-user-Test/3ccf4b69-97d3-57b1-9dec-26abacccd8e6/scratchpad/computerized-accounting-1/draft.json (154 questions; no id / reviewedAt)
- Generator sources: q_fin.py, q_cost.py, q_vat.py, common.py, build.py in the same folder. Choices are written correct-first and then shuffled with seed 20261031. choicesByLevel = answer + the first and second listed distractors.

## Counts (draft.json, 154)
| Subject (questionCount) | basic | intermediate (locked) | advanced (locked) | total |
|---|---|---|---|---|
| financial-accounting (8) | 25 | 33 (2) | 22 (6) | 80 |
| cost-accounting (4) | 10 | 13 (0) | 13 (3) | 36 |
| vat (3) | 11 | 15 (1) | 12 (3) | 38 |
- levelLock total 15. Pools:
  - basic, non-locked: 46
  - basic + intermediate, non-locked: 104
  - intermediate + advanced: 108
- Questions per chapter: 10–14 each, all 13 chapters covered.
- Answer positions: 1:38, 2:35, 3:40, 4:41.
- `questions:add --dry-run`: 154 통과, 0 오류. The dry-run report file was deleted.
- `npm run validate`: passes (데이터 검증 통과 ✓). Questions are not imported yet.
