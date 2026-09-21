"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUniverseDetailQuery } from "@/api/universe/getUniverseDetail";
import {
  showUniverseErrorToast,
  useUniverseMutation,
  type UniversePatchBody,
} from "@/api/universe/mutateUniverse";
import { resolveImageUrl } from "@/lib/imageUrl";
import { formatWithCommas } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import { universeBlockReason, type UniverseDetail } from "@/type/character";
import {
  universeRejectSchema,
  type UniverseRejectSchema,
} from "@/schema/universe.schema";
import BackLink from "@/components/layout/BackLink";
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
import AssetGridSection from "@/components/detail/AssetGridSection";
import CreatorProfileSection from "@/components/detail/CreatorProfileSection";
import DetailHero from "@/components/detail/DetailHero";
import DetailSection from "@/components/detail/DetailSection";
import DetailSectionTabs from "@/components/detail/DetailSectionTabs";
import HashtagLine from "@/components/detail/HashtagLine";
import StatusChip from "@/components/detail/StatusChip";
import UniverseScenarioPanel from "./UniverseScenarioPanel";
import UniverseSettingsFormModal, {
  type UniverseSettingsMode,
} from "./UniverseSettingsFormModal";
import UniverseTranslationPanel from "./UniverseTranslationPanel";
import { buildUniverseActions } from "./universeActions";
import {
  creatorGradeLabel,
  creatorStatusLabel,
  creatorStatusTone,
  isRiskyCreatorStatus,
  universeTitleOf,
} from "@/app/(admin)/universes/[universeId]/_lib/universeMeta";
import {
  UNIVERSE_CATEGORY_LABEL,
  UNIVERSE_REVIEW_LABEL,
  UNIVERSE_REVIEW_TONE,
  UNIVERSE_STATUS_LABEL,
  UNIVERSE_STATUS_TONE,
  UNIVERSE_TENDENCY_LABEL,
  UNIVERSE_VISIBILITY_LABEL,
  UNIVERSE_VISIBILITY_TONE,
} from "@/constants/universeOptions";

interface UniverseDetailViewProps {
  universeId: string;
}

/** 섹션 탭이 스크롤할 DOM id */
const SECTION = {
  translation: "universe-translation",
  creator: "universe-creator",
  assets: "universe-assets",
  characters: "universe-characters",
  scenarios: "universe-scenarios",
} as const;

/** 히어로의 한 줄 소개는 앱 기본 언어(한국어) 본문에서 가져온다. */
const koreanOf = (universe: UniverseDetail) =>
  universe.translations.find((t) => t.language === "KO");

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
 * 삭제는 하드 딜리트다. 지운 세계관은 데이터째 사라져 이 화면으로도 열리지 않으므로
 * 삭제·복구는 다루지 않는다.
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
    formState: { errors, isDirty },
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
  const isCreatorRisky = data ? isRiskyCreatorStatus(data.creator.status) : false;

  return (
    <>
      <BackLink href="/universes" label="세계관" />

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
          <Card bodyClassName="flex flex-col gap-4">
            <DetailHero
              image={
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
                  shape="chip"
                />
              }
              chips={
                <>
                  <StatusChip tone={UNIVERSE_STATUS_TONE[data.status]}>
                    {UNIVERSE_STATUS_LABEL[data.status]}
                  </StatusChip>
                  <StatusChip tone={UNIVERSE_VISIBILITY_TONE[data.visibility]}>
                    {UNIVERSE_VISIBILITY_LABEL[data.visibility]}
                  </StatusChip>
                  <StatusChip tone={UNIVERSE_REVIEW_TONE[data.reviewStatus]}>
                    {UNIVERSE_REVIEW_LABEL[data.reviewStatus]}
                  </StatusChip>
                  {/* 좋고 나쁨이 없는 분류라 점 없이 둔다. 더보기에서 바꾸는 값이다. */}
                  <StatusChip>{UNIVERSE_CATEGORY_LABEL[data.category]}</StatusChip>
                  <StatusChip>{UNIVERSE_TENDENCY_LABEL[data.tendency]}</StatusChip>
                  {!data.commentEnabled && (
                    <StatusChip tone="danger">댓글 중지</StatusChip>
                  )}
                </>
              }
              title={universeTitleOf(data)}
              idLabel={`#${data.universeId}`}
              subtitle={koreanOf(data)?.introduce.trim() || undefined}
              hashtags={
                <HashtagLine
                  items={data.hashtags.map((tag) => ({
                    key: tag.hashtagId,
                    label: tag.label,
                    isDisabled: !tag.isEnabled,
                    isAdult: tag.isAdult,
                  }))}
                />
              }
              stats={[
                {
                  label: "등장 캐릭터",
                  value: `${data.character ? 1 : 0}명`,
                },
                // 축약하지 않는다. 조치 근거로 남길 숫자라 원값이 필요하다.
                { label: "대화량", value: formatWithCommas(data.chatCount) },
                { label: "좋아요", value: formatWithCommas(data.likeCount) },
              ]}
              action={<Dropdown items={actions} />}
              createdAt={data.createdAt}
              updatedAt={data.updatedAt}
            />

            {/* 왜 앱에 안 보이는지를 칩 조합 대신 한 줄로 명시한다. */}
            {blockReason ? (
              <p className="body-5 text-warning">
                현재 앱에 노출되지 않습니다 · 사유: {blockReason}
              </p>
            ) : (
              <p className="body-5 text-success">
                앱에 정상 노출 가능한 상태입니다.
              </p>
            )}

            {/*
              정지·회수된 크리에이터의 세계관은 심사를 통과시켜도 계정 쪽 조치로
              다시 내려갈 수 있다. 승인 버튼을 누르기 전에 보이는 자리에 둔다.
            */}
            {isCreatorRisky && (
              <Alert tone="warning" title="정지된 크리에이터의 세계관입니다">
                소유 크리에이터가 {creatorStatusLabel(data.creator.status)}{" "}
                상태입니다. 심사를 승인해도 계정 조치로 다시 내려갈 수 있으니,
                계정 상태를 먼저 확인하세요.
              </Alert>
            )}

            {/* 심사 반려 사유는 크리에이터 문의로 이어지므로 눈에 띄게 둔다. */}
            {data.reviewStatus === "REJECTED" && data.reviewRejectionReason && (
              <Alert tone="danger" title="심사 반려">
                {data.reviewRejectionReason}
              </Alert>
            )}
          </Card>

          <DetailSectionTabs
            items={[
              { label: "번역언어", value: SECTION.translation },
              { label: "제작자", value: SECTION.creator },
              {
                label: "에셋",
                value: SECTION.assets,
                count: data.assets.length,
              },
              {
                label: "등장 캐릭터",
                value: SECTION.characters,
                count: data.character ? 1 : 0,
              },
              {
                label: "시나리오",
                value: SECTION.scenarios,
                count: data.scenarios.length,
              },
            ]}
          />

          <UniverseTranslationPanel
            id={SECTION.translation}
            translations={data.translations}
          />

          <CreatorProfileSection
            id={SECTION.creator}
            userId={data.creator.userId}
            fallbackNickname={data.creator.nickname}
            fallbackId={data.creator.creatorId}
            chips={
              <>
                <Badge tone="neutral">
                  {creatorGradeLabel(data.creator.grade)}
                </Badge>
                <Badge tone={creatorStatusTone(data.creator.status)}>
                  {creatorStatusLabel(data.creator.status)}
                </Badge>
              </>
            }
          />

          <AssetGridSection id={SECTION.assets} assets={data.assets} />

          <DetailSection
            id={SECTION.characters}
            title="등장 캐릭터"
            meta={`총 ${data.character ? 1 : 0}개`}
          >
            {data.character ? (
              <CharacterRow character={data.character} />
            ) : (
              <EmptyState
                title="등장하는 캐릭터가 없습니다."
                description="캐릭터가 없는 세계관은 유저가 대화를 시작할 상대가 없습니다."
              />
            )}
          </DetailSection>

          <UniverseScenarioPanel
            id={SECTION.scenarios}
            scenarios={data.scenarios}
          />
        </>
      )}

      {/* 심사 반려 모달. 반려 사유는 필수이며, 반려 시 공개 범위가 비공개로 함께 내려간다. */}
      <Modal
        isDirty={isDirty}
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
        <UniverseSettingsFormModal
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
 * 등장 캐릭터 한 줄.
 *
 * 캐릭터 상세(`/universes/characters/{id}`)로 링크하지 않는다. 그 화면은 아직
 * 목업 구간이라, 여기 오는 실서버 Snowflake로 열면 **반드시 404**다. 실연동 전까지는
 * 링크 없이 이 화면 안에서 캐릭터 정보를 그대로 보여 준다.
 *
 * 서버가 이 자리에 주는 값은 이름과 이미지뿐이다. 캐릭터 상태 · 소개 · 태그 · 지표는
 * 응답에 없어서 그리지 않는다.
 */
const CharacterRow = ({
  character,
}: {
  character: NonNullable<UniverseDetail["character"]>;
}) => (
  <div className="flex items-center gap-4">
    <EntityImage
      src={resolveImageUrl(
        character.profileImageUrl,
        character.profileImageFileId,
        "CHARACTER_PROFILE",
        "SQ140",
      )}
      alt={character.name ?? "캐릭터"}
      fileId={character.profileImageFileId}
      ratio="square"
      shape="chip"
      className="w-36 shrink-0"
    />

    <div className="min-w-0">
      <p className="truncate title-4 text-font-0">
        {character.name ?? "이름 없음"}
      </p>
      <p className="mt-1 body-6 text-font-2 tabular-nums">
        캐릭터 #{character.characterId}
      </p>
      <p className="mt-2 caption-3 text-font-disabled">
        캐릭터 상세는 아직 실서버와 연동되지 않아 이동할 수 없습니다.
      </p>
    </div>
  </div>
);

export default UniverseDetailView;
