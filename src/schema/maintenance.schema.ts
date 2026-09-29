import { z } from "zod";

/**
 * 점검 예약 폼.
 *
 * 소프트 종료 시작과 점검 시작(완전 종료)을 둘 다 날짜로 받으면 순서를 뒤집기 쉽다. 시작만 날짜로 받고,
 * 점검 시작은 "소프트 종료를 몇 분 둘지"로 받는다. 결제창을 연 사람을 위해 10분 이상을 권한다.
 */
export const maintenanceScheduleSchema = z
  .object({
    startMode: z.enum(["NOW", "SCHEDULED"]),
    /** datetime-local 값(브라우저 시간대). startMode 가 SCHEDULED 일 때만 쓴다. */
    drainStartsAt: z.string(),
    drainMinutes: z
      .number({ message: "숫자로 입력해 주세요." })
      .int("분 단위로 입력해 주세요.")
      .min(1, "1분 이상이어야 합니다.")
      .max(180, "3시간 이내로 입력해 주세요."),
    /** 안내용 예상 종료. 비워도 된다. */
    expectedEndsAt: z.string(),
    message: z.string().trim().max(500, "안내 문구는 500자 이내입니다."),
  })
  .superRefine((values, context) => {
    if (values.startMode === "SCHEDULED") {
      if (!values.drainStartsAt) {
        context.addIssue({
          code: "custom",
          path: ["drainStartsAt"],
          message: "시작 시각을 골라 주세요.",
        });
      } else if (new Date(values.drainStartsAt).getTime() <= Date.now()) {
        context.addIssue({
          code: "custom",
          path: ["drainStartsAt"],
          message: "지금 이후 시각을 골라 주세요.",
        });
      }
    }
  });

export type MaintenanceScheduleSchema = z.infer<
  typeof maintenanceScheduleSchema
>;
