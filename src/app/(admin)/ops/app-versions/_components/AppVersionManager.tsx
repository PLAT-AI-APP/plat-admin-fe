"use client";

import { useState } from "react";
import { useAppVersionListQuery } from "@/api/ops/getAppVersionList";
import { useAppVersionMutation } from "@/api/ops/mutateAppVersion";
import { Edit, Plus, Smartphone } from "@/icons";
import { formatDateTime } from "@/lib/dayjs";
import { showErrorToast } from "@/lib/toast";
import type { AppPlatform, AppVersion, AppVersionFormValues } from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import AppVersionFormModal from "./AppVersionFormModal";

/** 스토어 표기와 동일한 플랫폼 라벨을 쓴다. */
const PLATFORM_LABEL: Record<AppPlatform, string> = {
  IOS: "iOS",
  AOS: "Android",
};

/** 카드 안에서 반복되는 라벨 + 값 한 줄 */
const VersionRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 border-t border-border-main py-3 first:border-t-0 first:pt-0">
    <span className="text-[13px] text-font-2">{label}</span>
    <span className="text-[14px] font-medium text-font-1 tabular-nums">
      {value}
    </span>
  </div>
);

const AppVersionManager = () => {
  const { data, isLoading } = useAppVersionListQuery();
  const { createMutation, updateMutation } = useAppVersionMutation();

  const [editingVersion, setEditingVersion] = useState<AppVersion | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const appVersions = data ?? [];

  const handleOpenCreate = () => {
    setEditingVersion(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (appVersion: AppVersion) => {
    setEditingVersion(appVersion);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: AppVersionFormValues) => {
    if (editingVersion) {
      updateMutation.mutate(
        { versionId: editingVersion.versionId, values },
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

  return (
    <>
      <Alert tone="info">
        앱은 실행 시 이 정책을 조회합니다. 최소 지원 버전보다 낮은 앱에는 안내
        문구와 함께 업데이트 화면이 노출됩니다.
      </Alert>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-[300px] w-full rounded-card" />
          ))}
        </div>
      )}

      {!isLoading && appVersions.length === 0 && (
        <Card>
          <EmptyState
            icon={<Smartphone size={40} />}
            title="등록된 앱 버전 정책이 없습니다."
            description="플랫폼별 최신·최소 버전을 등록해 업데이트 안내를 시작해 보세요."
            action={
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={15} />}
                onClick={handleOpenCreate}
              >
                정책 등록
              </Button>
            }
          />
        </Card>
      )}

      {!isLoading && appVersions.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {appVersions.map((appVersion) => (
            <Card
              key={appVersion.versionId}
              title={
                <span className="flex items-center gap-2">
                  {PLATFORM_LABEL[appVersion.platform]}
                  <Badge tone={appVersion.isForceUpdate ? "danger" : "neutral"}>
                    {appVersion.isForceUpdate ? "강제 업데이트" : "선택 업데이트"}
                  </Badge>
                </span>
              }
              description={`최종 수정 ${formatDateTime(appVersion.updatedAt)}`}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Edit size={15} />}
                  onClick={() => handleOpenEdit(appVersion)}
                >
                  수정
                </Button>
              }
            >
              <VersionRow label="최신 버전" value={appVersion.latestVersion} />
              <VersionRow
                label="최소 지원 버전"
                value={appVersion.minimumVersion}
              />
              <VersionRow
                label="강제 업데이트"
                value={appVersion.isForceUpdate ? "사용" : "미사용"}
              />

              <div className="border-t border-border-main pt-3">
                <p className="text-[13px] text-font-2">안내 문구</p>
                <p className="mt-1.5 rounded-field bg-subtle px-3 py-2.5 text-[13px] leading-relaxed text-font-1">
                  {appVersion.updateMessage}
                </p>
              </div>
            </Card>
          ))}

          {/* 두 플랫폼이 모두 등록되면 추가 등록은 필요 없다. */}
          {appVersions.length < 2 && (
            <Card>
              <EmptyState
                icon={<Smartphone size={40} />}
                title="아직 등록하지 않은 플랫폼이 있습니다."
                description="남은 플랫폼의 버전 정책을 등록해 주세요."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus size={15} />}
                    onClick={handleOpenCreate}
                  >
                    정책 등록
                  </Button>
                }
              />
            </Card>
          )}
        </div>
      )}

      <AppVersionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        appVersion={editingVersion}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
};

export default AppVersionManager;
