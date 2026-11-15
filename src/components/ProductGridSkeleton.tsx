export function ProductGridSkeleton({
  count = 8,
  className = "grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading products"
      className={`grid ${className}`}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="aspect-4/5 animate-pulse bg-secondary" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
            <div className="h-4 w-2/5 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}