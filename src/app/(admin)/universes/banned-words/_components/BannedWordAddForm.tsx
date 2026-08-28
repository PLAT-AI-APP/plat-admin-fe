"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Plus } from "@/icons";
import {
  bannedWordSchema,
  type BannedWordSchema,
} from "@/schema/bannedWord.schema";
import type { BannedWordType } from "@/type/bannedWord";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";

interface BannedWordAddFormProps {
  /** 지금 보고 있는 탭. 무엇을 등록하는지는 탭이 정한다. */
  type: BannedWordType;
  onSubmit: (values: BannedWordSchema, onSuccess: () => void) => void;
  isSubmitting: boolean;
}

const emptyValues = (type: BannedWordType): BannedWordSchema => ({
  word: "",
  type,
});

const FORM_COPY: Record<BannedWordType, { title: string; description: string }> =
  {
    BAN: {
      title: "금지어 추가",
      description:
        "등록 즉시 검사에 반영됩니다. 이 단어가 들어간 글은 등록되지 않습니다.",
    },
    EXCEPT: {
      title: "예외어 추가",
      description:
        "금지어를 품고 있지만 문제가 없는 말을 등록합니다. '졸라'를 막아 둔 채 '고르곤졸라'만 풀어 주는 식입니다.",
    },
  };

/**
 * 목록 상단 인라인 추가 폼.
 *
 * 고를 것이 없다. 유형은 지금 보고 있는 탭이 정하고, 걸렸을 때 무엇을 할지는 하나뿐이다.
 * 칸을 하나 더 두면 탭과 어긋난 값을 고를 수 있게 되고 그때 무엇이 맞는지는 아무도 모른다.
 */
const BannedWordAddForm = ({
  type,
  onSubmit,
  isSubmitting,
}: BannedWordAddFormProps) => {
  const isBan = type === "BAN";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BannedWordSchema>({
    resolver: zodResolver(bannedWordSchema),
    defaultValues: emptyValues(type),
  });

  // 탭을 옮기면 폼도 그쪽 유형으로 새로 시작한다. 쓰다 만 값이 다른 탭으로 따라가지 않는다.
  useEffect(() => {
    reset(emptyValues(type));
  }, [type, reset]);

  // 등록에 성공했을 때만 입력값을 비운다. 실패하면 다시 입력하지 않아도 되게 남겨 둔다.
  const submit = handleSubmit((values) =>
    onSubmit(values, () => reset(emptyValues(type))),
  );

  return (
    <Card title={FORM_COPY[type].title} description={FORM_COPY[type].description}>
      <form onSubmit={submit} className="flex items-start gap-2">
        <FormField
          label="단어"
          htmlFor="banned-word"
          required
          error={errors.word?.message}
          className="flex-1"
        >
          <Input
            id="banned-word"
            placeholder={
              isBan ? "걸러 낼 단어를 입력하세요" : "풀어 줄 단어를 입력하세요"
            }
            hasError={Boolean(errors.word)}
            {...register("word")}
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

export default BannedWordAddForm;
