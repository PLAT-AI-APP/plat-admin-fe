import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";
import type {
  ContentReviewFindingField,
  ContentReviewTargetType,
  ContentReviewTask,
} from "@/type/contentReview";
import { findUniverseTitle } from "./reviewFields";

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

/** 세계관 검수에 딸려 오는 이미지의 자리. 어느 그림인지 알아야 등급을 판단할 수 있다. */
export const IMAGE_FILE_TYPE_LABEL: Record<string, string> = {
  UNIVERSE_PROFILE: "대표 이미지",
  CHARACTER_PROFILE: "캐릭터",
  UNIVERSE_ASSET: "에셋",
};

/**
 * 이미지 검수 작업의 대상 원본. 이미지 단독 작업은 보통 한 장만 오지만,
 * 대상 ID와 맞춰 찾아 두면 서버가 검수 입력에 부가 이미지를 넣어도 엉뚱한
 * 미리보기를 보여 주지 않는다. 파일 ID가 빠진 구형 응답은 한 장짜리 입력을
 * 보여 주기 위해 첫 이미지를 보조값으로 쓴다.
 */
export const taskTargetImage = (task: ContentReviewTask) => {
  if (task.targetType !== "FILE") return undefined;

  return (
    task.input.images.find((image) => image.fileId === task.targetId) ??
    task.input.images[0]
  );
};

/** 이미지 역할을 알 수 없을 때도 파일 번호 대신 일관된 이름을 쓴다. */
export const imageFileTypeLabel = (fileType?: string) =>
  (fileType && IMAGE_FILE_TYPE_LABEL[fileType]) ?? "이미지";

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

/**
 * 목록에 보일 대상 이름. 한국어 입력을 먼저 쓰고, 이미지는 용도로 부른다.
 * 세계관은 `texts`가 비어 오고 제목이 `fields`에 있다.
 */
export const taskTitle = (task: ContentReviewTask) => {
  const universeTitle = task.targetType === "UNIVERSE" ? findUniverseTitle(task.input) : undefined;
  if (universeTitle) return universeTitle;
  if (task.targetType === "FILE") return imageFileTypeLabel(taskTargetImage(task)?.fileType);
  const texts = task.input.texts;
  const text = texts.find((each) => each.language === "KO") ?? texts[0];
  if (text?.name) return text.name;
  return `${TARGET_TYPE_LABEL[task.targetType]} ${task.targetId}`;
};

/**
 * 관리자가 승인 · 반려할 수 있는가. 서버 규칙과 같게 둔다.
 * 이미지는 등급이 확정되면 그 등급으로 승인된 세계관과 어긋나므로 관리자 확인 대기 건만 판정한다.
 * 검수 중인 건은 AI 결과와 엇갈리지 않게 막는다.
 */
export const canDecide = (task: ContentReviewTask) => {
  if (task.superseded || task.jobStatus === "RUNNING") return false;
  if (task.targetType === "FILE") {
    return task.jobStatus === "MANUAL" && task.reviewStatus === "PENDING";
  }
  return true;
};

/** AI 재검수를 요청할 수 있는가. 이미지는 연결 세계관 재검수로만 다시 본다. 이미 대기 · 진행 중인 건은 뺀다. */
export const canRetry = (task: ContentReviewTask) =>
  !task.superseded &&
  task.targetType !== "FILE" &&
  (task.jobStatus === "MANUAL" || task.jobStatus === "COMPLETED");

/** 대상 상세로 가는 주소. 세계관만 관리자 화면 ID 와 검수 대상 ID 가 같다. */
export const taskTargetHref = (task: ContentReviewTask) =>
  task.targetType === "UNIVERSE" ? `/universes/${task.targetId}` : undefined;
