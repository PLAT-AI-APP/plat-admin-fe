"use client";

import { useState } from "react";
import { useHashtagListQuery } from "@/api/hashtag/getHashtagList";
import { Check, Hash, Search } from "@/icons";
import { cn } from "@/lib/utils";
import { resolveHashtagLabel } from "@/type/hashtag";
import type { ServiceLanguage } from "@/type/language";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";

interface HashtagSelectFieldProps {
  value: number[];
  onChange: (hashtagIds: number[]) => void;
  /** 고를 수 있는 최대 개수 */
  maxCount?: number;
  /** 라벨을 보여줄 언어. 지금 편집 중인 언어와 맞춘다. */
  language?: ServiceLanguage;
}

/** 후보 목록 크기. 검색으로 좁혀 쓰는 자리라 한 번에 많이 보여줄 이유가 없다. */
const CANDIDATE_SIZE = 40;

/**
 * 해시태그 선택.
 *
 * **자유 입력이 아니라 등록된 해시태그에서 고른다.** 문자열로 적게 두면
 * 앱에 없는 태그가 배너에만 뜨고, 나중에 태그 이름을 바꿔도 배너는 옛 이름을
 * 들고 있는다. 노출 중인 태그만 후보로 보여 준다.
 */
const HashtagSelectField = ({
  value,
  onChange,
  maxCount = 5,
  language = "KO",
}: HashtagSelectFieldProps) => {
  const [keyword, setKeyword] = useState("");

  const { data, isLoading } = useHashtagListQuery({
    page: 1,
    size: CANDIDATE_SIZE,
    keyword,
    isActive: "true",
    sort: "USAGE",
  });

  const candidates = data?.content ?? [];
  const selected = candidates.filter((hashtag) =>
    value.includes(hashtag.hashtagId),
  );

  const toggle = (hashtagId: number) => {
    if (value.includes(hashtagId)) {
      onChange(value.filter((id) => id !== hashtagId));
      return;
    }

    if (value.length >= maxCount) return;

    onChange([...value, hashtagId]);
  };

  return (
    <div className="flex flex-col gap-2 rounded-field border border-border-main p-3">
      <div className="flex items-center justify-between gap-2">
        <Input
          leftIcon={<Search size={15} />}
          placeholder="해시태그 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          inputBoxClassName="h-9 flex-1"
        />

        <span className="shrink-0 text-[12px] text-font-2 tabular-nums">
          {value.length}/{maxCount}
        </span>
      </div>

      {/*
        선택한 태그가 검색 결과 밖으로 밀려도 무엇을 골랐는지는 항상 보여야 한다.
        (검색어를 바꾸면 후보 목록만 바뀐다)
      */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((hashtag) => (
            <Badge key={hashtag.hashtagId} tone="brand">
              #{resolveHashtagLabel(hashtag, language)}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex max-h-44 flex-wrap content-start gap-1.5 overflow-y-auto scrollbar-thin">
        {isLoading &&
          Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-20 rounded-full" />
          ))}

        {!isLoading && candidates.length === 0 && (
          <p className="py-4 text-center text-[13px] text-font-2">
            조건에 맞는 해시태그가 없습니다.
          </p>
        )}

        {!isLoading &&
          candidates.map((hashtag) => {
            const isChecked = value.includes(hashtag.hashtagId);
            const isDisabled = !isChecked && value.length >= maxCount;

            return (
              <button
                key={hashtag.hashtagId}
                type="button"
                disabled={isDisabled}
                onClick={() => toggle(hashtag.hashtagId)}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[12px] transition",
                  isChecked
                    ? "border-brand bg-brand-opacity text-brand"
                    : "border-border-main text-font-2 hover:border-brand hover:text-font-1",
                  isDisabled && "cursor-not-allowed opacity-40",
                )}
              >
                {isChecked ? <Check size={12} /> : <Hash size={12} />}
                {resolveHashtagLabel(hashtag, language)}
                {hashtag.isAdult && <span className="text-danger">19</span>}
              </button>
            );
          })}
      </div>
    </div>
  );
};

export default HashtagSelectField;
