"use client";

import { useState } from "react";
import { useAdjustableUserListQuery } from "@/api/billing/getAdjustableUserList";
import { Users } from "@/icons";
import { resolveImageUrl } from "@/lib/imageUrl";
import { formatCredit } from "@/lib/utils";
import type { AdjustableUser } from "@/type/user";
import EmptyState from "@/components/ui/EmptyState";
import EntityImage from "@/components/ui/EntityImage";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Skeleton from "@/components/ui/Skeleton";

interface UserPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 유저를 고르면 즉시 닫힌다. 조정 대상은 항상 1명이다. */
  onSelect: (user: AdjustableUser) => void;
}

const PAGE_SIZE = 6;

const UserPickerModal = ({ isOpen, onClose, onSelect }: UserPickerModalProps) => {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");

  const { data, isLoading } = useAdjustableUserListQuery(
    { page, size: PAGE_SIZE, keyword },
    isOpen,
  );

  const handleSearch = (nextKeyword: string) => {
    setKeyword(nextKeyword);
    setPage(1);
  };

  const handleSelect = (user: AdjustableUser) => {
    onSelect(user);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="조정 대상 유저 선택"
      description="닉네임, 이메일, 유저 ID로 검색할 수 있습니다."
      size="md"
      // 검색 결과가 0~6건으로 오가도 목록 자리는 그대로 둔다.
      minHeight="lg"
    >
      <div className="flex flex-col gap-4">
        <SearchInput
          value={keyword}
          onSearch={handleSearch}
          placeholder="닉네임 · 이메일 · 유저 ID 검색"
          boxClassName="w-full"
        />

        {isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-field" />
            ))}
          </div>
        )}

        {!isLoading && data?.content.length === 0 && (
          <EmptyState
            icon={<Users size={40} />}
            title="검색 결과가 없습니다."
            description="닉네임·이메일 일부나 유저 ID 전체로 다시 검색해 보세요. 탈퇴한 유저는 조정할 수 없어 나오지 않습니다."
          />
        )}

        {!isLoading && (
          <ul className="flex flex-col gap-2">
            {data?.content.map((user) => (
              <li key={user.userId}>
                <button
                  type="button"
                  onClick={() => handleSelect(user)}
                  className="flex w-full items-center gap-3 rounded-field border border-border-main p-3 text-left transition hover:border-brand hover:bg-surface-hover"
                >
                  {/* 서버는 URL을 만들지 못하고 fileId만 준다. 둘 중 오는 쪽을 쓴다. */}
                  <EntityImage
                    src={resolveImageUrl(
                      user.profileImageUrl,
                      user.profileImageFileId,
                      "USER_PROFILE",
                      "SQ40",
                    )}
                    alt=""
                    ratio="square"
                    shape="circle"
                    fallback={
                      <span className="title-5 text-font-2">
                        {user.nickname.trim().charAt(0) || "?"}
                      </span>
                    }
                    className="size-10 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate body-4 font-medium text-font-1">
                      {user.nickname}
                    </p>
                    <p className="mt-0.5 truncate body-6 text-font-2">
                      #{user.userId}
                      {user.email ? ` · ${user.email}` : ""}
                    </p>
                  </div>

                  <span className="shrink-0 body-5 font-medium text-font-1 tabular-nums">
                    {formatCredit(user.creditBalance)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {data && data.totalCount > PAGE_SIZE && (
          <Pagination
            page={page}
            totalCount={data.totalCount}
            pageSize={PAGE_SIZE}
            onChange={setPage}
            className="border-t-0 px-0 pb-0"
          />
        )}
      </div>
    </Modal>
  );
};

export default UserPickerModal;
