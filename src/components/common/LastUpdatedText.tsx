"use client";

import { formatDistanceToNow } from "date-fns";

interface LastUpdatedTextProps {
  timestamp: string | Date;
  className?: string;
}

export function LastUpdatedText({
  timestamp,
  className,
}: LastUpdatedTextProps) {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const relativeTime = formatDistanceToNow(date, { addSuffix: true });

  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      Data last updated {relativeTime}
    </p>
  );
}

