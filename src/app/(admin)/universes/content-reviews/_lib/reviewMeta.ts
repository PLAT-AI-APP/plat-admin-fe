import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";
import type {
  ContentReviewFindingField,
  ContentReviewTargetType,
  ContentReviewTask,
} from "@/type/contentReview";

/** 콘텐츠 검수 화면에서만 쓰는 라벨 · 계산. */

export const TARGET_TYPE_LABEL: Record<ContentReviewTargetType, string> = {
  UNIVERSE: "세계관",
  FILE: "이미지",
  CHARACTER: "캐릭터",
  UNIVERSE_CHARACTER: "세계관 캐릭터",
};

export const TARGET_TYPE_OPTIONS: SelectOption<ContentReviewTargetType | "">[] = [
  { label: "전체 대상", value: "" },
  { label: "세계관", value: "UNIVERSE" },
  { label: "이미지", value: "FILE" },
  { label: "캐릭터", value: "CHARACTER" },
  { label: "세계관 캐릭터", value: "UNIVERSE_CHARACTER" },
];

export const FINDING_FIELD_LABEL: Record<ContentReviewFindingField, string> = {
  NAME: "이름",
  DESCRIPTION: "소개",
  DETAIL_SETTING: "상세 설정",
  UNIVERSE: "세계관",
  CHARACTER: "캐릭터",
  SCENARIO: "시나리오",
  ASSET: "에셋",
  MULTIPLE: "여러 항목",
};

/** 수동 판정은 `adminId`가 아니라 이 코드로 가린다. AI 재검수 요청자도 `adminId`를 남긴다. */
export const isManualDecision = (task: ContentReviewTask) =>
  task.reasonCode === "MANUAL_APPROVAL" || task.reasonCode === "MANUAL_REJECTION";

/**
 * 행의 상태 뱃지. 작업 진행(`jobStatus`)과 판정(`reviewStatus`)을 한 칸으로 합친다.
 * 관리자 확인 필요(MANUAL)는 반려처럼 보이지 않게 경고색으로 둔다.
 */
export const taskStatusBadge = (task: ContentReviewTask): { label: string; tone: BadgeTone } => {
  if (task.jobStatus === "READY") return { label: "자동 검수 대기", tone: "neutral" };
  if (task.jobStatus === "RUNNING") return { label: "검수 중", tone: "info" };
  if (task.jobStatus === "MANUAL") return { label: "관리자 확인 필요", tone: "warning" };
  if (task.reviewStatus === "REJECTED") return { label: "반려", tone: "danger" };
  return { label: "승인", tone: "success" };
};

/** 목록에 보일 대상 이름. 한국어 입력을 먼저 쓰고, 이미지는 파일 ID 로 부른다. */
export const taskTitle = (task: ContentReviewTask) => {
  const texts = task.input.texts;
  const text = texts.find((each) => each.language === "KO") ?? texts[0];
  if (text?.name) return text.name;
  if (task.targetType === "FILE") return `이미지 ${task.targetId}`;
  return `${TARGET_TYPE_LABEL[task.targetType]} ${task.targetId}`;
};

/** 대상 상세로 가는 주소. 세계관만 관리자 화면 ID 와 검수 대상 ID 가 같다. */
export const taskTargetHref = (task: ContentReviewTask) =>
  task.targetType === "UNIVERSE" ? `/universes/${task.targetId}` : undefined;
