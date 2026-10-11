import { useMutation } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";

interface DocsImageResponse {
  url: string;
}

/**
 * 문서 이미지 업로드. 다른 업로드와 달리 파일 ID가 아니라 **공개 URL**이 온다 —
 * 마크다운 본문에 `![](url)` 로 그대로 박히기 때문이다.
 */
export const postDocsImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await liveAxios.post<DocsImageResponse>(
    "/docs/images",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  if (!response.data?.url) {
    throw new Error("업로드 응답에 url 이 없습니다.");
  }

  return response.data.url;
};

export const useDocsImageMutation = () => {
  return useMutation<string, AppError, File>({
    mutationKey: ["post-docs-image"],
    mutationFn: postDocsImage,
  });
};
