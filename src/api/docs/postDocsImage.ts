import { useMutation } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";
import type { DocsImage } from "@/type/docs";

/**
 * 문서 이미지 업로드. 파일 ID 와 공개 URL 이 함께 온다 — 아이콘 · 커버는 ID 를 저장하고,
 * 본문은 `![](url)` 로 넣는다. 서버는 이미지를 임시로 받아 두고, 문서가 저장하며 가리켜야 남긴다.
 */
export const postDocsImage = async (file: File): Promise<DocsImage> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await liveAxios.post<DocsImage>("/docs/images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  if (!response.data?.fileId || !response.data?.url) {
    throw new Error("업로드 응답에 fileId · url 이 없습니다.");
  }

  return response.data;
};

export const useDocsImageMutation = () => {
  return useMutation<DocsImage, AppError, File>({
    mutationKey: ["post-docs-image"],
    mutationFn: postDocsImage,
  });
};
