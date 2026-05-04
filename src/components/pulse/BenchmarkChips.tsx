import { memo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { INDUSTRY, INTERNAL, INDUSTRY_SOURCE, INTERNAL_SOURCE, deltaTone, type DimKey } from "@/lib/benchmarks";

interface Props {
  dimension: DimKey;
  value: number;
  size?: "sm" | "xs";
  className?: string;
}

function BenchmarkChipsBase({ dimension, value, size = "sm", className = "" }: Props) {
  const ind = INDUSTRY[dimension];
  const intr = INTERNAL[dimension];
  const dInd = value - ind;
  const dInt = value - intr;
  const text = size === "xs" ? "text-[10px]" : "text-[11px]";

  return (
    <TooltipProvider delayDuration={150}>
      <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-muted ${text} cursor-help`}>
              <span className="w-1.5 h-0.5 bg-muted-foreground/60" />
              <span className="text-muted-foreground">Industry {ind}</span>
              <span className={`font-semibold ${deltaTone(dInd)}`}>{dInd >= 0 ? "+" : ""}{dInd}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[11px] max-w-[220px]">{INDUSTRY_SOURCE}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-primary/5 ${text} cursor-help`}>
              <span className="w-1.5 h-0.5 bg-primary/60" />
              <span className="text-muted-foreground">Internal {intr}</span>
              <span className={`font-semibold ${deltaTone(dInt)}`}>{dInt >= 0 ? "+" : ""}{dInt}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[11px] max-w-[220px]">{INTERNAL_SOURCE}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const BenchmarkChips = memo(BenchmarkChipsBase);
