"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus } from "@/icons";
import {
  nsfwKeywordSchema,
  type NsfwKeywordSchema,
} from "@/schema/nsfwKeyword.schema";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { NSFW_LEVEL_OPTIONS } from "../../_constants/character";

interface NsfwKeywordAddFormProps {
  onSubmit: (values: NsfwKeywordSchema, onSuccess: () => void) => void;
  isSubmitting: boolean;
}

/** 차단이 기본값이다. 실수로 경고만 걸리는 것보다 과하게 막는 편이 안전하다. */
const EMPTY_VALUES: NsfwKeywordSchema = {
  keyword: "",
  level: "BLOCK",
};

/**
 * 목록 상단 인라인 추가 폼.
 * 필드가 두 개뿐이라 별도 모달 없이 화면에서 바로 등록한다.
 */
const NsfwKeywordAddForm = ({
  onSubmit,
  isSubmitting,
}: NsfwKeywordAddFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NsfwKeywordSchema>({
    resolver: zodResolver(nsfwKeywordSchema),
    defaultValues: EMPTY_VALUES,
  });

  // 등록에 성공했을 때만 입력값을 비운다. 실패하면 다시 입력하지 않아도 되게 남겨 둔다.
  const submit = handleSubmit((values) =>
    onSubmit(values, () => reset(EMPTY_VALUES)),
  );

  return (
    <Card
      title="키워드 추가"
      description="차단(BLOCK)은 캐릭터 생성 자체를 막고, 경고(WARN)는 적중 기록만 남깁니다."
    >
      <form onSubmit={submit} className="flex items-start gap-2">
        <FormField
          label="키워드"
          htmlFor="nsfw-keyword"
          required
          error={errors.keyword?.message}
          className="flex-1"
        >
          <Input
            id="nsfw-keyword"
            placeholder="차단할 단어를 입력하세요"
            hasError={Boolean(errors.keyword)}
            {...register("keyword")}
          />
        </FormField>

        <FormField
          label="레벨"
          htmlFor="nsfw-level"
          required
          error={errors.level?.message}
          className="w-48"
        >
          <Select
            id="nsfw-level"
            options={NSFW_LEVEL_OPTIONS}
            hasError={Boolean(errors.level)}
            {...register("level")}
          />
        </FormField>

        {/* 라벨 한 줄 높이만큼 내려 입력 칸과 같은 줄에 맞춘다. */}
        <Button
          type="submit"
          variant="primary"
          leftIcon={<Plus size={15} />}
          isLoading={isSubmitting}
          className="mt-6"
        >
          추가
        </Button>
      </form>
    </Card>
  );
};

export default NsfwKeywordAddForm;
