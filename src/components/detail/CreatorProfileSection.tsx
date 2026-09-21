"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useUserDetailQuery } from "@/api/user/getUserDetail";
import { ChevronRight } from "@/icons";
import { formatDate } from "@/lib/dayjs";
import { resolveImageUrl } from "@/lib/imageUrl";
import { formatWithCommas } from "@/lib/utils";
import EntityImage from "@/components/ui/EntityImage";
import Skeleton from "@/components/ui/Skeleton";
import DetailSection from "./DetailSection";

interface CreatorProfileSectionProps {
  id: string;
  /**
   * 제작자의 **유저** ID. 크리에이터 ID가 아니다 — 두 값은 따로 발급되어
   * 서로 넣으면 조용히 빈 결과가 된다. 연결된 유저가 없으면 null.
   */
  userId: string | null;
  /** 유저 조회가 안 될 때도 이름은 남긴다. 상세 응답에 함께 오는 값이다. */
  fallbackNickname: string | null;
  /** 유저 ID가 없을 때 대신 적는 식별자(크리에이터 ID 등) */
  fallbackId?: string;
  /** 이름 옆 칩. 크리에이터 등급 · 상태처럼 응답에 따라온 값을 붙인다. */
  chips?: ReactNode;
}

/**
 * 상세 화면의 제작자 섹션.
 *
 * 세계관 · 캐릭터 응답은 제작자를 닉네임과 ID로만 준다. 문의 · 제재 판단에는
 * "이 사람이 무엇을 얼마나 만들었나"가 필요해 유저 상세를 한 번 더 부른다.
 * 유저를 못 찾으면(연결된 유저 없음 · 목업 데이터) 이름과 ID만 남긴다.
 */
const CreatorProfileSection = ({
  id,
  userId,
  fallbackNickname,
  fallbackId,
  chips,
}: CreatorProfileSectionProps) => (
  <DetailSection id={id} title="제작자">
    {userId ? (
      <CreatorProfile
        userId={userId}
        fallbackNickname={fallbackNickname}
        chips={chips}
      />
    ) : (
      <CreatorIdentity
        nickname={fallbackNickname}
        idLabel={fallbackId ? `#${fallbackId}` : undefined}
        chips={chips}
      />
    )}
  </DetailSection>
);

const CreatorProfile = ({
  userId,
  fallbackNickname,
  chips,
}: {
  userId: string;
  fallbackNickname: string | null;
  chips?: ReactNode;
}) => {
  const { data: user, isLoading, isError } = useUserDetailQuery(userId);

  if (isLoading) return <Skeleton className="h-28 w-full rounded-field" />;

  if (isError || !user) {
    return (
      <CreatorIdentity
        nickname={fallbackNickname}
        idLabel={`#${userId}`}
        note="유저 정보를 불러오지 못했습니다."
        chips={chips}
      />
    );
  }

  /*
    누적 대화량 · 좋아요는 이 사람이 **만든 세계관**의 합이다. `chatCount`는 이 사람이
    플레이어로 연 채팅방 수라 제작자 성과로 읽으면 틀린다.
  */
  const stats = [
    { label: "제작 캐릭터", value: user.characterCount },
    { label: "제작 세계관", value: user.universeCount },
    { label: "누적 대화량", value: user.universeChatCount },
    { label: "누적 좋아요", value: user.universeLikeCount },
  ];

  return (
    <Link
      href={`/users/${user.userId}`}
      className="-m-2 flex items-start gap-4 rounded-field p-2 transition hover:bg-surface-hover"
    >
      <EntityImage
        src={resolveImageUrl(
          user.profileImageUrl,
          user.profileImageFileId,
          "USER_PROFILE",
          "SQ80",
        )}
        alt={user.nickname}
        ratio="square"
        shape="chip"
        className="w-26 shrink-0"
      />

      <div className="flex min-w-0 flex-1 flex-col self-stretch py-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="min-w-0 truncate">
              <span className="title-5 text-font-0">{user.nickname}</span>
              <span className="ml-1.5 body-6 text-font-disabled tabular-nums">
                #{user.userId}
              </span>
            </p>
            {chips}
          </div>

          <span className="flex shrink-0 items-center gap-1 body-6 text-font-1 tabular-nums">
            최근 활동 {formatDate(user.lastLoginAt)}
            <ChevronRight size={14} className="text-font-2" />
          </span>
        </div>

        {user.bio?.trim() ? (
          <p className="mt-2 line-clamp-2 body-5 text-font-1">{user.bio}</p>
        ) : (
          <p className="mt-2 body-5 text-font-disabled">
            한 줄 소개가 없습니다.
          </p>
        )}

        <p className="mt-auto flex flex-wrap gap-x-4 pt-3 body-6 text-font-1 tabular-nums">
          {stats.map((stat) => (
            <span key={stat.label}>
              {stat.label} {formatWithCommas(stat.value)}
            </span>
          ))}
        </p>
      </div>
    </Link>
  );
};

/** 유저를 못 찾았을 때의 최소 표기. 누를 곳이 없으니 링크를 걸지 않는다. */
const CreatorIdentity = ({
  nickname,
  idLabel,
  note,
  chips,
}: {
  nickname: string | null;
  idLabel?: string;
  note?: string;
  chips?: ReactNode;
}) => (
  <div className="flex items-center gap-4">
    <EntityImage
      alt={nickname ?? "제작자"}
      ratio="square"
      shape="chip"
      className="w-26 shrink-0"
    />
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-1.5">
        <p className="min-w-0 truncate">
          <span className="title-5 text-font-0">
            {nickname ?? "이름 없음"}
          </span>
          {idLabel && (
            <span className="ml-1.5 body-6 text-font-disabled tabular-nums">
              {idLabel}
            </span>
          )}
        </p>
        {chips}
      </div>
      {note && <p className="mt-1 body-6 text-font-disabled">{note}</p>}
    </div>
  </div>
);

export default CreatorProfileSection;
