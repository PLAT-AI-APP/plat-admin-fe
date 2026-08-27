"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUniverseDetailQuery } from "@/api/universe/getUniverseDetail";
import {
  showUniverseErrorToast,
  useUniverseMutation,
  type UniversePatchBody,
} from "@/api/universe/mutateUniverse";
import { ChevronRight } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { resolveImageUrl } from "@/lib/imageUrl";
import { cn, formatStatCount, formatWithCommas } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import { universeBlockReason, type UniverseDetail } from "@/type/character";
import {
  universeRejectSchema,
  type UniverseRejectSchema,
} from "@/schema/universe.schema";
import BackLink from "@/components/layout/BackLink";
import PageHeader from "@/components/layout/PageHeader";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Dropdown from "@/components/ui/Dropdown";
import EmptyState from "@/components/ui/EmptyState";
import EntityImage from "@/components/ui/EntityImage";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import Textarea from "@/components/ui/Textarea";
import UniverseAssetGallery from "./UniverseAssetGallery";
import UniverseScenarioPanel from "./UniverseScenarioPanel";
import UniverseSettingsModal, {
  type UniverseSettingsMode,
} from "./UniverseSettingsModal";
import UniverseTranslationPanel from "./UniverseTranslationPanel";
import { buildUniverseActions } from "./universeActions";
import {
  creatorGradeLabel,
  creatorStatusLabel,
  creatorStatusTone,
  isRiskyCreatorStatus,
  purgeCountdown,
  universeTitleOf,
} from "./universeMeta";
import {
  UNIVERSE_CATEGORY_LABEL,
  UNIVERSE_REVIEW_LABEL,
  UNIVERSE_REVIEW_TONE,
  UNIVERSE_STATUS_LABEL,
  UNIVERSE_STATUS_TONE,
  UNIVERSE_TENDENCY_LABEL,
  UNIVERSE_VISIBILITY_LABEL,
  UNIVERSE_VISIBILITY_TONE,
} from "../../_constants/character";

interface UniverseDetailViewProps {
  universeId: string;
}

/** 세계관 지표 한 칸. 축약값 아래에 원값을 남겨 대조할 수 있게 한다. */
const StatBox = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-field border border-border-main px-3 py-2.5">
    <p className="caption-1 text-font-2">{label}</p>
    <p className="mt-1 title-4 text-font-1 tabular-nums">{value}</p>
    {hint && <p className="caption-3 text-font-2 tabular-nums">{hint}</p>}
  </div>
);

/**
 * 세계관 상세 · 운영 콘솔.
 *
 * 조회만 하던 화면을 심사·상태·분류·댓글 조치와 번역·에셋·시나리오 검수까지
 * 하는 운영 화면으로 넓혔다. 화면의 목적은 두 가지다.
 *
 * - **판단에 필요한 것을 실제로 보여 준다.** 이미지(대표·에셋·캐릭터)를 원본
 *   경로로 그리고, 비어 있는 번역까지 드러내고, 회차 본문을 언어별로 대조한다.
 * - **판단한 것을 바로 조치한다.** 서버가 받는 값(심사·상태·공개 범위·장르·성향·
 *   댓글)은 전부 헤더 드롭다운에서 처리한다.
 *
 * 삭제·파기 복구는 서버에 엔드포인트가 없어 다루지 않는다. 복구 요청은 파기
 * 전까지만 의미가 있으므로 남은 기간을 D-day로 함께 보여 준다.
 */
const UniverseDetailView = ({ universeId }: UniverseDetailViewProps) => {
  const { data, isError } = useUniverseDetailQuery(universeId);
  const { patchMutation, reviewMutation } = useUniverseMutation();
  const [isRejectOpen, setRejectOpen] = useState(false);
  const [settingsMode, setSettingsMode] = useState<UniverseSettingsMode | null>(
    null,
  );

  // 조치는 전부 같은 한 건을 고친다. 하나가 날아가는 동안 나머지도 잠근다.
  const isBusy = patchMutation.isPending || reviewMutation.isPending;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UniverseRejectSchema>({
    resolver: zodResolver(universeRejectSchema),
    defaultValues: { reason: "" },
  });

  const runReview = (
    body: { reviewStatus: "APPROVED" | "PENDING" | "REJECTED"; reason?: string },
    message: string,
  ) =>
    reviewMutation.mutate(
      { universeId, body, message },
      { onError: (error) => showUniverseErrorToast(error) },
    );

  const runPatch = (
    body: UniversePatchBody,
    message: string,
    onDone?: () => void,
  ) =>
    patchMutation.mutate(
      { universeId, body, message },
      {
        onSuccess: () => onDone?.(),
        onError: (error) => showUniverseErrorToast(error),
      },
    );

  const actions = data
    ? buildUniverseActions({
        universe: data,
        isBusy,
        onApproveReview: () =>
          runReview({ reviewStatus: "APPROVED" }, "심사를 승인했습니다."),
        onRejectReview: () => {
          reset({ reason: "" });
          setRejectOpen(true);
        },
        onRequestReview: () =>
          openConfirm({
            title: "심사를 되돌릴까요?",
            description:
              "심사 대기로 되돌아가고 반려 사유도 함께 지워집니다. 잘못 승인·반려한 것을 무를 때 사용하세요.",
            confirmText: "되돌리기",
            onConfirm: () =>
              runReview({ reviewStatus: "PENDING" }, "심사를 되돌렸습니다."),
          }),
        onActivate: () =>
          runPatch({ status: "ACTIVE" }, "세계관을 활성화했습니다."),
        onDeactivate: () =>
          openConfirm({
            title: "세계관을 비활성화할까요?",
            description:
              "앱에서 즉시 내려갑니다. 콘텐츠는 지워지지 않고 언제든 다시 활성화할 수 있습니다.",
            confirmText: "비활성화",
            tone: "danger",
            onConfirm: () =>
              runPatch({ status: "INACTIVE" }, "세계관을 비활성화했습니다."),
          }),
        onChangeVisibility: () => setSettingsMode("visibility"),
        onChangeClassification: () => setSettingsMode("classification"),
        onToggleComment: (next) => {
          if (next) {
            runPatch({ commentEnabled: true }, "댓글을 다시 허용했습니다.");

            return;
          }

          openConfirm({
            title: "댓글을 강제로 중지할까요?",
            description:
              "기존 댓글은 남고 새 댓글만 막힙니다. 댓글 사고 대응에 사용하세요.",
            confirmText: "댓글 중지",
            tone: "danger",
            onConfirm: () =>
              runPatch({ commentEnabled: false }, "댓글을 강제 중지했습니다."),
          });
        },
      })
    : [];

  const onReject = handleSubmit((values) => {
    runReview(
      { reviewStatus: "REJECTED", reason: values.reason },
      "심사를 반려했습니다.",
    );
    setRejectOpen(false);
  });

  const onChangeSettings = (body: UniversePatchBody) => {
    const message =
      body.visibility !== undefined
        ? `공개 범위를 ${UNIVERSE_VISIBILITY_LABEL[body.visibility]}(으)로 바꿨습니다.`
        : "장르 · 성향을 바꿨습니다.";

    runPatch(body, message, () => setSettingsMode(null));
  };

  const blockReason = data ? universeBlockReason(data) : undefined;
  const countdown = data ? purgeCountdown(data.purgeAt) : undefined;
  const isCreatorRisky = data ? isRiskyCreatorStatus(data.creator.status) : false;

  return (
    <>
      <BackLink href="/universes" label="세계관" />

      <PageHeader
        title={data ? universeTitleOf(data) : "세계관 상세"}
        description={data ? `#${data.universeId}` : undefined}
        action={data ? <Dropdown items={actions} /> : undefined}
      />

      {/*
        세 갈래 중 하나는 반드시 그린다. `isLoading`만 보면 조회가 실패한 뒤
        재시도가 대기(paused)하는 동안 로딩도 에러도 아닌 상태가 되어 화면이
        통째로 빈다. 운영자는 그때 무엇이 잘못됐는지 알 수 없다.
      */}
      {!data && !isError && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      )}

      {isError && (
        <Card>
          <EmptyState
            title="세계관을 찾을 수 없습니다."
            description="이미 삭제되었거나 잘못된 주소일 수 있습니다."
          />
        </Card>
      )}

      {data && (
        <>
          {/*
            정지·회수된 크리에이터의 세계관은 심사를 통과시켜도 계정 쪽 조치로
            다시 내려갈 수 있다. 승인 버튼을 누르기 전에 보이는 자리에 둔다.
          */}
          {isCreatorRisky && (
            <Alert tone="warning" title="정지된 크리에이터의 세계관입니다">
              소유 크리에이터가 {creatorStatusLabel(data.creator.status)} 상태입니다.
              심사를 승인해도 계정 조치로 다시 내려갈 수 있으니, 계정 상태를 먼저
              확인하세요.
            </Alert>
          )}

          <Card>
            <div className="flex gap-4">
              <EntityImage
                src={resolveImageUrl(
                  data.profileImageUrl,
                  data.profileImageFileId,
                  "UNIVERSE_PROFILE",
                  "SQ140",
                )}
                alt={universeTitleOf(data)}
                fileId={data.profileImageFileId}
                ratio="square"
                className="w-28 shrink-0"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={UNIVERSE_STATUS_TONE[data.status]}>
                    {UNIVERSE_STATUS_LABEL[data.status]}
                  </Badge>
                  <Badge tone={UNIVERSE_VISIBILITY_TONE[data.visibility]}>
                    {UNIVERSE_VISIBILITY_LABEL[data.visibility]}
                  </Badge>
                  <Badge tone={UNIVERSE_REVIEW_TONE[data.reviewStatus]}>
                    {UNIVERSE_REVIEW_LABEL[data.reviewStatus]}
                  </Badge>
                  <Badge tone="neutral">
                    {UNIVERSE_CATEGORY_LABEL[data.category]}
                  </Badge>
                  <Badge tone="neutral">
                    {UNIVERSE_TENDENCY_LABEL[data.tendency]}
                  </Badge>
                  {!data.commentEnabled && (
                    <Badge tone="neutral">댓글 미사용</Badge>
                  )}
                </div>

                {/* 왜 앱에 안 보이는지를 뱃지 조합 대신 한 줄로 명시한다. */}
                {blockReason ? (
                  <p className="mt-2.5 body-5 text-warning">
                    현재 앱에 노출되지 않습니다 · 사유: {blockReason}
                  </p>
                ) : (
                  <p className="mt-2.5 body-5 text-success">
                    앱에 정상 노출 가능한 상태입니다.
                  </p>
                )}

                <p className="mt-2 body-6 text-font-2 tabular-nums">
                  등록 {formatDateTime(data.createdAt)}
                  {data.updatedAt && ` · 수정 ${formatDateTime(data.updatedAt)}`}
                </p>
              </div>
            </div>

            {/* 심사 반려 사유는 크리에이터 문의로 이어지므로 눈에 띄게 둔다. */}
            {data.reviewStatus === "REJECTED" && data.reviewRejectionReason && (
              <Alert tone="danger" title="심사 반려" className="mt-4">
                {data.reviewRejectionReason}
              </Alert>
            )}

            {/*
              삭제는 두 단계다. 파기 전에는 복구 문의를 받을 수 있고, 파기 뒤는
              되돌릴 수 없다. 날짜만 적어 두면 "지금 문의를 받아도 되는지"를 매번
              달력으로 세어야 해서 남은 기간을 함께 적는다.
            */}
            {data.status === "DELETED" && (
              <Alert
                tone="warning"
                title={
                  countdown
                    ? `삭제 대기 · 파기까지 ${countdown.label}`
                    : "삭제 대기"
                }
                className="mt-4"
              >
                {data.deletedAt &&
                  `${formatDateTime(data.deletedAt)}에 삭제 요청됨`}
                {data.purgeAt &&
                  ` · ${formatDateTime(data.purgeAt)} 이후 콘텐츠가 파기됩니다.`}
                <br />
                {countdown?.isOver
                  ? "파기 예정 시각이 지났습니다. 배치가 도는 즉시 콘텐츠가 사라지므로 복구 문의를 받을 수 없습니다."
                  : "파기 전까지만 복구 문의를 받을 수 있습니다. 복구는 이 화면에서 처리할 수 없으니(서버에 복구 API 없음) 운영 채널로 요청하세요."}
              </Alert>
            )}

            {data.status === "PURGED" && (
              <Alert tone="danger" title="콘텐츠 파기 완료" className="mt-4">
                {data.purgedAt && `${formatDateTime(data.purgedAt)}에 `}
                이미지 · 에셋이 파기되어 되돌릴 수 없습니다. 상태 변경도 서버가
                막습니다.
              </Alert>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatBox
                label="시나리오"
                value={`${formatWithCommas(data.scenarios.length)}편`}
              />
              <StatBox
                label="에셋"
                value={formatWithCommas(data.assets.length)}
              />
              <StatBox
                label="대화"
                // 앱 화면과 같은 축약 규칙으로 보여 준다(운영자가 앱과 대조한다).
                value={formatStatCount(data.chatCount)}
                // 축약된 숫자만으로는 조치 근거를 남길 수 없어 원값을 함께 둔다.
                hint={
                  data.chatCount >= 1_000
                    ? formatWithCommas(data.chatCount)
                    : undefined
                }
              />
              <StatBox
                label="좋아요"
                value={formatStatCount(data.likeCount)}
                hint={
                  data.likeCount >= 1_000
                    ? formatWithCommas(data.likeCount)
                    : undefined
                }
              />
            </div>
          </Card>

          <UniverseTranslationPanel translations={data.translations} />

          {/* 해시태그. 성인 태그가 걸린 세계관인지 함께 본다. */}
          <Card title={`해시태그 ${data.hashtags.length}개`}>
            {data.hashtags.length === 0 ? (
              <EmptyState title="등록된 해시태그가 없습니다." />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {data.hashtags.map((tag) => (
                  <span
                    key={tag.hashtagId}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-chip px-2 py-1 body-6",
                      tag.isEnabled
                        ? "bg-subtle text-font-1"
                        : "bg-subtle text-font-disabled line-through",
                    )}
                  >
                    #{tag.label}
                    {tag.isAdult && (
                      <span className="caption-3 text-danger">19</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <UniverseAssetGallery assets={data.assets} />

          <UniverseScenarioPanel scenarios={data.scenarios} />

          {/*
            대표 캐릭터.

            캐릭터 상세(`/universes/characters/{id}`)로 링크하지 않는다. 그 화면은
            아직 목업 구간이라 number ID로 조회하는데, 여기 오는 값은 실서버
            Snowflake 문자열이라 **누르면 반드시 404**다. 실연동 전까지는 링크
            대신 이 화면 안에서 캐릭터 정보를 그대로 보여 준다.
          */}
          {data.character && (
            <Card title="대표 캐릭터">
              <div className="flex items-center gap-3">
                <EntityImage
                  src={resolveImageUrl(
                    data.character.profileImageUrl,
                    data.character.profileImageFileId,
                    "CHARACTER_PROFILE",
                    "SQ140",
                  )}
                  alt={data.character.name ?? "대표 캐릭터"}
                  fileId={data.character.profileImageFileId}
                  ratio="square"
                  className="w-16 shrink-0 rounded-full"
                />

                <div className="min-w-0">
                  <p className="truncate title-5 text-font-1">
                    {data.character.name ?? "이름 없음"}
                  </p>
                  <p className="mt-0.5 body-6 text-font-2 tabular-nums">
                    캐릭터 #{data.character.characterId}
                  </p>
                  <p className="mt-1 caption-3 text-font-disabled">
                    캐릭터 상세는 아직 실서버와 연동되지 않아 이동할 수 없습니다.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* 공식 여부의 근거가 되는 계정이라 세계관 상세에서 바로 이어 준다. */}
          <Card title="소유 계정">
            <CreatorRow creator={data.creator} />
          </Card>
        </>
      )}

      {/* 심사 반려 모달. 반려 사유는 필수이며, 반려 시 공개 범위가 비공개로 함께 내려간다. */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => setRejectOpen(false)}
        title="심사 반려"
        description="반려 사유는 크리에이터에게 전달됩니다. 반려하면 공개 범위가 비공개로 함께 바뀝니다."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              취소
            </Button>
            <Button
              variant="danger"
              onClick={onReject}
              isLoading={reviewMutation.isPending}
            >
              반려
            </Button>
          </>
        }
      >
        <Controller
          control={control}
          name="reason"
          render={({ field }) => (
            <FormField label="반려 사유" required error={errors.reason?.message}>
              <Textarea
                {...field}
                rows={4}
                hasError={Boolean(errors.reason)}
                placeholder="어떤 기준에 어긋났는지 구체적으로 적어 주세요."
              />
            </FormField>
          )}
        />
      </Modal>

      {data && (
        <UniverseSettingsModal
          mode={settingsMode}
          universe={data}
          isPending={patchMutation.isPending}
          onClose={() => setSettingsMode(null)}
          onSubmit={onChangeSettings}
        />
      )}
    </>
  );
};

/**
 * 소유 계정 한 줄.
 *
 * 링크는 **갈 수 있는 곳이 있을 때만** 건다. 유저 상세가 있으면 그쪽으로,
 * 없으면 이 크리에이터의 세계관 목록으로 좁혀 준다. 둘 다 없으면(크리에이터
 * 식별자만 비는 경우) 링크 없이 정보만 남긴다 — 눌러서 아무 데도 못 가는
 * 링크는 운영자가 화면을 신뢰하지 않게 만든다.
 */
const CreatorRow = ({ creator }: { creator: UniverseDetail["creator"] }) => {
  const href = creator.userId
    ? `/users/${creator.userId}`
    : creator.creatorId
      ? `/universes?creatorId=${creator.creatorId}`
      : undefined;

  const body = (
    <>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate title-5 text-font-1">
            {creator.nickname ?? "이름 없음"}
          </p>
          <Badge tone="neutral">{creatorGradeLabel(creator.grade)}</Badge>
          <Badge tone={creatorStatusTone(creator.status)}>
            {creatorStatusLabel(creator.status)}
          </Badge>
        </div>

        <p className="mt-1 body-6 text-font-2 tabular-nums">
          크리에이터 #{creator.creatorId}
          {creator.userId && ` · 유저 #${creator.userId}`}
        </p>
      </div>

      {href && <ChevronRight size={16} className="shrink-0 text-font-2" />}
    </>
  );

  if (!href) {
    return <div className="flex items-center justify-between gap-3">{body}</div>;
  }

  return (
    <Link
      href={href}
      className="-m-2 flex items-center justify-between gap-3 rounded-field p-2 transition hover:bg-surface-hover"
    >
      {body}
    </Link>
  );
};

export default UniverseDetailView;
