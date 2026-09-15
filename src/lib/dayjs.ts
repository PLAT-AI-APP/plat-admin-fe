import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";

dayjs.extend(relativeTime);
dayjs.locale("ko");

export default dayjs;

/** 표 · 상세에서 쓰는 기본 일시 표기 (ex: 2026.05.01 21:32) */
export const formatDateTime = (value?: string | number | Date | null): string =>
  value ? dayjs(value).format("YYYY.MM.DD HH:mm") : "-";

/** 날짜만 필요한 경우 (ex: 2026.05.01) */
export const formatDate = (value?: string | number | Date | null): string =>
  value ? dayjs(value).format("YYYY.MM.DD") : "-";

/** 상세 히어로처럼 좁은 자리에 쓰는 짧은 날짜 (ex: 26.05.01) */
export const formatShortDate = (value?: string | number | Date | null): string =>
  value ? dayjs(value).format("YY.MM.DD") : "-";

/** 초 단위까지 필요한 로그 · 장부용 표기 */
export const formatDateTimeSecond = (
  value?: string | number | Date | null,
): string => (value ? dayjs(value).format("YYYY.MM.DD HH:mm:ss") : "-");

/** 상대 시간 표기 (ex: 3시간 전) */
export const formatFromNow = (value?: string | number | Date | null): string =>
  value ? dayjs(value).fromNow() : "-";

/** input[type=date] 바인딩용 값 */
export const toDateInputValue = (
  value?: string | number | Date | null,
): string => (value ? dayjs(value).format("YYYY-MM-DD") : "");
