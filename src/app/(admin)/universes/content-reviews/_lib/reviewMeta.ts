import type { BadgeTone } from "@/components/ui/Badge";
import type { SelectOption } from "@/components/ui/Select";
import type {
  ContentReviewAttemptOutcome,
  ContentReviewFindingField,
  ContentReviewTargetType,
  ContentReviewTask,
  ReviewProcessorState,
  ReviewProcessorType,
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
  USER_PROFILE: "사용자 프로필",
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

/** 본문 승인 뒤 연결 이미지 때문에 공개가 막힌 세계관(`imageHoldCode`). */
const IMAGE_HOLD_BADGE: Record<string, { label: string; tone: BadgeTone }> = {
  IMAGE_PENDING: { label: "이미지 검수 대기", tone: "neutral" },
  IMAGE_REJECTED: { label: "이미지 반려", tone: "danger" },
  ADULT_SETTING_REQUIRED: { label: "성인 설정 필요", tone: "warning" },
};

/**
 * 행의 상태 뱃지. 작업 진행(`jobStatus`)과 판정(`reviewStatus`)을 한 칸으로 합친다.
 * 관리자 확인 필요(MANUAL)는 반려처럼 보이지 않게 경고색으로 둔다.
 */
export const taskStatusBadge = (task: ContentReviewTask): { label: string; tone: BadgeTone } => {
  // 본문은 승인됐어도 연결 이미지가 막으면 공개되지 않는다. 승인으로 보이면 안 된다.
  if (task.reviewStatus === "APPROVED" && task.imageHoldCode) {
    return IMAGE_HOLD_BADGE[task.imageHoldCode] ?? { label: "이미지 확인 필요", tone: "warning" };
  }
  if (task.jobStatus === "READY") return { label: "자동 검수 대기", tone: "neutral" };
  if (task.jobStatus === "RUNNING") return { label: "검수 중", tone: "info" };
  if (task.jobStatus === "MANUAL") return { label: "관리자 확인 필요", tone: "warning" };
  if (task.reviewStatus === "REJECTED") {
    // 이미지는 AI 가 확실한 위반을 직접 반려한다. 제작자가 이의 신청할 수 있어 관리자 반려와 나눠 보인다.
    return { label: isManualDecision(task) ? "반려" : "AI 반려", tone: "danger" };
  }
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

/** 관제 화면의 워커 칩. 꺼짐은 설정이라 회색, 프롬프트 없음은 운영 누락이라 빨강이다. */
export const PROCESSOR_LABEL: Record<ReviewProcessorType, string> = {
  UNIVERSE: "세계관",
  FILE: "이미지",
  CHARACTER: "캐릭터",
};

export const PROCESSOR_STATE_META: Record<
  ReviewProcessorState,
  { label: string; dotClass: string; textClass: string }
> = {
  READY: { label: "정상", dotClass: "bg-success", textClass: "text-success" },
  DISABLED: { label: "꺼짐", dotClass: "bg-font-disabled", textClass: "text-font-2" },
  NO_PROMPT: { label: "프롬프트 없음", dotClass: "bg-danger", textClass: "text-danger" },
};

/** AI 장애로 넘어온 건. 사람이 보지 않아도 AI 에 다시 맡기면 된다. 어떤 사유가 장애인지는 서버가 정한다. */
export const isAiFailure = (task: ContentReviewTask) => task.reasonGroup === "AI_FAILURE";

/** 관리자 확인 대기로 넘긴 이유. 모르는 코드는 코드 그대로 보여 준다. */
export const MANUAL_REASON_LABEL: Record<string, string> = {
  RETRY_EXHAUSTED: "AI 응답 실패 3회",
  PROVIDER_FAILED: "AI 응답 실패",
  INPUT_CHANGED: "검수 중 내용 바뀜",
  DECISION_REJECTED: "공개 부적합 의심",
  DECISION_REFUSED: "AI 가 판정 거부",
  DECISION_LOW_CONFIDENCE: "판정 확신 낮음",
  ADULT_RATING_UNCERTAIN: "성인 등급 불확실",
  ADULT_SETTING_REQUIRED: "성인 설정 필요",
  OTHER_UNCERTAIN: "판단 불확실",
  IMAGE_EXPLICIT_SEXUAL: "노골적 성적 이미지 의심",
  IMAGE_GRAPHIC_VIOLENCE: "잔혹 폭력 의심",
  IMAGE_MINOR_SEXUAL: "미성년 성적 묘사 의심",
  IMAGE_UNCERTAIN: "이미지 판단 불확실",
  IMAGE_REFUSED: "AI 가 이미지 판정 거부",
  IMAGE_REVIEW_PENDING: "연결 이미지 검수 대기",
  IMAGE_REVIEW_BLOCKED: "연결 이미지 미통과",
  USER_APPEAL: "사용자 이의 신청",
  MANUAL_APPROVAL: "관리자 승인",
  MANUAL_REJECTION: "관리자 반려",
};

export const manualReasonLabel = (task: ContentReviewTask) =>
  task.manualRequired && !task.reasonCode
    ? "관리자 확인 필수"
    : (task.reasonCode && MANUAL_REASON_LABEL[task.reasonCode]) ?? task.reasonCode ?? "-";

/**
 * 시도 로그의 오류 코드. 서버 `AiErrorCode` · 파일 오류는 이름 그대로, 그 밖의 예외는 클래스 이름으로 온다.
 * 아는 것만 우리말로 바꾸고 나머지는 "AI 호출 실패"로 묶는다(원래 코드는 옆에 함께 보인다).
 */
export const ATTEMPT_ERROR_LABEL: Record<string, string> = {
  AI_PROVIDER_TIMEOUT: "응답 시간 초과",
  AI_PROVIDER_RATE_LIMITED: "요청 한도 초과",
  AI_PROVIDER_QUOTA_EXHAUSTED: "사용 한도 소진",
  AI_PROVIDER_AUTH_FAILED: "AI 키 인증 실패",
  AI_PROVIDER_MODEL_UNAVAILABLE: "모델 사용 불가",
  AI_PROVIDER_OVERLOADED: "제공사 과부하",
  AI_PROVIDER_REFUSED: "제공사 응답 거부",
  AI_PROVIDER_FAILED: "AI 응답 오류",
  FILE_READ_FAILED: "이미지 읽기 실패",
  FILE_NOT_FOUND: "이미지 파일 없음",
};

export const attemptErrorLabel = (code: string | null) =>
  code ? ATTEMPT_ERROR_LABEL[code] ?? "AI 호출 실패" : "AI 호출 실패";

/** 시도 한 번의 결과. 실패는 오류 라벨로 대신 보여 준다. */
export const ATTEMPT_OUTCOME_LABEL: Record<ContentReviewAttemptOutcome, string> = {
  APPROVED: "승인",
  REJECTED: "반려",
  MANUAL: "관리자 이관",
  FAILED: "실패",
  STALE: "검수 중 내용 바뀜",
};

/** 6200 → "6.2초", 65000 → "1분 5초" */
export const formatDurationMs = (ms: number | null | undefined) => {
  if (ms === null || ms === undefined) return "-";
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}초`;
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
};

/** 기다린 시간. 분 단위로 충분하고, 하루를 넘기면 일로 묶는다. */
export const formatWaited = (from: string | null, now = Date.now()) => {
  if (!from) return "-";
  const minutes = Math.max(0, Math.floor((now - new Date(from).getTime()) / 60_000));
  if (minutes < 1) return "1분 미만";
  if (minutes < 60) return `${minutes}분`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`;
  return `${Math.floor(minutes / 1440)}일 ${Math.floor((minutes % 1440) / 60)}시간`;
};

/** 실행 경과. 슬롯 칸에서 1초마다 바뀐다. */
export const formatElapsed = (from: string, now: number) => {
  const seconds = Math.max(0, Math.floor((now - new Date(from).getTime()) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};

/** 세계관 검수 이력 화면 주소 */
export const universeHistoryHref = (universeId: string) =>
  `/universes/content-reviews/universes/${universeId}`;
