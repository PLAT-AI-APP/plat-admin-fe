"use client";

import { useState } from "react";
import { useSystemPromptDetailQuery } from "@/api/ai/getSystemPromptDetail";
import { useSystemPromptListQuery } from "@/api/ai/getSystemPromptList";
import { useSystemPromptMutation } from "@/api/ai/mutateSystemPrompt";
import { FileText, Plus } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { openConfirm } from "@/store/useConfirmStore";
import type { SystemPromptVersion } from "@/type/ai";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Table from "@/components/ui/Table";
import type { TableColumn } from "@/components/ui/Table";
import PromptMarkdown from "./PromptMarkdown";
import PromptVersionModal from "./PromptVersionModal";

const SystemPromptManager = () => {
  // 선택 전에는 첫 번째 프롬프트를 자동으로 보여준다. (useEffect로 서버 값을 복사하지 않는다)
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  const { data: prompts, isLoading: isListLoading } = useSystemPromptListQuery();

  const activeKey = selectedKey ?? prompts?.[0]?.promptKey ?? null;

  const { data: detail, isLoading: isDetailLoading } =
    useSystemPromptDetailQuery(activeKey);

  const { createVersionMutation, activateMutation } = useSystemPromptMutation();

  const versions = detail?.versions ?? [];
  const activeVersionItem = versions.find((version) => version.isActive);
  const nextVersion =
    versions.reduce((max, version) => Math.max(max, version.version), 0) + 1;

  const handleCreateVersion = (content: string) => {
    if (!detail) return;

    createVersionMutation.mutate(
      { promptKey: detail.promptKey, content },
      { onSuccess: () => setIsVersionModalOpen(false) },
    );
  };

  /** 버전 활성화는 즉시 모든 대화에 반영되므로 확인을 받는다. */
  const handleActivate = (version: SystemPromptVersion) => {
    if (!detail) return;

    openConfirm({
      title: "이 버전을 활성화할까요?",
      description: `'${detail.label}' 프롬프트가 v${version.version} 내용으로 즉시 교체됩니다.`,
      warning: `현재 활성 버전 v${detail.activeVersion}의 활성 상태는 해제됩니다.`,
      confirmText: "활성화",
      onConfirm: () =>
        activateMutation.mutateAsync({
          promptKey: detail.promptKey,
          version: version.version,
        }),
    });
  };

  const versionColumns: TableColumn<SystemPromptVersion>[] = [
    {
      key: "version",
      header: "버전",
      width: "100px",
      render: (version) => (
        <span className="body-4 font-medium tabular-nums text-font-1">
          v{version.version}
        </span>
      ),
    },
    {
      key: "createdBy",
      header: "작성자",
      render: (version) => (
        <span className="body-5 text-font-2">{version.createdBy}</span>
      ),
    },
    {
      key: "createdAt",
      header: "작성일",
      numeric: true,
      render: (version) => (
        <span className="body-5 text-font-2">
          {formatDateTime(version.createdAt)}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "활성 여부",
      align: "center",
      render: (version) => (
        <div className="flex justify-center">
          <Badge tone={version.isActive ? "success" : "neutral"}>
            {version.isActive ? "활성" : "비활성"}
          </Badge>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "100px",
      align: "center",
      render: (version) => (
        <div className="flex justify-center">
          {!version.isActive && (
            <Button
              size="sm"
              onClick={() => handleActivate(version)}
              disabled={activateMutation.isPending}
            >
              활성화
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Alert tone="info" title="새 버전은 저장만으로 적용되지 않습니다.">
        프롬프트는 버전으로 쌓이고, 활성화한 버전 하나만 실제 대화에 사용됩니다.
        내용을 고친 뒤에는 반드시 해당 버전을 활성화해 주세요.
      </Alert>

      <div className="grid grid-cols-[260px_1fr] items-start gap-4">
        {/* 좌측: 프롬프트 키 목록 */}
        <Card title="프롬프트" noPadding>
          {isListLoading && (
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          )}

          {!isListLoading && (prompts?.length ?? 0) === 0 && (
            <EmptyState
              icon={<FileText size={40} />}
              title="등록된 프롬프트가 없습니다."
              description="서버에 프롬프트 키가 등록되면 이곳에 표시됩니다."
            />
          )}

          {!isListLoading && (
            <ul className="flex flex-col gap-1 p-3">
              {prompts?.map((prompt) => {
                const isSelected = prompt.promptKey === activeKey;

                return (
                  <li key={prompt.promptKey}>
                    <button
                      type="button"
                      onClick={() => setSelectedKey(prompt.promptKey)}
                      className={cn(
                        "w-full rounded-field px-3 py-2.5 text-left transition-colors",
                        isSelected
                          ? "bg-surface-selected text-brand"
                          : "text-font-1 hover:bg-surface-hover",
                      )}
                    >
                      <span className="block body-4 font-medium">
                        {prompt.label}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block truncate body-6",
                          isSelected ? "text-brand" : "text-font-2",
                        )}
                      >
                        {prompt.promptKey}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* 우측: 선택된 프롬프트 상세 */}
        <div className="flex min-w-0 flex-col gap-4">
          {isDetailLoading && (
            <Card>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </Card>
          )}

          {!isDetailLoading && !detail && (
            <Card>
              <EmptyState
                icon={<FileText size={40} />}
                title="프롬프트를 선택해 주세요."
                description="좌측 목록에서 관리할 프롬프트 키를 고르면 상세가 표시됩니다."
              />
            </Card>
          )}

          {!isDetailLoading && detail && (
            <>
              <Card
                title={
                  <span className="flex items-center gap-2">
                    {detail.label}
                    <Badge tone="brand">활성 v{detail.activeVersion}</Badge>
                  </span>
                }
                description={`${detail.description} · 최종 수정 ${formatDateTime(detail.updatedAt)}`}
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus size={15} />}
                    onClick={() => setIsVersionModalOpen(true)}
                  >
                    새 버전 저장
                  </Button>
                }
              >
                {activeVersionItem ? (
                  <div className="rounded-field border border-border-main bg-subtle px-4 py-3">
                    <PromptMarkdown content={activeVersionItem.content} />
                  </div>
                ) : (
                  <EmptyState
                    icon={<FileText size={40} />}
                    title="활성화된 버전이 없습니다."
                    description="아래 버전 이력에서 사용할 버전을 활성화해 주세요."
                  />
                )}
              </Card>

              <Card
                title="버전 이력"
                description={`총 ${versions.length}개 버전`}
                noPadding
              >
                <Table
                  columns={versionColumns}
                  rows={versions}
                  getRowKey={(version) => String(version.versionId)}
                  skeletonRows={3}
                  emptyTitle="저장된 버전이 없습니다."
                  emptyDescription="'새 버전 저장'으로 첫 버전을 만들어 보세요."
                />
              </Card>
            </>
          )}
        </div>
      </div>

      {detail && (
        <PromptVersionModal
          isOpen={isVersionModalOpen}
          onClose={() => setIsVersionModalOpen(false)}
          promptLabel={detail.label}
          nextVersion={nextVersion}
          initialContent={activeVersionItem?.content ?? ""}
          onSubmit={handleCreateVersion}
          isSubmitting={createVersionMutation.isPending}
        />
      )}
    </>
  );
};

export default SystemPromptManager;
