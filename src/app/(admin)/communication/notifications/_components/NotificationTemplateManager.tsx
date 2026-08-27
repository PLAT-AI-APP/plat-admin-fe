"use client";

import { useState } from "react";
import { useNotificationTemplateListQuery } from "@/api/communication/getNotificationTemplateList";
import { useNotificationTemplateMutation } from "@/api/communication/mutateNotificationTemplate";
import { Edit } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import type { NotificationTemplateSchema } from "@/schema/notificationTemplate.schema";
import type { NotificationTemplate } from "@/type/communication";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import Switch from "@/components/ui/Switch";
import Table, { type TableColumn } from "@/components/ui/Table";
import {
  NOTIFICATION_CHANNEL_LABEL,
  NOTIFICATION_CHANNEL_TONE,
} from "../../_constants/labels";
import NotificationTemplateModal from "./NotificationTemplateModal";

const NotificationTemplateManager = () => {
  const { data, isLoading } = useNotificationTemplateListQuery();
  const { updateMutation, statusMutation } = useNotificationTemplateMutation();

  const [editingTemplate, setEditingTemplate] = useState<
    NotificationTemplate | undefined
  >();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const templates = data ?? [];

  const handleOpenEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: NotificationTemplateSchema) => {
    if (!editingTemplate) return;

    updateMutation.mutate(
      { templateId: editingTemplate.templateId, values },
      { onSuccess: () => setIsFormOpen(false) },
    );
  };

  const columns: TableColumn<NotificationTemplate>[] = [
    {
      key: "templateKey",
      header: "템플릿 키",
      width: "180px",
      render: (row) => (
        <span className="body-5 text-font-2">{row.templateKey}</span>
      ),
    },
    {
      key: "label",
      header: "라벨",
      width: "160px",
      render: (row) => <span className="text-font-1">{row.label}</span>,
    },
    {
      key: "channel",
      header: "채널",
      width: "120px",
      render: (row) => (
        <Badge tone={NOTIFICATION_CHANNEL_TONE[row.channel]}>
          {NOTIFICATION_CHANNEL_LABEL[row.channel]}
        </Badge>
      ),
    },
    {
      key: "title",
      header: "제목",
      render: (row) => (
        <p className="max-w-100 truncate text-font-1">{row.title}</p>
      ),
    },
    {
      key: "isEnabled",
      header: "활성 여부",
      width: "100px",
      align: "center",
      render: (row) => (
        <Switch
          label={`${row.label} 알림 활성화`}
          checked={row.isEnabled}
          disabled={statusMutation.isPending}
          onChange={(checked) =>
            statusMutation.mutate({
              templateId: row.templateId,
              isEnabled: checked,
            })
          }
        />
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
      width: "72px",
      align: "center",
      render: (row) => (
        <IconButton
          label="수정"
          icon={<Edit size={16} />}
          onClick={() => handleOpenEdit(row)}
        />
      ),
    },
  ];

  return (
    <>
      <Alert tone="warning" title="MVP 제외 기능">
        알림 발송은 현재 운영에서 Discord 공지로 대체하고 있습니다. 화면은 이후
        전환을 위해 미리 구현해 두었습니다.
      </Alert>

      <Card
        title={`알림 템플릿 ${templates.length}건`}
        description="템플릿은 서버에 미리 정의되어 있어 추가·삭제 없이 문구와 활성 여부만 운영합니다."
        noPadding
      >
        <Table
          columns={columns}
          rows={templates}
          getRowKey={(row) => String(row.templateId)}
          isLoading={isLoading}
          skeletonRows={8}
          emptyTitle="등록된 알림 템플릿이 없습니다."
          emptyDescription="서버에 템플릿이 배포되면 이 목록에 표시됩니다."
        />
      </Card>

      <NotificationTemplateModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        template={editingTemplate}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </>
  );
};

export default NotificationTemplateManager;
