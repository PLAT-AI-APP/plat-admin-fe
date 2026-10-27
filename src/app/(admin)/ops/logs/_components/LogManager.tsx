"use client";

import { useListParams } from "@/hooks/useListParams";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import AccessLogTable from "./AccessLogTable";
import SystemEventTable from "./SystemEventTable";

export type LogTab = "access" | "system";

/**
 * 두 탭의 조건을 한 곳에서 들고 있는다.
 *
 * 탭마다 `useListParams`를 따로 부르면 안 된다. 이 훅은 **자기가 아는 키만으로
 * 주소를 다시 쓰기 때문에**, 탭 안에서 필터를 바꾸는 순간 부모가 들고 있던
 * `tab`이 주소에서 사라진다. 키를 한 벌로 모아 한 번만 부른다.
 */
export const LOG_DEFAULT_PARAMS = {
  tab: "access" as LogTab,
  page: 1,
  keyword: "",
  // 운영자 활동(관리 > 운영자 활동 기록이 같은 표를 쓴다)
  domain: "",
  result: "",
  actorId: "",
  // 시스템 이벤트
  level: "",
  source: "",
  // 접근 로그
  app: "",
  method: "",
  status: "",
  userId: "",
  startDate: "",
  endDate: "",
};

export type LogParams = typeof LOG_DEFAULT_PARAMS;
export type SetLogParams = (patch: Partial<LogParams>) => void;

/**
 * 시스템 로그 화면.
 *
 * 두 탭은 **답해야 하는 질문이 다르다.** 접근 로그는 "이 요청이 실제로 어떻게 오갔나",
 * 시스템 이벤트는 "지금 무엇이 터지고 있나"다. 컬럼도 필터도 겹치지 않아 한 표에 담으면
 * 모두 최소한만 보여 주게 된다.
 *
 * 운영자 활동("누가 무엇을 바꿨나")은 볼 사람이 달라 관리 구역의 운영자 활동 기록으로 떼어 냈다.
 * 둘 다 장애를 보는 개발의 자리라 같은 권한(`systemLog:read`)으로 연다.
 */
const LogManager = () => {
  const [params, setParams] = useListParams(LOG_DEFAULT_PARAMS);

  const items: TabItem<LogTab>[] = [
    { label: "접근 로그", value: "access" },
    { label: "시스템 이벤트", value: "system" },
  ];

  // 모르는 탭(예전 주소의 admin 등)이 실려 들어와도 첫 탭으로 연다.
  const tab = items.some((item) => item.value === params.tab)
    ? params.tab
    : items[0].value;

  /** 탭을 옮길 때 반대편 탭의 필터를 지운다. 남겨 두면 빈 목록의 원인이 보이지 않는다. */
  const handleTabChange = (next: LogTab) =>
    setParams({
      tab: next,
      keyword: "",
      domain: "",
      result: "",
      actorId: "",
      level: "",
      source: "",
      app: "",
      method: "",
      status: "",
      userId: "",
      startDate: "",
      endDate: "",
    });

  return (
    <div className="flex flex-col gap-4">
      <Tabs items={items} value={tab} onChange={handleTabChange} />

      {tab === "access" && (
        <AccessLogTable params={params} setParams={setParams} />
      )}
      {tab === "system" && (
        <SystemEventTable params={params} setParams={setParams} />
      )}
    </div>
  );
};

export default LogManager;
