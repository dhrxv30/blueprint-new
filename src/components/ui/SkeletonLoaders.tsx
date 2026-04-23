import { cn } from '@/lib/utils';

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-md bg-elevated animate-shimmer',
        'bg-[length:200%_100%] bg-gradient-to-r from-elevated via-overlay to-elevated',
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Shimmer className="h-3 w-3 rounded-full" />
        <Shimmer className="h-5 w-48" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-4 w-32" />
        </div>
        <div className="flex justify-between">
          <Shimmer className="h-4 w-28" />
          <Shimmer className="h-4 w-20" />
        </div>
        <div className="flex justify-between">
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-4 w-24" />
        </div>
      </div>
      <Shimmer className="h-9 w-full rounded-md mt-2" />
    </div>
  );
}

export function TaskSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Shimmer className="h-4 w-4 rounded-full" />
        <Shimmer className="h-4 w-56" />
      </div>
      <div className="flex gap-2 pl-6">
        <Shimmer className="h-3 w-16" />
        <Shimmer className="h-3 w-12" />
        <Shimmer className="h-3 w-24" />
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* AI message */}
      <div className="flex justify-start">
        <div className="max-w-[75%] space-y-2">
          <Shimmer className="h-4 w-64" />
          <Shimmer className="h-4 w-48" />
          <Shimmer className="h-4 w-56" />
        </div>
      </div>
      {/* User message */}
      <div className="flex justify-end">
        <Shimmer className="h-10 w-36 rounded-lg" />
      </div>
      {/* AI message */}
      <div className="flex justify-start">
        <div className="max-w-[75%] space-y-2">
          <Shimmer className="h-4 w-72" />
          <Shimmer className="h-4 w-40" />
          <div className="flex gap-2 mt-2">
            <Shimmer className="h-8 w-24 rounded-full" />
            <Shimmer className="h-8 w-28 rounded-full" />
            <Shimmer className="h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnalysisSkeleton() {
  return (
    <div className="flex gap-6">
      {/* Left nav */}
      <div className="w-[200px] space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Shimmer key={i} className="h-9 w-full rounded-md" />
        ))}
      </div>
      {/* Center */}
      <div className="flex-1 space-y-4">
        <Shimmer className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-4 space-y-2">
            <Shimmer className="h-5 w-56" />
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-3/4" />
          </div>
        ))}
      </div>
      {/* Right metrics */}
      <div className="w-[200px] space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Shimmer className="h-3 w-20" />
            <Shimmer className="h-6 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-surface p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shimmer className="h-5 w-16 rounded" />
            <Shimmer className="h-4 w-40" />
          </div>
          <Shimmer className="h-6 w-14 rounded" />
        </div>
      ))}
    </div>
  );
}

export { Shimmer };
