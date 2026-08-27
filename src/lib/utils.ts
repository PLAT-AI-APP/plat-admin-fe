// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 숫자에 3자리마다 콤마를 추가하는 함수
 * @param value - 포맷팅할 숫자 또는 숫자형 문자열
 * @returns 콤마가 포함된 문자열 (ex: 1,234,567)
 */
export const formatWithCommas = (value: number | string): string => {
  const num = typeof value === "string" ? Number(value) : value;

  // 숫자가 아니거나 유효하지 않은 값이 들어오면 '0'을 반환
  if (isNaN(num)) return "0";

  return new Intl.NumberFormat("ko-KR").format(num);
};

/**
 * 서비스 언어. 카운트 축약 단위가 언어권마다 다르다.
 *
 * plat-fe의 `AppLocale`과 같은 값을 쓴다. 어드민에는 i18n이 없어 기본은
 * 한국어지만, **세계관·캐릭터 지표는 서비스 화면에 찍히는 숫자와 같아야**
 * 운영자가 "앱에서 본 값"과 대조할 수 있다.
 */
export type CountLocale = "ko" | "en" | "ja" | "zh" | "th" | "vi";

/** 자릿수를 지정해 내림한다. 반올림하면 실제보다 큰 수를 보여 주게 된다. */
const truncateToFixed = (value: number, digits: number) => {
  const factor = 10 ** digits;

  return (Math.floor(value * factor) / factor).toFixed(digits);
};

/**
 * 카운트성 숫자를 축약한다. (대화 수 · 좋아요 수 등)
 *
 * **plat-fe `formatStatCount`와 같은 규칙이다.** 서비스 화면과 어드민이
 * 같은 값을 다르게 보여 주면 "1.2천"과 "1,234" 중 무엇이 맞는지 확인하느라
 * 시간이 든다. 규칙을 바꿀 때는 두 곳을 함께 고친다.
 *
 * - 999 이하는 그대로
 * - 한국어: 천(소수점 한 자리) → 만 → 억
 * - 그 외: K → M → B
 * - 전부 내림
 *
 * 금액·크레딧에는 쓰지 않는다. 정산에 쓰는 숫자는 축약하면 안 된다 —
 * 그쪽은 {@link formatWithCommas}를 쓴다.
 */
export const formatStatCount = (
  count: number,
  locale: CountLocale = "ko",
): string => {
  if (count < 1_000) return count.toString();

  if (locale === "ko") {
    if (count < 10_000) return `${truncateToFixed(count / 1_000, 1)}천`;
    if (count < 100_000_000) return `${Math.floor(count / 10_000)}만`;

    return `${Math.floor(count / 100_000_000)}억`;
  }

  if (count < 10_000) return `${truncateToFixed(count / 1_000, 1)}K`;
  if (count < 1_000_000) return `${Math.floor(count / 1_000)}K`;
  if (count < 1_000_000_000) return `${Math.floor(count / 1_000_000)}M`;

  return `${Math.floor(count / 1_000_000_000)}B`;
};

/**
 * 최소 통화 단위(원) 금액을 표시용 문자열로 변환한다.
 * 관리자에서 다루는 모든 금액은 원 단위 정수다.
 */
export const formatCurrency = (amount: number): string =>
  `${formatWithCommas(amount)}원`;

/** 크레딧은 정수 단위로만 관리한다. */
export const formatCredit = (credit: number): string =>
  `${formatWithCommas(Math.trunc(credit))} CR`;

/** 증감률을 부호가 붙은 문자열로 변환한다. (ex: +12.4%) */
export const formatDelta = (rate: number): string => {
  const sign = rate > 0 ? "+" : "";

  return `${sign}${rate.toFixed(1)}%`;
};

/** 긴 문자열을 말줄임 처리한다. 표 셀에서 주로 사용한다. */
export const truncate = (value: string, maxLength: number): string =>
  value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;

/** 배열 요소를 from → to 위치로 옮긴 새 배열을 반환한다. (드래그 정렬용) */
export const reorder = <T>(items: T[], from: number, to: number): T[] => {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);

  return next;
};

/** 바이트 단위 구간. 1024 기준(KiB)이지만 표기는 관례대로 KB · MB · GB로 쓴다. */
const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/**
 * 바이트를 사람이 읽는 단위로 옮긴다.
 *
 * 소수점 한 자리까지만 둔다. 메모리를 볼 때 알고 싶은 것은 "몇 기가쯤 남았나"이지
 * 바이트 단위의 정확한 값이 아니다.
 */
export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const exponent = Math.min(
    BYTE_UNITS.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / 1024 ** exponent;

  // B 단위는 소수점이 의미 없다. 512.0 B 는 읽는 사람을 멈칫하게 한다.
  return `${exponent === 0 ? value : value.toFixed(1)} ${BYTE_UNITS[exponent]}`;
};
