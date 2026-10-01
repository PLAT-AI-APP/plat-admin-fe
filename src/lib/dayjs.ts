import dayjs, { type Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/ko";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale("ko");

/**
 * 콘솔의 기준 시간대. **브라우저 시간대가 아니라 한국 시간으로 고정한다.**
 *
 * 서버의 일자 집계 · 필터 · 보존 기한은 모두 KST 날짜 기준이다. 화면이 브라우저 시간대를
 * 따르면 해외 출장 중이거나 OS 시간대가 UTC 인 운영자는 날짜가 하루씩 밀린 표를 보고,
 * "오늘" 필터가 서버의 오늘과 다른 날을 부른다.
 */
export const KST = "Asia/Seoul";

export default dayjs;

type DateInput = string | number | Date | null | undefined;

/** 시각이 없는 날짜(`2026-05-01`). 이미 KST 날짜라 시간대를 옮기면 하루가 밀릴 수 있다. */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** 값을 한국 시간으로 읽는다. 날짜만 있는 문자열은 그 날짜의 KST 자정으로 본다. */
export const toKst = (value?: DateInput): Dayjs => {
  if (typeof value === "string" && DATE_ONLY.test(value)) {
    return dayjs.tz(value, KST);
  }

  const parsed = value === undefined ? dayjs() : dayjs(value ?? undefined);

  /* 잘못된 값에 tz 를 걸면 예외가 난다. 그대로 돌려 format 이 'Invalid Date' 를 내게 둔다. */
  return parsed.isValid() ? parsed.tz(KST) : parsed;
};

/** 지금(KST). */
export const nowKst = (): Dayjs => dayjs().tz(KST);

/**
 * 시간대 없는 입력값(`input[type=date]` · `datetime-local`)을 **KST 로** 읽는다.
 * 화면이 KST 로 보여 주므로 입력도 KST 로 받아야 운영자가 본 시각과 보낸 시각이 같다.
 */
export const parseKst = (value: string): Dayjs => dayjs.tz(value, KST);

/** 표 · 상세에서 쓰는 기본 일시 표기 (ex: 2026.05.01 21:32) */
export const formatDateTime = (value?: DateInput): string =>
  value ? toKst(value).format("YYYY.MM.DD HH:mm") : "-";

/** 날짜만 필요한 경우 (ex: 2026.05.01) */
export const formatDate = (value?: DateInput): string =>
  value ? toKst(value).format("YYYY.MM.DD") : "-";

/** 상세 히어로처럼 좁은 자리에 쓰는 짧은 날짜 (ex: 26.05.01) */
export const formatShortDate = (value?: DateInput): string =>
  value ? toKst(value).format("YY.MM.DD") : "-";

/** 초 단위까지 필요한 로그 · 장부용 표기 */
export const formatDateTimeSecond = (value?: DateInput): string =>
  value ? toKst(value).format("YYYY.MM.DD HH:mm:ss") : "-";

/** 상대 시간 표기 (ex: 3시간 전) */
export const formatFromNow = (value?: DateInput): string =>
  value ? dayjs(value).fromNow() : "-";

/** input[type=date] 바인딩용 값. KST 날짜다. */
export const toDateInputValue = (value?: DateInput): string =>
  value ? toKst(value).format("YYYY-MM-DD") : "";

/** 오늘(KST) 날짜. 기간 필터 기본값에 쓴다. */
export const todayKst = (): string => nowKst().format("YYYY-MM-DD");

/** 오늘(KST)부터 목표 날짜까지 남은 일수. 음수면 지났다. */
export const daysLeftKst = (value: DateInput): number =>
  toKst(value).startOf("day").diff(nowKst().startOf("day"), "day");
