/**
 * 응원하기(후원) 설정 — 송금 정보는 여기 한 곳에만 둔다.
 * 계좌나 링크가 바뀌면 이 파일만 고친다.
 *
 * 계좌번호만으로는 돈을 빼 갈 수 없다. 혹시 계좌가 묶여도 생활에 지장이 없도록 잘 쓰지 않는 계좌를 쓴다 (2026-11-07 회장 결정).
 */
export const SUPPORT = {
  bank: { ko: "토스뱅크", en: "Toss Bank (Korea)" },
  /** 화면에 보이는 모양 */
  accountDisplay: "1000-1605-6121",
  /** [복사]로 복사되는 값 (은행 앱에 붙여 넣기 좋게 숫자만) */
  accountCopy: "100016056121",
  /** 화면에 보이는 예금주 (가운데 글자를 가린다. 송금 앱에서는 은행이 실제 이름을 보여 준다) */
  holder: "김*무",
  /** 토스 앱의 송금 화면을 바로 여는 주소 (토스 QR 에 들어 있는 주소 그대로). 토스가 깔린 휴대폰에서만 열린다 */
  tossUrl:
    "supertoss://send?amount=0&bank=%ED%86%A0%EC%8A%A4%EB%B1%85%ED%81%AC&accountNo=100016056121&origin=qr",
  /** 카카오페이 송금 링크 (카카오페이 QR 에 들어 있는 주소 그대로) */
  kakaoPayUrl: "https://qr.kakaopay.com/FMaS7r91Y",
} as const;
