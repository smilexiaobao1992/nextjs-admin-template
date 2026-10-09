export default function AppLoading() {
  return (
    <div className="space-y-7 animate-pulse" aria-busy="true" aria-label="正在加载内容">
      {/* 标题骨架 */}
      <div className="space-y-3">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-96 max-w-full rounded bg-muted" />
      </div>

      {/* 搜索/操作栏骨架 */}
      <div className="h-20 rounded-xl bg-card shadow-card" />

      {/* 列表/内容区骨架 */}
      <div className="h-96 rounded-xl bg-card shadow-card" />
    </div>
  );
}
