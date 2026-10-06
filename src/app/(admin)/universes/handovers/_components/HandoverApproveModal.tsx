"use client";

import Link from "next/link";
import { useState } from "react";
import { useUniverseHandoverAssigneesQuery } from "@/api/universe/getUniverseHandoverList";
import {
  HANDOVER_NOTE_MAX_LENGTH,
  type UniverseHandover,
} from "@/type/universeHandover";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import Textarea from "@/components/ui/Textarea";

interface HandoverApproveModalProps {
  handover: UniverseHandover;
  onClose: () => void;
  onSubmit: (values: { targetUserId: string; note: string }) => void;
  isSubmitting: boolean;
}

/**
 * 인수 승인. 고른 공식 계정이 세계관과 이미지 소유를 넘겨받는다.
 *
 * 받을 계정 목록은 모달을 열 때마다 새로 받는다. 승인이 받을 계정 무효(409)로 막히면
 * 목록이 갱신되고, 사라진 계정은 선택에서 자동으로 빠진다.
 */
const HandoverApproveModal = ({
  handover,
  onClose,
  onSubmit,
  isSubmitting,
}: HandoverApproveModalProps) => {
  const { data: assignees, isLoading } = useUniverseHandoverAssigneesQuery(true);
  const [picked, setPicked] = useState("");
  const [note, setNote] = useState("");

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

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="md"
      title="인수 승인"
      description={`#${handover.handoverId} · ${handover.universeTitle ?? "제목 없음"}. 고른 공식 계정이 세계관과 이미지를 넘겨받아 운영합니다.`}
      closeOnOverlayClick={false}
      isDirty={Boolean(picked || note)}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant="primary"
            disabled={!targetUserId}
            isLoading={isSubmitting}
            onClick={() => onSubmit({ targetUserId, note })}
          >
            승인
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="body-5 text-font-2">
          실존 인물 · 원작 IP · 도용 이미지 · 개인정보 · 신고 이력이 있으면 반려하세요.{" "}
          <Link
            href={`/universes/${handover.universeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-info hover:underline"
          >
            설정 · 이미지 보기
          </Link>
        </p>

        {handover.pendingReportCount > 0 && (
          <Alert tone="warning" title={`처리하지 않은 신고 ${handover.pendingReportCount}건이 있습니다.`}>
            탈퇴 시점 기준입니다.
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
                className="body-5 font-medium text-info whitespace-nowrap hover:underline"
              >
                공식 계정 지정
              </Link>
            }
          >
            공식 계정을 먼저 지정하세요. 크리에이터 전환을 한 계정만 인수받을 수 있습니다.
          </Alert>
        ) : (
          <FormField label="인수받을 공식 계정" htmlFor="handover-assignee" required>
            <Select
              id="handover-assignee"
              options={options}
              placeholder="공식 계정 선택"
              value={targetUserId}
              onChange={(event) => setPicked(event.target.value)}
            />
          </FormField>
        )}

        <FormField
          label="메모"
          htmlFor="handover-approve-note"
          hint={`운영 내부 기록 (${note.length}/${HANDOVER_NOTE_MAX_LENGTH})`}
        >
          <Textarea
            id="handover-approve-note"
            rows={3}
            maxLength={HANDOVER_NOTE_MAX_LENGTH}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </FormField>
      </div>
    </Modal>
  );
};

export default HandoverApproveModal;
