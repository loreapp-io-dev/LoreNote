/** 表达式求值器 */

import { generateId } from '@/utils/uuid';
import type { EventContext } from './types';

// 执行计数器
const executionCounters = {
  evaluateExpression: 0,
  parseEventExpression: 0,
};

// 日志前缀
const LOG_PREFIX = '[V8-Expression]';

export function evaluateExpression(expr: string, context: EventContext): unknown {
  executionCounters.evaluateExpression++;
  console.log(`${LOG_PREFIX} evaluateExpression() #${executionCounters.evaluateExpression}`, { expr, hasData: !!context.data, hasItem: !!context.item, loopVars: context.loopVars });

  try {
    // 构建参数名列表和参数值列表
    const paramNames: string[] = [
      'data',
      'props',
      'item',
      'idx',
      'index',
      'event',
      '$newId',
      '$first',
      '$last',
    ];
    const paramValues: unknown[] = [
      context.data,
      context.props,
      context.item,
      context.idx,
      context.index,
      context.event,
      generateId(),
      context.idx === 0,
      false,
    ];

    // 添加自定义循环变量
    if (context.loopVars) {
      for (const [name, value] of Object.entries(context.loopVars)) {
        paramNames.push(name);
        paramValues.push(value);
      }
    }

    const func = new Function(
      ...paramNames,
      `return ${expr}`
    );
    const result = func(...paramValues);
    console.log(`${LOG_PREFIX} evaluateExpression() result`, { expr, result, resultType: typeof result });
    return result;
  } catch (error) {
    console.log(`${LOG_PREFIX} evaluateExpression() error, returning original`, { expr, error: String(error) });
    return expr;
  }
}

export function parseEventExpression(expr: string): {
  type: 'set' | 'push' | 'splice' | 'update' | 'complex';
  path: string;
  value?: string;
  index?: string;
  count?: number;
  fullExpr?: string; // 完整表达式，用于复杂情况
} {
  executionCounters.parseEventExpression++;
  console.log(`${LOG_PREFIX} parseEventExpression() #${executionCounters.parseEventExpression}`, { expr });

  // data.field = value
  const setMatch = expr.match(/^([\w.[\]]+)\s*=\s*(.+)$/);
  if (setMatch) {
    const [, path, value] = setMatch;
    console.log(`${LOG_PREFIX} parseEventExpression() matched SET pattern`, { path, value });

    // 检查是否包含多个动态索引（嵌套数组访问）
    const dynamicIndexMatches = path.match(/\[(\w+)\]/g);
    if (dynamicIndexMatches && dynamicIndexMatches.length > 1) {
      // 复杂的嵌套数组访问，使用动态求值
      console.log(`${LOG_PREFIX} parseEventExpression() detected COMPLEX nested array`, { path, dynamicIndexCount: dynamicIndexMatches.length });
      return { type: 'complex', path, value, fullExpr: expr };
    }

    // 检查是否是简单数组更新 data.items[idx].field
    if (path.includes('[')) {
      const arrayMatch = path.match(/^([\w.]+)\[(\w+)\]\.(\w+)$/);
      if (arrayMatch) {
        console.log(`${LOG_PREFIX} parseEventExpression() detected array UPDATE`, { path: arrayMatch[1], field: arrayMatch[3], index: arrayMatch[2] });
        return { type: 'update', path: arrayMatch[1], value: `${arrayMatch[3]}=${value}`, index: arrayMatch[2] };
      }
    }
    console.log(`${LOG_PREFIX} parseEventExpression() returning SET`, { path, value });
    return { type: 'set', path, value };
  }

  // data.items.push(...)
  const pushMatch = expr.match(/^([\w.]+)\.push\((.+)\)$/);
  if (pushMatch) {
    console.log(`${LOG_PREFIX} parseEventExpression() matched PUSH pattern`, { path: pushMatch[1], value: pushMatch[2] });
    return { type: 'push', path: pushMatch[1], value: pushMatch[2] };
  }

  // data.items.splice(idx, 1)
  const spliceMatch = expr.match(/^([\w.]+)\.splice\((\w+),\s*(\d+)\)$/);
  if (spliceMatch) {
    console.log(`${LOG_PREFIX} parseEventExpression() matched SPLICE pattern`, { path: spliceMatch[1], index: spliceMatch[2], count: spliceMatch[3] });
    return { type: 'splice', path: spliceMatch[1], index: spliceMatch[2], count: Number(spliceMatch[3]) };
  }

  // 检测复杂表达式（包含 if, const, let, var, for, while 等语句）
  const complexPatterns = [/^if\s*\(/, /^const\s+/, /^let\s+/, /^var\s+/, /^for\s*\(/, /^while\s*\(/];
  const isComplex = complexPatterns.some(pattern => pattern.test(expr.trim()));
  if (isComplex) {
    console.log(`${LOG_PREFIX} parseEventExpression() detected COMPLEX expression (contains control statements)`, { expr });
    return { type: 'complex', path: '', fullExpr: expr };
  }

  console.log(`${LOG_PREFIX} parseEventExpression() no pattern matched, returning default SET`, { expr });
  return { type: 'set', path: '', value: expr };
}
