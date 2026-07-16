function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
      <div className="mt-4 h-7 w-24 animate-pulse rounded-md bg-muted" />
      <div className="mt-2 h-3 w-28 animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export default function ProgressLoading() {
  return (
    <div className="max-w-7xl space-y-8">
      <div>
        <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
        <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded-md bg-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="h-5 w-36 animate-pulse rounded-md bg-muted" />
        <div className="mt-6 h-60 animate-pulse rounded-xl bg-muted" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
            <div className="mt-6 h-64 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
            <div className="mt-6 h-64 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-card p-6">
              <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
              <div className="mt-5 h-32 animate-pulse rounded-xl bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
