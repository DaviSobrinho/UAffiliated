export function SkeletonLine({ width = "100%", height = "1rem" }: { width?: string; height?: string }) {
  return (
    <div
      className="bg-zinc-800 rounded animate-pulse"
      style={{ width, height }}
    />
  );
}

export function SkeletonBox({ width = "100%", height = "3rem" }: { width?: string; height?: string }) {
  return (
    <div
      className="bg-zinc-800 rounded-lg animate-pulse"
      style={{ width, height }}
    />
  );
}

export function SkeletonText() {
  return (
    <div className="space-y-2">
      <SkeletonLine width="100%" height="1rem" />
      <SkeletonLine width="90%" height="0.875rem" />
    </div>
  );
}
