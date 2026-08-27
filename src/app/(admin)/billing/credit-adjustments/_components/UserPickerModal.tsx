"use client";

import Image from "next/image";
import { useState } from "react";
import { useAdjustableUserListQuery } from "@/api/billing/getAdjustableUserList";
import { Users } from "@/icons";
import { formatCredit } from "@/lib/utils";
import type { User } from "@/type/user";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Skeleton from "@/components/ui/Skeleton";

interface UserPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 유저를 고르면 즉시 닫힌다. 조정 대상은 항상 1명이다. */
  onSelect: (user: User) => void;
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

  const handleSelect = (user: User) => {
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
    >
      <div className="flex flex-col gap-4">
        <SearchInput
          value={keyword}
          onSearch={handleSearch}
          placeholder="닉네임 또는 유저 ID 검색"
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
            description="닉네임 일부나 유저 ID로 다시 검색해 보세요."
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
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-subtle">
                    <Image
                      src={user.profileImageUrl}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate body-4 font-medium text-font-1">
                      {user.nickname}
                    </p>
                    <p className="mt-0.5 truncate body-6 text-font-2">
                      #{user.userId} · {user.email}
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
