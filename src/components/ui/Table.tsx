import { Fragment, ReactNode } from "react";
import { cn } from "@/lib/utils";
import EmptyState from "./EmptyState";
import Skeleton from "./Skeleton";

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  /** 셀 렌더러. 없으면 아무것도 그리지 않는다. */
  render: (row: T, index: number) => ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  /** 숫자 컬럼은 tabular-nums를 자동 적용한다. */
  numeric?: boolean;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  isLoading?: boolean;
  /** 로딩 중 보여줄 스켈레톤 행 개수 */
  skeletonRows?: number;
  /**
   * 표가 이 행 수보다 낮아지지 않는다. 기본값은 `skeletonRows`.
   *
   * 검색 결과가 줄면 표가 접혔다가 검색어를 지우면 다시 펴져서, 아래에 있는
   * 페이지네이션이 매번 다른 자리로 튄다. 로딩 중 스켈레톤 높이를 바닥으로
   * 잡아 두면 **스켈레톤 → 결과 → 빈 상태**가 모두 같은 높이에서 바뀐다.
   *
   * 0을 주면 바닥을 두지 않고 내용만큼만 그린다.
   */
  minRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  onRowClick?: (row: T) => void;
  /**
   * 펼친 행 아래에 붙는 내용.
   *
   * 주면 **행 클릭이 펼치기로 동작한다**(`onRowClick`은 무시된다).
   * 한 행에 두 가지 클릭 의미를 두면 운영자가 무엇이 열릴지 예측할 수 없다.
   */
  renderExpanded?: (row: T) => ReactNode;
  /**
   * 펼쳐진 행의 키 목록.
   *
   * 표가 아니라 **호출부가 들고 있다.** 그래야 '전체 열기'처럼 표 바깥에 있는
   * 조작이 같은 상태를 건드릴 수 있다.
   */
  expandedKeys?: string[];
  onToggleExpand?: (key: string) => void;
  className?: string;
}

/**
 * 바닥 높이를 계산할 때 쓰는 행 높이(px).
 *
 * 헤더는 `py-3` + body-5, 스켈레톤 행은 `py-3.5` + `h-4` + 경계선 1px에서 나온 값이다.
 * 셀 패딩을 바꾸면 여기도 함께 고쳐야 한다.
 */
const HEAD_ROW_HEIGHT = 44;
const SKELETON_ROW_HEIGHT = 45;

const ALIGN_CLASS = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

/**
 * 관리자 공통 표.
 * 컨테이너(Card)는 호출부에서 감싼다. 표 자체는 경계선만 담당한다.
 */
const Table = <T,>({
  columns,
  rows,
  getRowKey,
  isLoading = false,
  skeletonRows = 8,
  minRows,
  emptyTitle = "데이터가 없습니다.",
  emptyDescription,
  emptyAction,
  onRowClick,
  renderExpanded,
  expandedKeys,
  onToggleExpand,
  className,
}: TableProps<T>) => {
  const isEmpty = !isLoading && rows.length === 0;
  const isExpandable = Boolean(renderExpanded);
  const floorRows = minRows ?? skeletonRows;

  return (
    <div
      style={
        floorRows > 0
          ? { minHeight: HEAD_ROW_HEIGHT + floorRows * SKELETON_ROW_HEIGHT }
          : undefined
      }
      className={cn(
        "flex w-full flex-col overflow-x-auto scrollbar-thin",
        className,
      )}
    >
      <table className="w-full min-w-max body-4">
        <thead>
          <tr className="bg-subtle">
            {columns.map(({ key, header, width, align = "left" }) => (
              <th
                key={key}
                style={{ width }}
                className={cn(
                  "px-4 py-3 body-5 font-medium whitespace-nowrap text-font-2",
                  ALIGN_CLASS[align],
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoading &&
            Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-t border-border-main">
                {columns.map(({ key }) => (
                  <td key={key} className="px-4 py-3.5">
                    <Skeleton className="h-4 w-full max-w-40" />
                  </td>
                ))}
              </tr>
            ))}

          {!isLoading &&
            rows.map((row, rowIndex) => {
              const rowKey = getRowKey(row, rowIndex);
              const isExpanded = Boolean(expandedKeys?.includes(rowKey));

              const handleClick = isExpandable
                ? () => onToggleExpand?.(rowKey)
                : onRowClick
                  ? () => onRowClick(row)
                  : undefined;

              return (
                <Fragment key={rowKey}>
                  <tr
                    onClick={handleClick}
                    aria-expanded={isExpandable ? isExpanded : undefined}
                    className={cn(
                      "border-t border-border-main transition-colors hover:bg-surface-hover",
                      handleClick && "cursor-pointer",
                      // 펼친 행은 아래 내용과 한 덩어리로 보여야 한다.
                      isExpanded && "bg-subtle",
                    )}
                  >
                    {columns.map(({ key, render, align = "left", numeric }) => (
                      <td
                        key={key}
                        className={cn(
                          "px-4 py-3.5 text-font-1",
                          ALIGN_CLASS[align],
                          numeric && "tabular-nums",
                        )}
                      >
                        {render(row, rowIndex)}
                      </td>
                    ))}
                  </tr>

                  {isExpanded && (
                    <tr className="border-t border-border-main bg-subtle">
                      <td colSpan={columns.length} className="px-4 pt-0 pb-4">
                        {renderExpanded?.(row)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
        </tbody>
      </table>

      {/* 바닥 높이가 잡혀 있으면 남는 자리에서 가운데로 온다. */}
      {isEmpty && (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          className="flex-1"
        />
      )}
    </div>
  );
};

export default Table;

/** 표 셀 안에서 이름 + 보조 정보를 함께 보여줄 때 사용한다. */
export const TableCellStack = ({
  primary,
  secondary,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
}) => (
  <Fragment>
    <p className="text-font-1">{primary}</p>
    {secondary && <p className="mt-0.5 body-6 text-font-2">{secondary}</p>}
  </Fragment>
);
