/**
 * 渲染追踪工具 - 用于调试和验证渲染流程
 */

interface RenderLog {
  id: string;
  component: string;
  timestamp: number;
  props?: Record<string, unknown>;
  reason?: string;
  stackTrace?: string;
}

class RenderTracker {
  private logs: RenderLog[] = [];
  private renderCounts: Map<string, number> = new Map();
  private enabled = true;
  private maxLogs = 1000; // Maximum number of logs to keep in memory

  /**
   * 记录组件渲染
   */
  track(component: string, props?: Record<string, unknown>, reason?: string) {
    if (!this.enabled) return;

    const count = (this.renderCounts.get(component) || 0) + 1;
    this.renderCounts.set(component, count);

    const log: RenderLog = {
      id: `${component}-${count}`,
      component,
      timestamp: performance.now(),
      props,
      reason,
      stackTrace: this.getStackTrace(),
    };

    this.logs.push(log);

    // Enforce size limit to prevent memory leaks
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 控制台输出
    console.log(
      `[RENDER #${count}] ${component}`,
      reason ? `(${reason})` : '',
      `@ ${log.timestamp.toFixed(2)}ms`
    );
  }

  /**
   * 获取简化的堆栈跟踪
   */
  private getStackTrace(): string {
    const stack = new Error().stack || '';
    const lines = stack.split('\n').slice(3, 8); // 跳过前3行，取5行
    return lines.map(line => line.trim()).join('\n');
  }

  /**
   * 打印渲染摘要
   */
  printSummary() {
    console.group('📊 渲染摘要');
    console.log(`总渲染次数: ${this.logs.length}`);
    console.log('\n各组件渲染次数:');

    this.renderCounts.forEach((count, component) => {
      console.log(`  ${component}: ${count}次`);
    });

    console.log('\n渲染时间线:');
    this.logs.forEach((log, index) => {
      const timeDiff = index > 0
        ? `+${(log.timestamp - this.logs[index - 1].timestamp).toFixed(2)}ms`
        : '0ms';
      console.log(`  ${log.id} @ ${log.timestamp.toFixed(2)}ms (${timeDiff})`);
    });

    console.groupEnd();
  }

  /**
   * 打印详细日志
   */
  printDetails() {
    console.group('🔍 渲染详细日志');

    this.logs.forEach((log) => {
      console.group(`${log.id} @ ${log.timestamp.toFixed(2)}ms`);
      if (log.reason) console.log('原因:', log.reason);
      if (log.props) console.log('Props:', log.props);
      if (log.stackTrace) console.log('堆栈:\n', log.stackTrace);
      console.groupEnd();
    });

    console.groupEnd();
  }

  /**
   * 清空日志
   */
  clear() {
    this.logs = [];
    this.renderCounts.clear();
    console.log('🧹 渲染日志已清空');
  }

  /**
   * 启用/禁用追踪
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    console.log(`🎯 渲染追踪已${enabled ? '启用' : '禁用'}`);
  }

  /**
   * 获取所有日志
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * 导出日志为 JSON
   */
  exportLogs() {
    const data = {
      summary: {
        totalRenders: this.logs.length,
        components: Object.fromEntries(this.renderCounts),
      },
      logs: this.logs,
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `render-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('📥 渲染日志已导出');
  }
}

// 全局单例
export const renderTracker = new RenderTracker();

// 暴露到 window 方便调试
if (typeof window !== 'undefined') {
  (window as any).renderTracker = renderTracker;
}
