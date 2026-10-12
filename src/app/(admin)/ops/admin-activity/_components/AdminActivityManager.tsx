"use client";

import { useListParams } from "@/hooks/useListParams";
import AdminLogTable from "@/app/(admin)/ops/logs/_components/AdminLogTable";
import { LOG_DEFAULT_PARAMS } from "@/app/(admin)/ops/logs/_components/LogManager";

/**
 * 운영자 활동 기록. 시스템 로그 화면의 탭이던 것을 떼어 냈다.
 *
 * "누가 무엇을 어떤 값으로 바꿨나"는 감사의 질문이라 장애를 보는 시스템 로그와 볼 사람이 다르다.
 * 표와 필터는 그대로 재사용하고, 주소 조건도 같은 키 한 벌을 쓴다(`?actorId=` 링크가 그대로 통한다).
 */
const AdminActivityManager = () => {
  const [params, setParams] = useListParams(LOG_DEFAULT_PARAMS);

  return <AdminLogTable params={params} setParams={setParams} />;
};

export default AdminActivityManager;
