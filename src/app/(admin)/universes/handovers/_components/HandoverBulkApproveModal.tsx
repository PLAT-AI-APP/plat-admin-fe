"use client";

import Link from "next/link";
import { useState } from "react";
import { useUniverseHandoverAssigneesQuery } from "@/api/universe/getUniverseHandoverList";
import { resolveImageUrl } from "@/lib/imageUrl";
import { formatWithCommas } from "@/lib/utils";
import {
  HANDOVER_NOTE_MAX_LENGTH,
  type UniverseHandover,
} from "@/type/universeHandover";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import EntityImage from "@/components/ui/EntityImage";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import Textarea from "@/components/ui/Textarea";

/** 창 안에 썸네일로 다시 보여 줄 최대 수. 나머지는 개수만 적는다. */
const PREVIEW_LIMIT = 18;

interface HandoverBulkApproveModalProps {
  handovers: UniverseHandover[];
  onClose: () => void;
  onSubmit: (values: { targetUserId: string; note: string }) => void;
  isSubmitting: boolean;
}

/**
 * 고른 인수 심사 건을 같은 공식 계정으로 한 번에 승인한다.
 *
 * 일괄이라고 심사를 건너뛰면 안 된다. 고른 캐릭터를 썸네일로 한 번 더 보이고, 처리하지 않은 신고가
 * 섞여 있으면 경고하며, "썸네일과 설정을 확인했다"는 체크를 해야 승인할 수 있다.
 */
const HandoverBulkApproveModal = ({
  handovers,
  onClose,
  onSubmit,
  isSubmitting,
}: HandoverBulkApproveModalProps) => {
  const { data: assignees, isLoading } = useUniverseHandoverAssigneesQuery(true);
  const [picked, setPicked] = useState("");
  const [note, setNote] = useState("");
  const [isReviewed, setIsReviewed] = useState(false);

  const list = assignees ?? [];
  // 한 명뿐이면 고를 필요가 없다. 목록에서 사라진 계정은 고른 것으로 보지 않는다.
  const targetUserId = list.some((item) => item.userId === picked)
    ? picked
    : list.length === 1
      ? list[0].userId
      : "";
  const options = list.map((item) => ({
    label: `${item.nickname ?? "닉네임 없음"} (#${item.userId})`,
    value: item.userId,
  }));

  const withPendingReports = handovers.filter((handover) => handover.pendingReportCount > 0);
  const preview = handovers.slice(0, PREVIEW_LIMIT);
  const restCount = handovers.length - preview.length;

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title={`인수 일괄 승인 · ${formatWithCommas(handovers.length)}건`}
      description="고른 캐릭터를 같은 공식 계정이 넘겨받아 '운영 PLAT'으로 운영합니다. 건마다 따로 승인됩니다."
      closeOnOverlayClick={false}
      isDirty={Boolean(picked || note || isReviewed)}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant="primary"
            disabled={!targetUserId || !isReviewed}
            isLoading={isSubmitting}
            onClick={() => onSubmit({ targetUserId, note })}
          >
            {formatWithCommas(handovers.length)}건 승인
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* 고른 캐릭터를 한눈에 다시 본다. 실존 인물 · 도용 이미지는 여기서 마지막으로 걸러낸다. */}
        <div className="flex flex-col gap-2 rounded-card border border-border-main bg-subtle p-3">
          <p className="body-6 text-font-2">고른 캐릭터</p>
          <ul className="grid grid-cols-6 gap-2 sm:grid-cols-9">
            {preview.map((handover) => (
              <li key={handover.handoverId} title={handover.universeTitle ?? "(제목 없음)"}>
                <EntityImage
                  src={resolveImageUrl(handover.profileImageUrl, handover.profileImageFileId, "UNIVERSE_PROFILE", "SQ80")}
                  alt={handover.universeTitle ?? "(제목 없음)"}
                  fileId={handover.profileImageFileId}
                  className="w-full"
                />
              </li>
            ))}
          </ul>
          {restCount > 0 && (
            <p className="body-6 text-font-2">외 {formatWithCommas(restCount)}건</p>
          )}
        </div>

        {withPendingReports.length > 0 && (
          <Alert
            tone="warning"
            title={`처리하지 않은 신고가 있는 캐릭터 ${formatWithCommas(withPendingReports.length)}건이 섞여 있습니다.`}
          >
            {withPendingReports
              .slice(0, 5)
              .map((handover) => handover.universeTitle ?? "(제목 없음)")
              .join(" · ")}
            {withPendingReports.length > 5 && ` 외 ${withPendingReports.length - 5}건`}. 탈퇴 시점 기준입니다.
            빼고 따로 심사하는 것을 권합니다.
          </Alert>
        )}

        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : list.length === 0 ? (
          <Alert
            tone="warning"
            title="인수받을 공식 계정이 없습니다."
            action={
              <Link
                href="/users/official"
                className="body-5 font-medium whitespace-nowrap text-info hover:underline"
              >
                공식 계정 지정
              </Link>
            }
          >
            공식 계정을 먼저 지정하세요. 크리에이터 전환을 한 계정만 인수받을 수 있습니다.
          </Alert>
        ) : (
          <FormField label="인수받을 공식 계정" htmlFor="handover-bulk-assignee" required>
            <Select
              id="handover-bulk-assignee"
              options={options}
              placeholder="공식 계정 선택"
              value={targetUserId}
              onChange={(event) => setPicked(event.target.value)}
            />
          </FormField>
        )}

        <FormField
          label="메모"
          htmlFor="handover-bulk-approve-note"
          hint={`모든 건에 같은 메모가 남습니다 (${note.length}/${HANDOVER_NOTE_MAX_LENGTH})`}
        >
          <Textarea
            id="handover-bulk-approve-note"
            rows={2}
            maxLength={HANDOVER_NOTE_MAX_LENGTH}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </FormField>

        <Checkbox
          checked={isReviewed}
          onChange={() => setIsReviewed((prev) => !prev)}
          label={
            <span className="body-5 text-font-1">
              고른 캐릭터의 썸네일과 설정을 확인했고, 실존 인물 · 원작 IP · 도용 이미지 · 개인정보가 없습니다.
            </span>
          }
        />
      </div>
    </Modal>
  );
};

export default HandoverBulkApproveModal;
