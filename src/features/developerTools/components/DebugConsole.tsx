import { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useDeveloperToolsStore } from '../store';
import { Button, ScrollArea } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { DebugLogType, LogFilter } from '../types';
import { RenderTrackerPanel } from '@/components/debug';

/** 日志类型对应的颜色 */
const logTypeColors: Record<DebugLogType, string> = {
  expr: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
  event: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  state: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
  render: 'text-gray-600 dark:text-gray-400 bg-gray-500/10',
  error: 'text-red-600 dark:text-red-400 bg-red-500/10',
};

export function DebugConsole() {
  const { t } = useTranslation();
  const { debugLogs, logFilter, setLogFilter, clearDebugLogs } = useDeveloperToolsStore();

  // 过滤日志
  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return debugLogs;
    return debugLogs.filter((log) => log.type === logFilter);
  }, [debugLogs, logFilter]);

  // 过滤器选项
  const filterOptions: { id: LogFilter; label: string }[] = [
    { id: 'all', label: t.developerTools.debug.filterAll },
    { id: 'expr', label: t.developerTools.debug.filterExpr },
    { id: 'event', label: t.developerTools.debug.filterEvent },
    { id: 'state', label: t.developerTools.debug.filterState },
    { id: 'render', label: t.developerTools.debug.filterRender },
    { id: 'error', label: t.developerTools.debug.filterError },
  ];

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* 渲染追踪器面板 */}
      <div className="flex-shrink-0">
        <RenderTrackerPanel />
      </div>

      {/* Schema 调试日志 */}
      <div className="flex flex-1 flex-col border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-3 py-2 border-b">
          <h3 className="text-sm font-semibold">Schema 调试日志</h3>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs h-7"
            onClick={clearDebugLogs}
          >
            <Trash2 size={12} />
            {t.developerTools.debug.clear}
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1">
              {t.developerTools.debug.filter}:
            </span>
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setLogFilter(option.id)}
                className={cn(
                  'rounded px-2 py-0.5 text-[11px] transition-colors',
                  logFilter === option.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 日志列表 */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1 font-mono text-[11px]">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 rounded px-2 py-1 hover:bg-muted/50"
                >
                  {/* 时间 */}
                  <span className="flex-shrink-0 text-muted-foreground">
                    {formatTime(log.timestamp)}
                  </span>
                  {/* 类型标签 */}
                  <span
                    className={cn(
                      'flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase',
                      logTypeColors[log.type]
                    )}
                  >
                    {t.developerTools.debug.types[log.type]}
                  </span>
                  {/* 消息 */}
                  <span className="flex-1 text-foreground break-all">
                    {log.message}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex h-20 items-center justify-center text-muted-foreground">
                {t.developerTools.debug.noLogs}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
