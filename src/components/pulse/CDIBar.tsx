import { memo } from "react";
import { motion } from "framer-motion";
import type { Dimension } from "@/lib/data";
import { BenchmarkChips } from "./BenchmarkChips";
import { INDUSTRY, type DimKey } from "@/lib/benchmarks";

interface Props {
  dim: Dimension;
  index: number;
  compare: boolean;
  onClick: () => void;
}

const KEY_MAP: Record<string, DimKey> = { connect: "Connect", develop: "Develop", inspire: "Inspire" };

function CDIBarBase({ dim, index, compare, onClick }: Props) {
  const dKey = KEY_MAP[dim.key];
  const ind = INDUSTRY[dKey];
  return (
    <button
      onClick={onClick}
      className="w-full text-left grid grid-cols-12 gap-4 items-center py-4 px-2 -mx-2 rounded-md hover:bg-muted/40 transition-colors cursor-pointer"
    >
      <div className="col-span-12 md:col-span-3">
        <div className="text-[15px] font-semibold tracking-tight">{dim.label}</div>
        <div className="text-[12px] text-muted-foreground mt-0.5">{dim.sub}</div>
      </div>

      <div className="col-span-10 md:col-span-7">
        <div className="relative h-2 w-full rounded-full bg-bartrack overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${dim.score}%` }}
            transition={{ duration: 0.6, delay: 0.4 + index * 0.1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: dim.color }}
          />
          {/* Industry benchmark marker */}
          <div
            className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-foreground/50"
            style={{ left: `${ind}%` }}
            title={`Industry ${ind}`}
          />
        </div>
        {compare && (
          <div className="mt-2 relative h-1.5 w-full rounded-full">
            <div
              className="absolute inset-y-0 left-0 rounded-full border border-dashed opacity-60"
              style={{ width: `${dim.prev}%`, borderColor: dim.color }}
            />
            <div className="absolute right-0 -top-0.5 text-[10px] text-muted-foreground">prev: {dim.prev}</div>
          </div>
        )}
        <div className="mt-2">
          <BenchmarkChips dimension={dKey} value={dim.score} size="xs" />
        </div>
      </div>

      <div className="col-span-2 md:col-span-2 text-right">
        <span className="text-[18px] font-semibold">{dim.score}</span>
        <span className="text-[12px] text-muted-foreground ml-0.5">/100</span>
      </div>
    </button>
  );
}

export const CDIBar = memo(CDIBarBase);

