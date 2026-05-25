export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 rounded-lg skeleton-shimmer w-3/4" />
          <div className="h-3 rounded-lg skeleton-shimmer w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 rounded-lg skeleton-shimmer w-1/3" />
              <div className="h-3 rounded-lg skeleton-shimmer w-1/5" />
            </div>
            <div className="h-6 w-16 rounded-full skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsRowSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 rounded-lg skeleton-shimmer w-12" />
            <div className="h-5 rounded-lg skeleton-shimmer w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}
