"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUniverseDetailQuery } from "@/api/universe/getUniverseDetail";
import { useUniverseMutation } from "@/api/universe/mutateUniverse";
import { ChevronRight, ImageIcon } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { cn, formatWithCommas } from "@/lib/utils";
import { showErrorToast } from "@/lib/toast";
import { openConfirm } from "@/store/useConfirmStore";
import {
  universeBlockReason,
  type UniverseDetail,
} from "@/type/character";
import { SERVICE_LANGUAGES, SERVICE_LANGUAGE_LABEL } from "@/type/language";
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
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import Textarea from "@/components/ui/Textarea";
import UniverseScenarioPanel from "./UniverseScenarioPanel";
import { buildUniverseActions } from "./universeActions";
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

/** 세계관 대표 제목. 한국어 번역을 우선하고 없으면 첫 번역을 쓴다. */
const titleOf = (universe: UniverseDetail): string => {
  const ko = universe.translations.find((t) => t.language === "KO");
  return (ko ?? universe.translations[0])?.title ?? "제목 없음";
};

/** 세계관 지표 한 칸 */
const StatBox = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-field border border-border-main px-3 py-2.5">
    <p className="text-[12px] text-font-2">{label}</p>
    <p className="mt-1 text-[15px] font-semibold text-font-1 tabular-nums">
      {value}
    </p>
  </div>
);

/**
 * 이미지 자리표시.
 *
 * 관리자 서버는 파일 저장소 어댑터를 스캔하지 않아 FileId → URL을 만들지 못한다.
 * 따라서 대부분의 이미지 URL이 비어 오며, 깨진 `img` 대신 파일 ID를 적은 자리표시를 둔다.
 */
const ImagePlaceholder = ({
  fileId,
  className,
}: {
  fileId: string | null;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-1 rounded-card bg-subtle text-font-disabled",
      className,
    )}
  >
    <ImageIcon size={20} />
    {fileId && (
      <span className="px-1 text-center text-[10px] break-all">#{fileId}</span>
    )}
  </div>
);

/** 상세 설정처럼 긴 원문을 접어 두는 블록. 검수 시 펼쳐 전체를 본다. */
const Collapsible = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);
  const long = text.length > 160;

  return (
    <div>
      <p
        className={cn(
          "text-[13px] whitespace-pre-line text-font-1",
          !open && long && "line-clamp-3",
        )}
      >
        {text || "-"}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="mt-1 text-[12px] text-brand hover:underline"
        >
          {open ? "접기" : "전체 보기"}
        </button>
      )}
    </div>
  );
};

/**
 * 세계관 상세 · 운영 콘솔.
 *
 * 조회만 하던 화면을 심사·상태·댓글 조치와 번역·에셋·시나리오 검수까지 하는
 * 운영 화면으로 넓혔다. 삭제·파기 복구는 서버에 엔드포인트가 없어 다루지 않는다.
 */
const UniverseDetailView = ({ universeId }: UniverseDetailViewProps) => {
  const { data, isError } = useUniverseDetailQuery(universeId);
  const { patchMutation, reviewMutation } = useUniverseMutation();
  const [isRejectOpen, setRejectOpen] = useState(false);

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
      { onError: (error) => showErrorToast(error) },
    );

  const runPatch = (
    body: Parameters<typeof patchMutation.mutate>[0]["body"],
    message: string,
  ) =>
    patchMutation.mutate(
      { universeId, body, message },
      { onError: (error) => showErrorToast(error) },
    );

  const actions = data
    ? buildUniverseActions({
        universe: data,
        onApproveReview: () =>
          runReview({ reviewStatus: "APPROVED" }, "심사를 승인했습니다."),
        onRejectReview: () => {
          reset({ reason: "" });
          setRejectOpen(true);
        },
        onRequestReview: () =>
          runReview({ reviewStatus: "PENDING" }, "재심사 대기로 전환했습니다."),
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

  const blockReason = data ? universeBlockReason(data) : undefined;

  return (
    <>
      <BackLink href="/universes" label="세계관" />

      <PageHeader
        title={data ? titleOf(data) : "세계관 상세"}
        description={data ? `#${data.universeId}` : undefined}
        action={
          data ? <Dropdown items={actions} /> : undefined
        }
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
          <Card>
            <div className="flex gap-4">
              <ImagePlaceholder
                fileId={data.profileImageFileId}
                className="aspect-square w-28 shrink-0"
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
                  <p className="mt-2.5 text-[13px] text-warning">
                    현재 앱에 노출되지 않습니다 · 사유: {blockReason}
                  </p>
                ) : (
                  <p className="mt-2.5 text-[13px] text-success">
                    앱에 정상 노출 가능한 상태입니다.
                  </p>
                )}

                <p className="mt-2 text-[12px] text-font-2 tabular-nums">
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

            {/* 삭제는 두 단계다. 파기 전에는 복구 문의를 받을 수 있고, 파기 뒤는 되돌릴 수 없다. */}
            {data.status === "DELETED" && (
              <Alert tone="warning" title="삭제 대기" className="mt-4">
                {data.deletedAt && `${formatDateTime(data.deletedAt)}에 삭제 요청됨`}
                {data.purgeAt &&
                  ` · ${formatDateTime(data.purgeAt)} 이후 콘텐츠가 파기됩니다.`}
                <br />
                복구는 이 화면에서 처리하지 않습니다(서버에 복구 API 미구현). 파기
                전이라면 운영 채널로 복구를 요청하세요.
              </Alert>
            )}

            {data.status === "PURGED" && (
              <Alert tone="danger" title="콘텐츠 파기 완료" className="mt-4">
                {data.purgedAt && `${formatDateTime(data.purgedAt)}에 `}
                이미지 · 에셋이 파기되어 되돌릴 수 없습니다.
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
              <StatBox label="대화" value={formatWithCommas(data.chatCount)} />
              <StatBox label="좋아요" value={formatWithCommas(data.likeCount)} />
            </div>
          </Card>

          {/* 언어별 원문. detailSetting은 프롬프트성 원문이라 NSFW·인젝션 검수에 쓴다. */}
          <Card
            title={`번역 ${data.translations.length}개 언어`}
            description="detailSetting은 유저에게 보이지 않는 프롬프트성 설정입니다. 검수 시 함께 봅니다."
            noPadding
            bodyClassName="flex flex-col"
          >
            {data.translations.length === 0 ? (
              <div className="px-5 py-6">
                <EmptyState title="등록된 번역이 없습니다." />
              </div>
            ) : (
              SERVICE_LANGUAGES.filter((language) =>
                data.translations.some((t) => t.language === language),
              ).map((language) => {
                const t = data.translations.find(
                  (item) => item.language === language,
                )!;
                return (
                  <div
                    key={language}
                    className="border-b border-border-main px-5 py-4 last:border-b-0"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Badge tone="brand">
                        {SERVICE_LANGUAGE_LABEL[language]}
                      </Badge>
                      <p className="text-[14px] font-semibold text-font-1">
                        {t.title}
                      </p>
                    </div>
                    <p className="text-[13px] text-font-2">{t.introduce}</p>
                    <p className="mt-1 text-[13px] whitespace-pre-line text-font-1">
                      {t.description}
                    </p>
                    <div className="mt-2 rounded-field border border-border-main bg-subtle p-3">
                      <p className="mb-1 text-[11px] font-medium text-font-2">
                        상세 설정 (detailSetting)
                      </p>
                      <Collapsible text={t.detailSetting} />
                    </div>
                  </div>
                );
              })
            )}
          </Card>

          {/* 해시태그. 성인·노출 여부를 함께 보여 준다(성인 태그가 걸린 세계관 확인용). */}
          <Card title={`해시태그 ${data.hashtags.length}개`} noPadding bodyClassName="p-5">
            {data.hashtags.length === 0 ? (
              <EmptyState title="등록된 해시태그가 없습니다." />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {data.hashtags.map((tag) => (
                  <span
                    key={tag.hashtagId}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-field px-2 py-1 text-[12px]",
                      tag.isEnabled
                        ? "bg-subtle text-font-1"
                        : "bg-subtle text-font-disabled line-through",
                    )}
                  >
                    #{tag.label}
                    {tag.isAdult && (
                      <span className="text-[10px] font-semibold text-danger">
                        19
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* 에셋 갤러리. 저작권·선정성 신고 대응 시 실제 이미지를 확인하는 자리다. */}
          <Card
            title={`에셋 ${data.assets.length}개`}
            description="크리에이터가 올린 이미지입니다. 신고 대응 시 원본을 확인하세요."
            noPadding
            bodyClassName="p-5"
          >
            {data.assets.length === 0 ? (
              <EmptyState
                icon={<ImageIcon size={36} />}
                title="등록된 에셋이 없습니다."
              />
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {data.assets.map((asset) => (
                  <li key={asset.assetId}>
                    {asset.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.url}
                        alt={asset.assetName}
                        className="aspect-square w-full rounded-card object-cover"
                      />
                    ) : (
                      <ImagePlaceholder
                        fileId={asset.fileId}
                        className="aspect-square w-full"
                      />
                    )}
                    <p className="mt-1.5 truncate text-[13px] font-medium text-font-1">
                      {asset.assetName}
                    </p>
                    {asset.assetSituation && (
                      <p className="truncate text-[12px] text-font-2">
                        {asset.assetSituation}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* 세계관 안의 이야기. 유저가 실제로 고르는 대상이다. */}
          <UniverseScenarioPanel scenarios={data.scenarios} />

          {/* 대표 캐릭터. 같은 캐릭터가 다른 세계관에도 나올 수 있어 상세로 이어 준다. */}
          {data.character && (
            <Card title="대표 캐릭터" noPadding>
              <Link
                href={`/universes/characters/${data.character.characterId}`}
                className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-surface-hover"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ImagePlaceholder
                    fileId={data.character.profileImageFileId}
                    className="size-10 shrink-0 rounded-full"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-font-1">
                      {data.character.name ?? "이름 없음"}
                    </p>
                    <p className="mt-0.5 text-[12px] text-font-2 tabular-nums">
                      #{data.character.characterId}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="shrink-0 text-font-2" />
              </Link>
            </Card>
          )}

          {/* 공식 여부의 근거가 되는 계정이라 세계관 상세에서 바로 이어 준다. */}
          <Card title="소유 계정" noPadding>
            <Link
              href={
                data.creator.userId
                  ? `/users/${data.creator.userId}`
                  : `/universes?creatorId=${data.creator.creatorId}`
              }
              className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-surface-hover"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-font-1">
                  {data.creator.nickname ?? "이름 없음"}
                </p>
                <p className="mt-0.5 text-[12px] text-font-2 tabular-nums">
                  크리에이터 #{data.creator.creatorId} · 등급{" "}
                  {data.creator.grade} · {data.creator.status}
                </p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-font-2" />
            </Link>
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
    </>
  );
};

export default UniverseDetailView;
