import { z } from "zod";

/** 시맨틱 버전 형식 (major.minor.patch) */
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

/** "2.4.1" 형태의 버전을 숫자 배열로 바꿔 크기를 비교한다. */
const compareVersion = (left: string, right: string): number => {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    const diff = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (diff !== 0) return diff;
  }

  return 0;
};

export const appVersionSchema = z
  .object({
    platform: z.enum(["IOS", "AOS"], { error: "플랫폼을 선택해 주세요." }),
    latestVersion: z
      .string()
      .min(1, "최신 버전을 입력해 주세요.")
      .regex(VERSION_PATTERN, "1.0.0 형식으로 입력해 주세요."),
    minimumVersion: z
      .string()
      .min(1, "최소 지원 버전을 입력해 주세요.")
      .regex(VERSION_PATTERN, "1.0.0 형식으로 입력해 주세요."),
    isForceUpdate: z.boolean(),
    updateMessage: z
      .string()
      .min(1, "안내 문구를 입력해 주세요.")
      .max(200, "안내 문구는 200자 이내로 입력해 주세요."),
  })
  .refine(
    ({ latestVersion, minimumVersion }) =>
      !VERSION_PATTERN.test(latestVersion) ||
      !VERSION_PATTERN.test(minimumVersion) ||
      compareVersion(minimumVersion, latestVersion) <= 0,
    {
      message: "최소 지원 버전은 최신 버전보다 높을 수 없습니다.",
      path: ["minimumVersion"],
    },
  );

export type AppVersionSchema = z.infer<typeof appVersionSchema>;
