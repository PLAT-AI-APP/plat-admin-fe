"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Table, { type TableColumn } from "@/components/ui/Table";
import { formatBytes, formatWithCommas } from "@/lib/utils";
import type { MemoryHealth, ProcessUsage } from "@/type/ops";
import CompositionDonut, { type CompositionSlice } from "./CompositionDonut";
import UsageBar from "./UsageBar";
import { FREE_SLICE_COLOR, SLICE_COLORS } from "../_constants/serverStatus";

interface MemoryDetailCardProps {
  memory: MemoryHealth;
  processes: ProcessUsage[];
}

/** 도넛에 개별로 그릴 프로세스 수. 나머지는 한 조각으로 묶는다. */
const PROCESS_LIMIT = 6;

/**
 * 표 한 줄. 프로세스뿐 아니라 캐시 · 여유도 같은 표에 둔다 —
 * 합이 머신 전체가 되어야 도넛의 조각과 표가 서로를 설명한다.
 */
interface MemoryRow {
  key: string;
  color: string;
  name: string;
  pid: number | null;
  bytes: number;
  /** 머신 전체 대비 % */
  share: number;
  cpuUsage: number | null;
}

/**
 * 메모리 구성.
 *
 * 하나의 퍼센트로는 조치를 정할 수 없다. 캐시는 커널이 남는 RAM을 빌려 쓰는
 * 것이라 필요하면 즉시 돌려받지만, 프로세스가 쥔 몫은 돌려받지 못한다.
 * 그래서 "무엇이 먹고 있나"까지 한 카드에서 답한다.
 */
const MemoryDetailCard = ({ memory, processes }: MemoryDetailCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const sorted = [...processes].sort(
    (a, b) => b.residentBytes - a.residentBytes,
  );
  const listed = isExpanded ? sorted : sorted.slice(0, PROCESS_LIMIT);
  const listedTotal = listed.reduce(
    (sum, process) => sum + process.residentBytes,
    0,
  );
  // 합이 머신 전체가 되도록 목록에 없는 몫을 명시적으로 채운다.
  const others = Math.max(0, memory.anonymousBytes - listedTotal);

  const share = (bytes: number) =>
    memory.totalBytes > 0 ? (bytes / memory.totalBytes) * 100 : 0;

  const processRows: MemoryRow[] = listed.map((process, index) => ({
    key: String(process.pid),
    color: SLICE_COLORS[index % SLICE_COLORS.length],
    name: process.name,
    pid: process.pid,
    bytes: process.residentBytes,
    share: process.memoryUsage,
    cpuUsage: process.cpuUsage,
  }));

  /** 프로세스가 아닌 몫. 도넛의 나머지 조각과 1:1로 대응한다. */
  const remainderRows: MemoryRow[] = [
    ...(others > 0
      ? [
          {
            key: "others",
            color: "var(--neutral)",
            name: "그 외 프로세스",
            pid: null,
            bytes: others,
            share: share(others),
            cpuUsage: null,
          },
        ]
      : []),
    {
      key: "cached",
      color: "var(--info)",
      name: "페이지 캐시 · 버퍼",
      pid: null,
      bytes: memory.cachedBytes,
      share: share(memory.cachedBytes),
      cpuUsage: null,
    },
    {
      key: "free",
      color: FREE_SLICE_COLOR,
      name: "여유",
      pid: null,
      bytes: memory.freeBytes,
      share: share(memory.freeBytes),
      cpuUsage: null,
    },
  ];

  const rows = [...processRows, ...remainderRows];

  const slices: CompositionSlice[] = rows.map((row) => ({
    key: row.key,
    label: row.pid === null ? row.name : `${row.name} (${row.pid})`,
    value: row.bytes,
    color: row.color,
  }));

  const columns: TableColumn<MemoryRow>[] = [
    {
      key: "name",
      header: "구성",
      render: (row) => (
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: row.color }}
          />
          <span
            className={row.pid === null ? "truncate text-font-2" : "truncate text-font-1"}
          >
            {row.name}
          </span>
        </div>
      ),
    },
    {
      key: "pid",
      header: "PID",
      width: "90px",
      align: "right",
      numeric: true,
      render: (row) => (
        <span className="text-font-2">{row.pid === null ? "-" : row.pid}</span>
      ),
    },
    {
      key: "bytes",
      header: "메모리",
      width: "140px",
      align: "right",
      numeric: true,
      render: (row) => (
        <span className="body-4 font-semibold text-font-1 tabular-nums">
          {formatBytes(row.bytes)}
        </span>
      ),
    },
    {
      key: "share",
      header: "머신 대비",
      width: "180px",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-full max-w-[96px] overflow-hidden rounded-full bg-subtle">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, row.share)}%`,
                backgroundColor: row.color,
              }}
            />
          </div>
          <span className="body-6 text-font-2 tabular-nums">
            {row.share.toFixed(1)}%
          </span>
        </div>
      ),
    },
    {
      key: "cpuUsage",
      header: "CPU",
      width: "90px",
      align: "right",
      numeric: true,
      render: (row) => (
        <span className="text-font-2 tabular-nums">
          {row.cpuUsage === null ? "-" : `${row.cpuUsage.toFixed(1)}%`}
        </span>
      ),
    },
  ];

  const swapUsage =
    memory.swapTotalBytes > 0
      ? (memory.swapUsedBytes / memory.swapTotalBytes) * 100
      : 0;

  return (
    <Card
      id="server-memory"
      title="메모리 구성"
      description={
        processes.length > 0
          ? "무엇이 얼마나 쥐고 있는지까지 함께 봅니다"
          : "프로세스 목록을 읽을 수 없는 환경이라 갈래로만 나눕니다"
      }
      action={
        sorted.length > PROCESS_LIMIT && (
          <button
            type="button"
            onClick={() => setIsExpanded((previous) => !previous)}
            className="body-5 text-brand hover:underline"
          >
            {isExpanded
              ? "상위만 보기"
              : `전체 ${formatWithCommas(sorted.length)}개 보기`}
          </button>
        )
      }
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <CompositionDonut
          slices={slices}
          centerLabel="머신 전체"
          centerValue={formatBytes(memory.totalBytes)}
          hasLegend={false}
        />

        <div className="flex flex-1 flex-col gap-5 border-t border-border-main pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <UsageBar
            label="사용률"
            value={memory.usage}
            description={`${formatBytes(memory.usedBytes)} / ${formatBytes(memory.totalBytes)}`}
          />

          {memory.swapTotalBytes > 0 ? (
            <UsageBar
              label="스왑"
              value={swapUsage}
              description={`${formatBytes(memory.swapUsedBytes)} / ${formatBytes(memory.swapTotalBytes)} · 쓰이기 시작했다면 이미 메모리가 모자란 상태다`}
            />
          ) : (
            <div className="flex flex-col gap-1">
              <span className="body-5 text-font-2">스왑</span>
              <span className="body-4 text-font-1">사용 안 함</span>
            </div>
          )}

          {/* 캐시를 사용량에 넣으면 늘 90%대로 보인다. 왜 아닌지를 한 줄로 못 박아 둔다. */}
          <p className="rounded-field bg-subtle px-3 py-2.5 body-6 text-font-2">
            사용량은 <b className="text-font-1">돌려받을 수 없는 몫</b>만 셉니다.
            페이지 캐시는 필요하면 커널이 곧바로 회수하므로 사용량에 넣지 않습니다.
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-border-main pt-1">
        <Table
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.key}
          emptyTitle="표시할 구성이 없습니다."
        />
      </div>
    </Card>
  );
};

export default MemoryDetailCard;
