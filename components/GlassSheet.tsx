import type { ReactNode } from "react";

/** Frosted bottom sheet that floats over a photo. */
export function GlassSheet({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`glass absolute inset-x-0 bottom-0 z-10 rounded-t-[14px] border-b-0 px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom))] ${className}`}>
      {children}
    </div>
  );
}
