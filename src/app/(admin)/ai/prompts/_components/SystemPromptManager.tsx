"use client";

import { useState } from "react";
import { useSystemPromptDetailQuery } from "@/api/ai/getSystemPromptDetail";
import { useSystemPromptListQuery } from "@/api/ai/getSystemPromptList";
import { useSystemPromptMutation } from "@/api/ai/mutateSystemPrompt";
import { ChevronDown, FileText, Plus, Trash } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { cn, formatAdmin } from "@/lib/utils";
import { useHasPermission } from "@/store/useAdminStore";
import { openConfirm } from "@/store/useConfirmStore";
import type { SystemPromptVersion } from "@/type/ai";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import Skeleton from "@/components/ui/Skeleton";
import Table from "@/components/ui/Table";
import type { TableColumn } from "@/components/ui/Table";
import PromptMarkdown from "./PromptMarkdown";
import PromptVersionModal from "./PromptVersionModal";

const SystemPromptManager = () => {
  // 선택 전에는 첫 번째 프롬프트를 자동으로 보여준다. (useEffect로 서버 값을 복사하지 않는다)
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  /*
    펼쳐 둔 버전. 주소에 넣지 않는다 — 어느 버전을 열어 뒀는지는 지금 이 화면에서만
    뜻이 있고, 링크로 건네받는 사람에게는 아무 의미가 없다.
  */
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const canDelete = useHasPermission("systemPrompt:delete");

  const { data: prompts, isLoading: isListLoading } = useSystemPromptListQuery();

  const activeKey = selectedKey ?? prompts?.[0]?.promptKey ?? null;

  const { data: detail, isLoading: isDetailLoading } =
    useSystemPromptDetailQuery(activeKey);

  const { createVersionMutation, activateMutation, deleteVersionMutation } =
    useSystemPromptMutation();

  const versions = detail?.versions ?? [];
  const activeVersionItem = versions.find((version) => version.isActive);
  /* 서버가 최신순으로 내려준다. 중복 판정의 상대가 되는 것은 활성이 아니라 이 버전이다. */
  const latestVersionItem = versions[0];
  /* 이력에서 세지 않는다 — 지운 번호는 비워진 채로 남고 다시 쓰이지 않는다. */
  const nextVersion = (detail?.latestVersion ?? 0) + 1;

  const toggleExpanded = (key: string) =>
    setExpandedKeys((keys) =>
      keys.includes(key) ? keys.filter((it) => it !== key) : [...keys, key],
    );

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
      // 아직 아무것도 켜져 있지 않으면 해제될 버전도 없다.
      warning: detail.activeVersion
        ? `현재 활성 버전 v${detail.activeVersion}의 활성 상태는 해제됩니다.`
        : undefined,
      confirmText: "활성화",
      onConfirm: () =>
        activateMutation.mutateAsync({
          promptKey: detail.promptKey,
          version: version.version,
        }),
    });
  };

  /** 지운 버전은 되돌릴 수 없고 번호도 다시 쓰이지 않는다. */
  const handleDelete = (version: SystemPromptVersion) => {
    if (!detail) return;

    openConfirm({
      title: "이 버전을 삭제할까요?",
      description: `'${detail.label}' 프롬프트의 v${version.version} 버전을 이력에서 지웁니다.`,
      warning:
        "되돌릴 수 없습니다. 지운 번호는 비워진 채로 남고 다시 쓰이지 않습니다.",
      confirmText: "삭제",
      tone: "danger",
      onConfirm: () =>
        deleteVersionMutation.mutateAsync({
          promptKey: detail.promptKey,
          version: version.version,
        }),
    });
  };

  const versionColumns: TableColumn<SystemPromptVersion>[] = [
    {
      /*
        행 전체가 클릭 대상이지만, 표만 보고 펼 수 있다는 것을 알 수는 없다.
        맨 앞에 둔다 — 오른쪽 끝은 표가 넓어지면 스크롤 밖으로 밀린다.
      */
      key: "expand",
      header: "",
      width: "40px",
      align: "center",
      render: (version) => (
        <ChevronDown
          size={16}
          className={cn(
            "inline-block text-font-2 transition-transform",
            expandedKeys.includes(String(version.versionId)) && "rotate-180",
          )}
        />
      ),
    },
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
        <span className="body-5 text-font-2">
          {formatAdmin(version.createdBy, version.createdById)}
        </span>
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
      width: "150px",
      align: "center",
      /*
        활성 버전에는 두 버튼이 모두 없다. 이미 켜져 있어 활성화할 것이 없고,
        지우면 그 프롬프트에 쓸 내용이 사라져 서버가 막는다.
      */
      render: (version) => (
        <div
          className="flex items-center justify-center gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          {!version.isActive && (
            <>
              <Button
                size="sm"
                onClick={() => handleActivate(version)}
                disabled={activateMutation.isPending}
              >
                활성화
              </Button>

              {canDelete && (
                <IconButton
                  label={`v${version.version} 삭제`}
                  icon={<Trash size={15} />}
                  tone="danger"
                  size="sm"
                  onClick={() => handleDelete(version)}
                  disabled={deleteVersionMutation.isPending}
                />
              )}
            </>
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
                    {detail.activeVersion ? (
                      <Badge tone="brand">활성 v{detail.activeVersion}</Badge>
                    ) : (
                      <Badge tone="neutral">활성 버전 없음</Badge>
                    )}
                  </span>
                }
                /* 한 번도 활성화한 적이 없으면 '최종 수정'이라 부를 시점이 없다. */
                description={
                  detail.updatedAt
                    ? `${detail.description} · 최종 수정 ${formatDateTime(detail.updatedAt)}`
                    : detail.description
                }
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
                  expandedKeys={expandedKeys}
                  onToggleExpand={toggleExpanded}
                  /* 행을 누르면 그 버전의 본문을 그 자리에서 편다. */
                  renderExpanded={(version) => (
                    <div className="max-h-[420px] overflow-auto rounded-field border border-border-main bg-surface px-4 py-3 scrollbar-thin">
                      <PromptMarkdown content={version.content} />
                    </div>
                  )}
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
          latestContent={latestVersionItem?.content ?? ""}
          latestVersion={latestVersionItem?.version ?? null}
          onSubmit={handleCreateVersion}
          isSubmitting={createVersionMutation.isPending}
        />
      )}
    </>
  );
};

export default SystemPromptManager;
