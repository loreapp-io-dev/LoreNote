export function EditorSkeleton() {
  return (
    <div className="space-y-4 p-6 animate-pulse">
      {/* 标题骨架 */}
      <div className="h-10 bg-muted rounded-md w-3/4" />

      {/* 内容骨架 */}
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/5" />
      </div>

      {/* 更多内容骨架 */}
      <div className="space-y-3 pt-4">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-11/12" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
    </div>
  );
}
