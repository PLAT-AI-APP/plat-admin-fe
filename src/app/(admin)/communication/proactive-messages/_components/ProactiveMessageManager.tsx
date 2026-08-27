"use client";

import { useState } from "react";
import { useProactiveMessageListQuery } from "@/api/communication/getProactiveMessageList";
import {
  useProactiveMessageMutation,
  type ProactiveMessageFormValues,
} from "@/api/communication/mutateProactiveMessage";
import { Edit, Plus, Trash } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { showErrorToast } from "@/lib/toast";
import { formatWithCommas, truncate } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import type { ProactiveMessage } from "@/type/communication";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Switch from "@/components/ui/Switch";
import Table, { TableCellStack, type TableColumn } from "@/components/ui/Table";
import {
  PROACTIVE_TRIGGER_LABEL,
  PROACTIVE_TRIGGER_TONE,
} from "../../_constants/labels";
import ProactiveMessageFormModal from "./ProactiveMessageFormModal";

const ProactiveMessageManager = () => {
  const { data, isLoading } = useProactiveMessageListQuery();
  const { createMutation, updateMutation, deleteMutation } =
    useProactiveMessageMutation();

  const [editingMessage, setEditingMessage] = useState<
    ProactiveMessage | undefined
  >();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const messages = data ?? [];

  const handleOpenCreate = () => {
    setEditingMessage(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (message: ProactiveMessage) => {
    setEditingMessage(message);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: ProactiveMessageFormValues) => {
    if (editingMessage) {
      updateMutation.mutate(
        { messageId: editingMessage.messageId, values },
        {
          onSuccess: () => setIsFormOpen(false),
          onError: (error) => showErrorToast(error),
        },
      );
      return;
    }

    createMutation.mutate(values, {
      onSuccess: () => setIsFormOpen(false),
      onError: (error) => showErrorToast(error),
    });
  };

  /**
   * 활성 여부만 바꾸는 전용 API가 없어 수정 API에 나머지 값을 그대로 실어 보낸다.
   * 서버가 부분 수정을 지원하게 되면 이 함수만 교체하면 된다.
   */
  const handleToggleEnabled = (
    message: ProactiveMessage,
    isEnabled: boolean,
  ) => {
    updateMutation.mutate(
      {
        messageId: message.messageId,
        values: {
          characterId: message.characterId,
          trigger: message.trigger,
          content: message.content,
          isEnabled,
        },
      },
      { onError: (error) => showErrorToast(error) },
    );
  };

  const handleDelete = (message: ProactiveMessage) => {
    openConfirm({
      title: "선제 메시지를 삭제할까요?",
      description: `'${PROACTIVE_TRIGGER_LABEL[message.trigger]}' 조건의 메시지 "${truncate(message.content, 30)}"가 삭제됩니다.`,
      warning: "삭제한 메시지는 되돌릴 수 없습니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () =>
        deleteMutation
          .mutateAsync(message.messageId)
          .catch((error) => showErrorToast(error)),
    });
  };

  const columns: TableColumn<ProactiveMessage>[] = [
    {
      key: "character",
      header: "대상 캐릭터",
      width: "180px",
      render: (row) => (
        <TableCellStack
          primary={row.characterName ?? "전체 캐릭터"}
          secondary={
            row.characterId ? `ID ${row.characterId}` : "모든 캐릭터에 적용"
          }
        />
      ),
    },
    {
      key: "trigger",
      header: "트리거",
      width: "130px",
      render: (row) => (
        <Badge tone={PROACTIVE_TRIGGER_TONE[row.trigger]}>
          {PROACTIVE_TRIGGER_LABEL[row.trigger]}
        </Badge>
      ),
    },
    {
      key: "content",
      header: "내용",
      render: (row) => (
        <p className="max-w-120 truncate text-font-1">{row.content}</p>
      ),
    },
    {
      key: "isEnabled",
      header: "활성 여부",
      width: "110px",
      align: "center",
      render: (row) => (
        <Switch
          label={`${PROACTIVE_TRIGGER_LABEL[row.trigger]} 선제 메시지 활성화`}
          checked={row.isEnabled}
          disabled={updateMutation.isPending}
          onChange={(checked) => handleToggleEnabled(row, checked)}
        />
      ),
    },
    {
      key: "sentCount",
      header: "발송 수",
      width: "110px",
      align: "right",
      numeric: true,
      render: (row) => (
        <span className="text-font-1">{formatWithCommas(row.sentCount)}</span>
      ),
    },
    {
      key: "updatedAt",
      header: "수정일",
      width: "150px",
      numeric: true,
      render: (row) => (
        <span className="text-font-2">{formatDateTime(row.updatedAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "관리",
      width: "96px",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            label="수정"
            icon={<Edit size={16} />}
            onClick={() => handleOpenEdit(row)}
          />
          <IconButton
            label="삭제"
            icon={<Trash size={16} />}
            tone="danger"
            onClick={() => handleDelete(row)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Alert tone="warning" title="MVP 제외 기능">
        현재 운영에서는 Discord로 처리합니다. 화면은 이후 전환을 위해 미리
        구현해 두었습니다.
      </Alert>

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <div>
            <h2 className="body-3 font-semibold text-font-1">
              선제 메시지 {messages.length}건
            </h2>
            <p className="mt-1 body-5 text-font-2">
              트리거 조건이 충족되면 캐릭터가 이용자에게 먼저 말을 겁니다.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={handleOpenCreate}
          >
            선제 메시지 등록
          </Button>
        </div>

        <Table
          columns={columns}
          rows={messages}
          getRowKey={(row) => String(row.messageId)}
          isLoading={isLoading}
          skeletonRows={5}
          emptyTitle="등록된 선제 메시지가 없습니다."
          emptyDescription="트리거와 문구를 등록하면 조건이 맞는 이용자에게 자동으로 발송됩니다."
          emptyAction={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={handleOpenCreate}
            >
              선제 메시지 등록
            </Button>
          }
        />
      </Card>

      <ProactiveMessageFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        message={editingMessage}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
};

export default ProactiveMessageManager;
