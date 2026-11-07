/**
 * 응원하기(후원) 설정 — 송금 정보는 여기 한 곳에만 둔다.
 * 계좌나 링크가 바뀌면 이 파일만 고치고, QR 그림(public/support/*.svg)도 새로 만든다.
 *
 * 계좌번호만으로는 돈을 빼 갈 수 없다. 혹시 계좌가 묶여도 생활에 지장이 없도록 잘 쓰지 않는 계좌를 쓴다 (2026-11-07 회장 결정).
 */
export const SUPPORT = {
  bank: { ko: "토스뱅크", en: "Toss Bank (Korea)" },
  /** 화면에 보이는 모양 */
  accountDisplay: "1000-1605-6121",
  /** [복사]로 복사되는 값 (은행 앱에 붙여 넣기 좋게 숫자만) */
  accountCopy: "100016056121",
  /** 예금주 (송금 앱에 그대로 이 이름이 보인다) */
  holder: "김건무",
  /** 토스 앱을 바로 여는 주소. 토스가 깔린 휴대폰에서만 열린다 (PC 에서는 QR 그림을 보여 준다) */
  tossUrl:
    "supertoss://send?amount=0&bank=%ED%86%A0%EC%8A%A4%EB%B1%85%ED%81%AC&accountNo=100016056121&origin=qr",
  /** 카카오페이 송금 링크 (휴대폰·PC 모두 열린다) */
  kakaoPayUrl: "https://qr.kakaopay.com/FMaS7r91Y",
  /** 위 두 주소를 그대로 담은 QR 그림 (PC 에서 휴대폰 카메라로 찍는다) */
  tossQr: "/support/toss-qr.svg",
  kakaoPayQr: "/support/kakaopay-qr.svg",
} as const;
