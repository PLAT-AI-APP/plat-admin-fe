"use client";

import { useState, type FormEvent } from "react";
import { useContentReviewSettingsQuery } from "@/api/contentReview/getContentReviews";
import {
  MAX_CONCURRENT_MAX,
  MAX_CONCURRENT_MIN,
  useContentReviewSettingsMutation,
} from "@/api/contentReview/mutateContentReviewSettings";
import { formatDateTime } from "@/lib/dayjs";
import { useHasPermission } from "@/store/useAdminStore";
import type { ContentReviewSettings } from "@/type/contentReview";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

/** 저장된 값으로 입력을 채운다. 저장 뒤 값이 바뀌면 key 로 새로 그려 입력을 맞춘다. */
const SettingsForm = ({ settings }: { settings: ContentReviewSettings }) => {
  const canWrite = useHasPermission("universe:write");
  const mutation = useContentReviewSettingsMutation();
  const [value, setValue] = useState(String(settings.maxConcurrent));

  const parsed = Number(value);
  const isValid =
    Number.isInteger(parsed) && parsed >= MAX_CONCURRENT_MIN && parsed <= MAX_CONCURRENT_MAX;
  const isChanged = parsed !== settings.maxConcurrent;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid || !isChanged) return;
    mutation.mutate(parsed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="body-5 text-font-2">지금 실행 중</span>
        {/* 한도를 낮춘 직후에는 실행 중인 수가 한도보다 클 수 있다. 진행 중인 검수는 끊지 않는다. */}
        <span className="title-2 font-mono tabular-nums text-font-1">
          {settings.activeExecutions} / {settings.maxConcurrent}
        </span>
        <span className="body-6 text-font-2">
          마지막 변경 {formatDateTime(settings.updatedAt)}
          {settings.updatedBy && ` · 관리자 ${settings.updatedBy}`}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="body-5 text-font-2">
            최대 동시 검수 수 ({MAX_CONCURRENT_MIN}~{MAX_CONCURRENT_MAX})
          </span>
          <Input
            type="number"
            inputMode="numeric"
            min={MAX_CONCURRENT_MIN}
            max={MAX_CONCURRENT_MAX}
            step={1}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            hasError={value !== "" && !isValid}
            disabled={!canWrite}
            inputBoxClassName="w-32"
          />
        </label>
        <Button
          type="submit"
          disabled={!canWrite || !isValid || !isChanged || mutation.isPending}
          isLoading={mutation.isPending}
        >
          저장
        </Button>
      </div>
    </form>
  );
};

/**
 * 동시 검수 수. 모든 AI 서버가 함께 쓰는 한도라 세계관 · 이미지 검수가 몰려도 이 수만큼만 AI 를 부른다.
 * 한 건이 끝날 때마다 다음 대기 건을 채우고, 바꾼 값은 재시작 없이 다음 작업부터 적용된다.
 */
const ReviewSettingsCard = () => {
  const { data } = useContentReviewSettingsQuery();

  return (
    <Card
      title="동시 검수 수"
      description="모든 AI 서버를 합쳐 한 번에 검수할 수 있는 최대 개수입니다. 진행 중인 검수는 유지되고 다음 작업부터 적용됩니다."
    >
      {data ? (
        <SettingsForm key={`${data.maxConcurrent}-${data.updatedAt}`} settings={data} />
      ) : (
        <p className="body-5 text-font-2">설정을 불러오는 중입니다.</p>
      )}
    </Card>
  );
};

export default ReviewSettingsCard;
