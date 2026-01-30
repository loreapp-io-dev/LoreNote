import { useState, useEffect } from 'react';
import { renderTracker } from '@/utils/renderTracker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export function RenderTrackerPanel() {
  const [logs, setLogs] = useState(renderTracker.getLogs());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLogs(renderTracker.getLogs());
    }, 500);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setLogs(renderTracker.getLogs());
  };

  const handleClear = () => {
    renderTracker.clear();
    setLogs([]);
  };

  const handlePrintSummary = () => {
    renderTracker.printSummary();
  };

  const handlePrintDetails = () => {
    renderTracker.printDetails();
  };

  const handleExport = () => {
    renderTracker.exportLogs();
  };

  // 计算统计信息
  const componentCounts = new Map<string, number>();
  logs.forEach(log => {
    const count = componentCounts.get(log.component) || 0;
    componentCounts.set(log.component, count + 1);
  });

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">渲染追踪器</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '暂停' : '自动刷新'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            刷新
          </Button>
          <Button size="sm" variant="outline" onClick={handleClear}>
            清空
          </Button>
        </div>
      </div>

      {/* 统计摘要 */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Card className="p-3">
          <div className="text-sm text-muted-foreground">总渲染次数</div>
          <div className="text-2xl font-bold">{logs.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-sm text-muted-foreground">组件类型数</div>
          <div className="text-2xl font-bold">{componentCounts.size}</div>
        </Card>
      </div>

      {/* 组件渲染次数 */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-semibold">各组件渲染次数</h4>
        <ScrollArea className="h-32">
          <div className="space-y-1">
            {Array.from(componentCounts.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([component, count]) => (
                <div
                  key={component}
                  className="flex justify-between rounded bg-muted px-2 py-1 text-sm"
                >
                  <span className="font-mono">{component}</span>
                  <span className="font-semibold">{count}次</span>
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>

      {/* 渲染时间线 */}
      <div className="mb-4">
        <h4 className="mb-2 text-sm font-semibold">渲染时间线</h4>
        <ScrollArea className="h-48">
          <div className="space-y-1">
            {logs.map((log, index) => {
              const timeDiff = index > 0
                ? log.timestamp - logs[index - 1].timestamp
                : 0;
              return (
                <div
                  key={log.id}
                  className="rounded bg-muted px-2 py-1 text-xs font-mono"
                >
                  <div className="flex justify-between">
                    <span className="text-foreground">{log.component}</span>
                    <span className="text-muted-foreground">
                      {log.timestamp.toFixed(2)}ms
                      {index > 0 && (
                        <span className="ml-2 text-orange-500">
                          +{timeDiff.toFixed(2)}ms
                        </span>
                      )}
                    </span>
                  </div>
                  {log.reason && (
                    <div className="mt-1 text-muted-foreground">
                      {log.reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Button size="sm" onClick={handlePrintSummary}>
          打印摘要
        </Button>
        <Button size="sm" onClick={handlePrintDetails}>
          打印详情
        </Button>
        <Button size="sm" onClick={handleExport}>
          导出日志
        </Button>
      </div>
    </Card>
  );
}
