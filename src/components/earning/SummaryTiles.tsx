import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SummaryTile {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "danger" | "warning";
}

/** 넓은 화면에서 타일 수만큼 한 줄을 채운다(최대 4칸). */
const LG_COLUMNS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
};

/** 목록 위 요약 숫자 줄. 수익 화면들이 같은 모양을 쓴다. */
const SummaryTiles = ({ tiles }: { tiles: SummaryTile[] }) => (
  <div className={cn("grid grid-cols-2 gap-3", LG_COLUMNS[tiles.length] ?? "lg:grid-cols-4")}>
    {tiles.map((tile) => (
      <div
        key={tile.label}
        className="flex flex-col gap-1 rounded-card border border-border-main bg-surface px-4 py-3 shadow-card"
      >
        <span className="body-5 text-font-2">{tile.label}</span>
        <span
          className={cn(
            "title-2 font-mono tabular-nums text-font-1",
            tile.tone === "danger" && "text-danger",
            tile.tone === "warning" && "text-warning",
          )}
        >
          {tile.value}
        </span>
        {tile.hint && <span className="body-6 text-font-2">{tile.hint}</span>}
      </div>
    ))}
  </div>
);

export default SummaryTiles;
