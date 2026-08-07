import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAxios } from "..";
import type { AppError } from "@/type/api";
import type { DummyCreator, DummyCreatorFormValues } from "@/type/user";
import { showAppToast } from "@/lib/toast";

export const createDummyCreator = async (values: DummyCreatorFormValues) => {
  const response = await adminAxios.post<DummyCreator>(
    "/admin/dummy-creators",
    values,
  );

  return response.data;
};

export const updateDummyCreator = async (
  creatorId: number,
  values: DummyCreatorFormValues,
) => {
  const response = await adminAxios.put<DummyCreator>(
    `/admin/dummy-creators/${creatorId}`,
    values,
  );

  return response.data;
};

/** 더미 크리에이터 생성·수정 후 목록을 갱신합니다. */
export const useDummyCreatorMutation = () => {
  const queryClient = useQueryClient();

  const invalidateDummyCreatorList = () =>
    queryClient.invalidateQueries({ queryKey: ["get-dummy-creator-list"] });

  const createMutation = useMutation<
    DummyCreator,
    AppError,
    DummyCreatorFormValues
  >({
    mutationFn: createDummyCreator,
    onSuccess: () => {
      showAppToast("success", "더미 크리에이터를 생성했습니다.");
      invalidateDummyCreatorList();
    },
  });

  const updateMutation = useMutation<
    DummyCreator,
    AppError,
    { creatorId: number; values: DummyCreatorFormValues }
  >({
    mutationFn: ({ creatorId, values }) => updateDummyCreator(creatorId, values),
    onSuccess: () => {
      showAppToast("success", "더미 크리에이터를 수정했습니다.");
      invalidateDummyCreatorList();
    },
  });

  return { createMutation, updateMutation };
};
