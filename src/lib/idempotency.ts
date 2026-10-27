/**
 * 멱등키 한 개. 같은 키로 다시 보낸 요청은 서버가 첫 결과를 그대로 돌려준다.
 *
 * `crypto.randomUUID`는 **보안 컨텍스트(https · localhost)에서만** 존재한다.
 * 사내망 http나 LAN IP(`http://192.168.x.x:3100`)로 열면 `undefined`라, 그냥 부르면
 * 모달을 그리는 화면 전체가 렌더 중 예외로 죽는다. 그래서 비보안 컨텍스트에서도 되는
 * `getRandomValues`로 만든다. 키의 용도는 중복 요청 식별이라 UUID 형식일 필요는 없다.
 *
 * 영문 · 숫자 · 하이픈만 쓴다(서버 검증 `[A-Za-z0-9-]`, 64자 이하).
 * 접두사를 주면 `접두사-` 뒤에 32자 16진수가 붙는다.
 */
export const createIdempotencyKey = (prefix?: string): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );

  return prefix ? `${prefix}-${hex}` : hex;
};
