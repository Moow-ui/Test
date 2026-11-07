# 내용 다듬기 진행 기록

절차: [docs/refine.md](../docs/refine.md). 2026-11-04 시작, 목표 종료 2027-01-31, 최종 기한 2027-02-28.
루틴은 "순서" 표에서 상태가 빈 맨 위 행을 한다. 끝나면 상태 칸에 날짜를 적는다 (`2026-11-04 완료`, `재시도`, `건너뜀: 사유`, `1/2 완료`, `미완료(기한)`).
순서 = 추가한 날이 오래된 것부터, 한국·미국 번갈아. 이 표의 순서·행은 고치지 않는다 (상태 칸만 고친다).
2026-11-07 회장 요청: 컴퓨터활용능력 1급 · 한국사능력검정시험 심화 · 한국사능력검정시험 기본 · AFPK · SQLD · 투자자산운용사 · 신용분석사를 남은 순서의 맨 앞(6~12번)으로 올렸다. 나머지는 원래 순서 그대로다.
새로 추가하는 자격증(2026-11-04 이후)은 처음부터 다듬은 기준으로 만들므로 이 표에 넣지 않는다.

## 이어서 할 작업

(없음)

## 기록

전/후 = `npm run check:unique -- {slug}` 의 (다른 자격증과 같은 문장 / 요점↔개념 정리 겹침 / 글이 짧은 단원 / 함정 있는 단원).

| 날짜 | 자격증 | 전 | 후 | 함정 수 | 검증(문장/통과/뺌) | 비고 |
|---|---|---|---|---|---|---|
| 2026-11-03 | KR forklift-operator | 8 / 14 / 12 / 0 | 7 / 0 / 0 / 12 | 34 | 48 / 48 / 0 (수정 후 통과 1) | 첫 다듬기 (회장 실행 당일, 수동). 그림 보강 안 함. 같은 날 단원 페이지 합치기(mergedAt) 첫 적용: 12단원 모두 /concepts/{단원} 으로 합침, 배포 파일 -12 |
| 2026-11-04 | US dmv-permit-california | 4 / 1 / 5 / 0 | 2 / 0 / 0 / 5 | 15 | 65 / 65 / 0 (수정 후 통과 2) | 새벽 루틴. 5단원 모두 /concepts/{단원} 으로 합침(mergedAt), printable, basisYear 2026. 그림 보강 해당 없음 |
| 2026-11-05 | KR electrician-craftsman | 4 / 8 / 16 / 0 | 4 / 0 / 0 / 17 | 47 | 55 / 55 / 0 | 새벽 루틴. 17단원 모두 /concepts/{단원} 으로 합침(mergedAt), printable. basisYear 확인 안 함. 그림 보강 해당 없음(다음 할 일에 없음) |
| 2026-11-06 | US dmv-permit-texas | 15 / 9 / 5 / 0 | 5 / 0 / 0 / 5 | 15 | 49 / 49 / 0 (수정 후 통과 3) | 새벽 루틴. 5단원 모두 /concepts/{단원} 으로 합침(mergedAt), printable, basisYear 2026(DL-7 Rev. Jan 2026). 문항 laws-licensing-alcohol-0011 해설 범위 좁음 — 오류 발견 기록만. 그림 보강 해당 없음 |
| 2026-11-07 | KR computer-literacy-2 | 1 / 6 / 7 / 0 | 0 / 0 / 0 / 9 | 27 | 41 / 41 / 0 | 새벽 루틴. 9단원 모두 /concepts/{단원} 으로 합침(mergedAt), printable. basisYear 확인 안 함. 개념 정리 1문장(chart-print) 고쳐 그 단원 verifiedAt 갱신. 그림 보강 해당 없음 |

## 순서 (80개)

| # | 나라 | slug | 이름 | 단원 수 | 상태 |
|---|---|---|---|---|---|
| 1 | KR | forklift-operator | 지게차운전기능사 | 12 | 2026-11-03 완료 |
| 2 | US | dmv-permit-california | California DMV Permit Test | 5 | 2026-11-04 완료 |
| 3 | KR | electrician-craftsman | 전기기능사 | 17 | 2026-11-05 완료 |
| 4 | US | dmv-permit-texas | Texas DMV Permit Test | 5 | 2026-11-06 완료 |
| 5 | KR | computer-literacy-2 | 컴퓨터활용능력 2급 | 9 | 2026-11-07 완료 |
| 6 | KR | computer-literacy-1 | 컴퓨터활용능력 1급 | 12 | |
| 7 | KR | korean-history-advanced | 한국사능력검정시험 심화 | 8 | |
| 8 | KR | korean-history-basic | 한국사능력검정시험 기본 | 8 | |
| 9 | KR | afpk | AFPK (재무설계사) | 45 (이틀) | |
| 10 | KR | sqld | SQL 개발자 (SQLD) | 5 | |
| 11 | KR | investment-asset-manager | 투자자산운용사 | 16 | |
| 12 | KR | credit-analyst | 신용분석사 | 11 | |
| 13 | US | dmv-permit-florida | Florida DMV Permit Test | 5 | |
| 14 | US | nasm-cpt | NASM Certified Personal Trainer | 16 | |
| 15 | KR | industrial-safety-engineer | 산업안전기사 | 13 | |
| 16 | US | dmv-permit-new-york | New York DMV Permit Test | 7 | |
| 17 | KR | information-processing-engineer | 정보처리기사 | 16 | |
| 18 | US | esthetician-nic-theory | Esthetician (NIC Theory Exam) | 8 | |
| 19 | KR | electrical-engineer | 전기기사 | 16 | |
| 20 | US | cdl-general-knowledge | CDL General Knowledge Test | 10 | |
| 21 | KR | fire-facility-engineer-electrical | 소방설비기사(전기분야) | 16 | |
| 22 | US | mblex | Massage Therapy Licensing Exam (MBLEx) | 14 | |
| 23 | KR | construction-safety-engineer | 건설안전기사 | 14 | |
| 24 | US | uscis-civics-test | U.S. Citizenship Civics Test | 9 | |
| 25 | KR | driver-license-written | 운전면허 학과시험 | 7 | |
| 26 | US | servsafe-food-handler | ServSafe Food Handler | 5 | |
| 27 | US | notary-california | California Notary Public Exam | 10 | |
| 28 | KR | korean-cuisine-craftsman | 한식조리기능사 | 6 | |
| 29 | US | asvab | ASVAB Practice Test | 12 | |
| 30 | KR | organic-agriculture-craftsman | 유기농업기능사 | 9 | |
| 31 | US | praxis-core | Praxis Core | 11 | |
| 32 | KR | excavator-operator | 굴착기운전기능사 | 11 | |
| 33 | US | cdl-air-brakes | CDL Air Brakes | 4 | |
| 34 | KR | forest-engineer | 산림기사 | 15 | |
| 35 | US | cpa-far | CPA Exam: FAR | 8 | |
| 36 | KR | licensed-real-estate-agent-1 | 공인중개사 1차 | 13 | |
| 37 | US | nclex-rn | NCLEX-RN | 10 | |
| 38 | KR | barista-2 | 바리스타 2급 | 4 | |
| 39 | US | home-inspector-nhie | National Home Inspector Exam (NHIE) | 9 | |
| 40 | KR | word-processor | 워드프로세서 | 11 | |
| 41 | US | dmv-permit-pennsylvania | Pennsylvania DMV Permit Test | 6 | |
| 42 | KR | industrial-safety-industrial-engineer | 산업안전산업기사 | 11 | |
| 43 | US | dmv-permit-illinois | Illinois DMV Permit Test | 6 | |
| 44 | US | dmv-permit-ohio | Ohio DMV Permit Test | 8 | |
| 45 | KR | programming-craftsman | 프로그래밍기능사 | 12 | |
| 46 | US | dmv-permit-georgia | Georgia DMV Permit Test | 8 | |
| 47 | KR | sanitarian | 위생사 | 22 | |
| 48 | US | dmv-permit-north-carolina | North Carolina DMV Permit Test | 9 | |
| 49 | KR | nutritionist | 영양사 | 14 | |
| 50 | US | dmv-permit-michigan | Michigan DMV Permit Test | 9 | |
| 51 | KR | electrical-industrial-engineer | 전기산업기사 | 18 | |
| 52 | US | servsafe-manager | ServSafe Manager | 7 | |
| 53 | KR | adsp | 데이터분석 준전문가 (ADsP) | 8 | |
| 54 | US | ged-math | GED Math | 10 | |
| 55 | US | ged-language-arts | GED Language Arts | 7 | |
| 56 | US | ged-science | GED Science | 12 | |
| 57 | KR | clinical-psychologist-2 | 임상심리사 2급 | 21 | |
| 58 | US | ged-social-studies | GED Social Studies | 16 | |
| 59 | KR | licensed-real-estate-agent-2 | 공인중개사 2차 | 16 | |
| 60 | US | comptia-a-plus | CompTIA A+ | 9 | |
| 61 | KR | baker-craftsman | 제빵기능사 | 6 | |
| 62 | US | comptia-security-plus | CompTIA Security+ | 5 | |
| 63 | KR | confectioner-craftsman | 제과기능사 | 6 | |
| 64 | US | real-estate-salesperson-national | Real Estate Salesperson Exam (National Portion) | 12 | |
| 65 | KR | beautician-general | 미용사(일반) | 12 | |
| 66 | US | cna-nurse-aide | Certified Nursing Assistant (CNA) Exam | 12 | |
| 67 | KR | beautician-skin | 미용사(피부) | 12 | |
| 68 | US | epa-608 | EPA 608 Technician Certification | 12 | |
| 69 | KR | care-worker | 요양보호사 | 12 | |
| 70 | US | aws-cloud-practitioner | AWS Certified Cloud Practitioner | 4 | |
| 71 | KR | social-worker-1 | 사회복지사 1급 | 8 | |
| 72 | US | ati-teas | ATI TEAS | 12 | |
| 73 | KR | computer-graphics-operator | 컴퓨터그래픽기능사 | 7 | |
| 74 | KR | hazardous-materials-craftsman | 위험물기능사 | 11 | |
| 75 | KR | hazardous-materials-industrial-engineer | 위험물산업기사 | 21 | |
| 76 | KR | career-counselor-2 | 직업상담사 2급 | 21 | |
| 77 | KR | beautician-nail | 미용사(네일) | 13 | |
| 78 | KR | beautician-makeup | 미용사(메이크업) | 12 | |
| 79 | KR | architecture-engineer | 건축기사 | 17 | |
| 80 | KR | civil-engineer | 토목기사 | 20 | |
