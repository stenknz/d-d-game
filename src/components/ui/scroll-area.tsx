import { cn } from "@/lib/utils";
import * as React from "react";

export const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
ScrollArea.displayName = "ScrollArea";
