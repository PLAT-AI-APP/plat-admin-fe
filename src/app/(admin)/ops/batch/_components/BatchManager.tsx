"use client";

import { useListParams } from "@/hooks/useListParams";
import BatchJobBoard from "./BatchJobBoard";
import BatchRunTable from "./BatchRunTable";

/** 잡 선택과 이력 필터를 한 벌로 모아 주소에 싣는다. */
const DEFAULT_PARAMS = {
  page: 1,
  jobKey: "",
  status: "",
  trigger: "",
};

/**
 * 배치 관리.
 *
 * 위는 **지금 상태**(잡 정의와 최근 실행 결과), 아래는 **지나간 일**(실행 이력)이다.
 * 이력만 있으면 "어제 안 돈 잡이 있는가"에 답할 수 없고, 정의만 있으면
 * "왜 실패했나"에 답할 수 없어 둘을 한 화면에 둔다.
 */
const BatchManager = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);

  return (
    <div className="flex flex-col gap-4">
      <BatchJobBoard
        selectedJobKey={params.jobKey}
        onSelectJob={(jobKey) => setParams({ jobKey })}
      />

      <BatchRunTable
        jobKey={params.jobKey}
        status={params.status}
        trigger={params.trigger}
        page={params.page}
        onChangeParams={setParams}
      />
    </div>
  );
};

export default BatchManager;
