"use client";

import Image from "next/image";
import { useState } from "react";
import { useDummyCreatorListQuery } from "@/api/user/getDummyCreatorList";
import { useDummyCreatorMutation } from "@/api/user/mutateDummyCreator";
import { Edit, Plus, UserPlus } from "@/icons";
import { formatDate } from "@/lib/dayjs";
import { formatWithCommas } from "@/lib/utils";
import type { DummyCreator, DummyCreatorFormValues } from "@/type/user";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import SearchInput from "@/components/ui/SearchInput";
import Switch from "@/components/ui/Switch";
import Table, { TableCellStack } from "@/components/ui/Table";
import type { TableColumn } from "@/components/ui/Table";
import DummyCreatorFormModal from "./DummyCreatorFormModal";

const DummyCreatorManager = () => {
  const [keyword, setKeyword] = useState("");
  const [editingCreator, setEditingCreator] = useState<DummyCreator | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, isLoading } = useDummyCreatorListQuery({
    keyword: keyword || undefined,
  });

  const { createMutation, updateMutation } = useDummyCreatorMutation();

  const creators = data ?? [];

  const handleOpenCreate = () => {
    setEditingCreator(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (creator: DummyCreator) => {
    setEditingCreator(creator);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: DummyCreatorFormValues) => {
    if (editingCreator) {
      updateMutation.mutate(
        { creatorId: editingCreator.creatorId, values },
        { onSuccess: () => setIsFormOpen(false) },
      );
      return;
    }

    createMutation.mutate(values, { onSuccess: () => setIsFormOpen(false) });
  };

  /** 활성 토글은 표에서 바로 저장한다. 나머지 값은 그대로 다시 보낸다. */
  const handleToggleActive = (creator: DummyCreator, isActive: boolean) => {
    updateMutation.mutate({
      creatorId: creator.creatorId,
      values: {
        nickname: creator.nickname,
        profileImageUrl: creator.profileImageUrl,
        bio: creator.bio,
        isActive,
      },
    });
  };

  const columns: TableColumn<DummyCreator>[] = [
    {
      key: "creator",
      header: "크리에이터",
      render: (creator) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-subtle">
            <Image
              src={creator.profileImageUrl}
              alt=""
              fill
              sizes="36px"
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="min-w-0">
            <TableCellStack
              primary={creator.nickname}
              secondary={`#${creator.creatorId}`}
            />
          </div>
        </div>
      ),
    },
    {
      key: "bio",
      header: "소개",
      render: (creator) => (
        <p className="max-w-100 truncate text-[13px] text-font-2">
          {creator.bio || "-"}
        </p>
      ),
    },
    {
      key: "characterCount",
      header: "보유 캐릭터",
      align: "right",
      numeric: true,
      render: (creator) => formatWithCommas(creator.characterCount),
    },
    {
      key: "isActive",
      header: "활성",
      align: "center",
      render: (creator) => (
        <div className="flex justify-center">
          <Switch
            label={`${creator.nickname} 활성 여부`}
            checked={creator.isActive}
            onChange={(isActive) => handleToggleActive(creator, isActive)}
            disabled={updateMutation.isPending}
          />
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "생성일",
      numeric: true,
      render: (creator) => (
        <span className="text-[13px] text-font-2">
          {formatDate(creator.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "56px",
      align: "center",
      render: (creator) => (
        <div className="flex justify-center">
          <IconButton
            label="수정"
            icon={<Edit size={16} />}
            onClick={() => handleOpenEdit(creator)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Alert tone="info" title="초기 콘텐츠 운영용 계정입니다.">
        더미 크리에이터는 서비스 초기에 캐릭터·세계관을 채우기 위한 운영 계정입니다.
        비활성으로 바꾸면 앱에서 해당 크리에이터의 프로필이 노출되지 않습니다.
      </Alert>

      <Card noPadding>
        <div className="flex items-center justify-between gap-3 border-b border-border-main px-5 py-3.5">
          <SearchInput
            value={keyword}
            onSearch={setKeyword}
            placeholder="닉네임 · 소개 검색"
          />

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={handleOpenCreate}
          >
            크리에이터 생성
          </Button>
        </div>

        <Table
          columns={columns}
          rows={creators}
          getRowKey={(creator) => String(creator.creatorId)}
          isLoading={isLoading}
          skeletonRows={5}
          emptyTitle="등록된 더미 크리에이터가 없습니다."
          emptyDescription="초기 콘텐츠를 채울 운영 계정을 먼저 만들어 보세요."
          emptyAction={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus size={15} />}
              onClick={handleOpenCreate}
            >
              크리에이터 생성
            </Button>
          }
        />
      </Card>

      <DummyCreatorFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        creator={editingCreator}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
};

export default DummyCreatorManager;
