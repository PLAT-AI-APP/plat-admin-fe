"use client";

import { useState } from "react";
import { liveAxios } from "@/api";
import { Download } from "@/icons";
import { showAppToast, showErrorToast } from "@/lib/toast";
import Button from "./Button";

interface ServerCsvExportButtonProps {
  /** 내보내기 엔드포인트(POST). 예: `/payment-orders/export` */
  path: string;
  /** 쿼리스트링으로 실을 조건. 빈 값은 부르는 쪽에서 빼서 넘긴다. */
  params?: Record<string, string | number | boolean | undefined>;
  /** 저장할 파일 이름(확장자 포함). 응답 헤더는 CORS 로 읽지 못해 화면이 정한다. */
  fileName: string;
  disabled?: boolean;
  /** 버튼에 마우스를 올렸을 때 보일 안내. 비활성 이유를 적는다. */
  title?: string;
  label?: string;
}

/**
 * 서버가 조건에 맞는 **전체**를 CSV 로 만들어 주는 내보내기.
 *
 * 옆의 `CsvExportButton` 은 지금 페이지에 보이는 행만 담는다. 정산 · 감사처럼 기간 전체가
 * 필요하면 이 버튼을 쓴다. 파일이 클 수 있어 받는 동안은 다시 누르지 못하게 막는다.
 */
const ServerCsvExportButton = ({
  path,
  params,
  fileName,
  disabled = false,
  title = "조건에 맞는 전체 목록을 서버에서 CSV로 받아 저장합니다.",
  label = "전체 내보내기",
}: ServerCsvExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleClick = async () => {
    setIsExporting(true);

    try {
      const response = await liveAxios.post<Blob>(path, undefined, {
        params,
        responseType: "blob",
      });
      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data as BlobPart], {
              type: "text/csv;charset=utf-8;",
            });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = fileName;
      anchor.click();

      URL.revokeObjectURL(url);
      showAppToast("success", `${fileName} 파일을 저장했습니다.`);
    } catch (error) {
      showErrorToast(
        error,
        "CSV를 내보내지 못했습니다. 조건을 확인하고 다시 시도해 주세요.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      leftIcon={<Download size={15} />}
      onClick={handleClick}
      disabled={disabled || isExporting}
      isLoading={isExporting}
      title={title}
    >
      {label}
    </Button>
  );
};

export default ServerCsvExportButton;
