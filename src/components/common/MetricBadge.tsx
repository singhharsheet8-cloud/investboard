"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MetricBadgeProps {
  label: string;
  value: number | string | null;
  tooltip?: string;
  positiveIsGood?: boolean;
  className?: string;
}

export function MetricBadge({
  label,
  value,
  tooltip,
  positiveIsGood = true,
  className,
}: MetricBadgeProps) {
  if (value === null || value === undefined) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">N/A</p>
      </div>
    );
  }

  const numValue = typeof value === "number" ? value : parseFloat(value.toString());
  const isPositive = numValue >= 0;
  const colorClass =
    typeof value === "number"
      ? positiveIsGood
        ? isPositive
          ? "text-green-600"
          : "text-red-600"
        : isPositive
        ? "text-red-600"
        : "text-green-600"
      : "";

  const content = (
    <div className={className}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${colorClass}`}>
        {typeof value === "number"
          ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}${label.includes("%") ? "%" : ""}`
          : value}
      </p>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

