"use client";

import { useHasPermission } from "@/store/useAdminStore";
import { useListParams } from "@/hooks/useListParams";
import Alert from "@/components/ui/Alert";
import Tabs, { type TabItem } from "@/components/ui/Tabs";
import AdminLogTable from "./AdminLogTable";
import SystemEventTable from "./SystemEventTable";

export type LogTab = "admin" | "system";

/**
 * 두 탭의 조건을 한 곳에서 들고 있는다.
 *
 * 탭마다 `useListParams`를 따로 부르면 안 된다. 이 훅은 **자기가 아는 키만으로
 * 주소를 다시 쓰기 때문에**, 탭 안에서 필터를 바꾸는 순간 부모가 들고 있던
 * `tab`이 주소에서 사라진다. 키를 한 벌로 모아 한 번만 부른다.
 */
const DEFAULT_PARAMS = {
  tab: "admin" as LogTab,
  page: 1,
  keyword: "",
  // 관리자 활동
  domain: "",
  result: "",
  actorId: "",
  // 시스템 이벤트
  level: "",
  source: "",
};

export type LogParams = typeof DEFAULT_PARAMS;
export type SetLogParams = (patch: Partial<LogParams>) => void;

/**
 * 로그 화면.
 *
 * 관리자 활동과 시스템 이벤트는 **답해야 하는 질문이 다르다.** 전자는 "누가
 * 무엇을 바꿨나", 후자는 "지금 무엇이 터지고 있나"다. 컬럼도 필터도 겹치지
 * 않아 한 표에 담으면 양쪽 모두 최소한만 보여 주게 된다.
 *
 * 권한도 다르다. 감사 로그는 변경된 값이 그대로 남아 좁게 열어야 하므로
 * (`log:read`), 장애를 보려는 사람에게까지 함께 열리지 않도록 탭 단위로 막는다.
 */
const LogManager = () => {
  const [params, setParams] = useListParams(DEFAULT_PARAMS);

  const canReadAuditLog = useHasPermission("log:read");
  const canReadSystemLog = useHasPermission("systemLog:read");

  const items: TabItem<LogTab>[] = [
    ...(canReadAuditLog
      ? [{ label: "관리자 활동", value: "admin" as const }]
      : []),
    ...(canReadSystemLog
      ? [{ label: "시스템 이벤트", value: "system" as const }]
      : []),
  ];

  if (items.length === 0) {
    return (
      <Alert tone="info" title="열람할 수 있는 로그가 없습니다.">
        관리자 활동 로그와 시스템 이벤트는 각각 다른 권한으로 열립니다. 필요하면
        직책 담당자에게 요청해 주세요.
      </Alert>
    );
  }

  // 권한이 없는 탭이 주소에 실려 들어와도 볼 수 있는 첫 탭으로 되돌린다.
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
    });

  return (
    <div className="flex flex-col gap-4">
      {items.length > 1 && (
        <Tabs items={items} value={tab} onChange={handleTabChange} />
      )}

      {tab === "admin" ? (
        <AdminLogTable params={params} setParams={setParams} />
      ) : (
        <SystemEventTable params={params} setParams={setParams} />
      )}
    </div>
  );
};

export default LogManager;
