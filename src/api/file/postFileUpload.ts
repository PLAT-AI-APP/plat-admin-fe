import { useMutation } from "@tanstack/react-query";
import { liveAxios } from "..";
import type { AppError } from "@/type/api";

/**
 * 업로드 용도.
 *
 * **서버에 실제 업로드 경로가 있는 용도만 둔다.** 관리자 업로드는 자료마다
 * 권한이 다르므로 공용 업로드 엔드포인트가 없고, 그 자료의 경로 아래에
 * 하나씩 뚫려 있다. 새 화면이 이미지를 올리려면 서버에 그 경로부터 만든다.
 */
export type FileUploadType = "MAIN_BANNER";

/** 용도별 업로드 경로. 권한이 그 자료의 것을 그대로 따르므로 경로도 자료 밑에 있다. */
const UPLOAD_PATH: Record<FileUploadType, string> = {
  MAIN_BANNER: "/admin/main-banners/image",
};

/** 업로드 응답. URL이 아니라 파일 ID만 온다 — 이미지 URL은 화면이 조립한다. */
export interface FileUploadResponse {
  fileId: string;
}

export interface PostFileUploadParams {
  fileType: FileUploadType;
  file: File;
}

export const postFileUpload = async ({
  fileType,
  file,
}: PostFileUploadParams) => {
  // 업로드 API는 multipart/form-data의 file 필드만 요구한다.
  const formData = new FormData();
  formData.append("file", file);

  const response = await liveAxios.post<FileUploadResponse>(
    UPLOAD_PATH[fileType],
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  // fileId가 없으면 이후 저장 API에 잘못된 값을 넘기므로 여기서 먼저 중단한다.
  if (!response.data?.fileId) {
    throw new Error("업로드 응답에 fileId가 없습니다.");
  }

  return response.data;
};

/** 이미지 파일을 업로드하고 저장 API에 넘길 파일 ID를 발급받습니다. */
export const useFileUploadMutation = () => {
  return useMutation<FileUploadResponse, AppError, PostFileUploadParams>({
    mutationKey: ["post-file-upload"],
    mutationFn: postFileUpload,
  });
};
