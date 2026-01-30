/** Data Engine - Immutable data + smart debouncing */

import type { SchemaComponent, EventContext } from './types';
import { evaluateExpression, parseEventExpression } from './expression';

// Page cache
const pageCache = new Map<string, { schema: SchemaComponent; vaultPath: string }>();

// Debounced write queue (includes onSave callback)
const writeQueue = new Map<string, { timer: ReturnType<typeof setTimeout>; onSave: (data: SchemaComponent) => void }>();

// Debounce configuration
const DEBOUNCE_MS = 500;

// Execution counters
const executionCounters = {
  init: 0,
  readPage: 0,
  setPage: 0,
  writePage: 0,
  updateField: 0,
  arrayPush: 0,
  arraySplice: 0,
  arrayUpdate: 0,
  handleEvent: 0,
  flushPendingWrites: 0,
};

// Log prefix
const LOG_PREFIX = '[V8-DataEngine]';

/** Deep clone an object */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/** Find component by ID (returns path) */
function findComponentPath(schema: SchemaComponent, id: string, path: number[] = []): number[] | null {
  if (schema.id === id) return path;
  if (schema.children) {
    for (let i = 0; i < schema.children.length; i++) {
      const child = schema.children[i];
      if (typeof child !== 'string') {
        const found = findComponentPath(child, id, [...path, i]);
        if (found) return found;
      }
    }
  }
  return null;
}

/** Get component by path */
function getComponentByPath(schema: SchemaComponent, path: number[]): SchemaComponent {
  let current = schema;
  for (const idx of path) {
    const child = current.children?.[idx];
    if (typeof child === 'string' || !child) {
      return current;
    }
    current = child;
  }
  return current;
}

/** Set value by property path */
function setValueByPath(obj: any, path: string, value: unknown): void {
  const parts = path.split('.').filter(Boolean);
  let target = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);

    if (arrayMatch) {
      const arrayName = arrayMatch[1];
      const index = Number(arrayMatch[2]);
      if (!target[arrayName]) target[arrayName] = [];
      if (!target[arrayName][index]) target[arrayName][index] = {};
      target = target[arrayName][index];
    } else {
      if (!target[part]) target[part] = {};
      target = target[part];
    }
  }

  const lastPart = parts[parts.length - 1];
  if (target && lastPart) {
    target[lastPart] = value;
  }
}

/** Get array target by path */
function getArrayByPath(obj: any, path: string): unknown[] | null {
  const parts = path.split('.').filter(Boolean);
  let target = obj;
  for (const part of parts) {
    if (!target || typeof target !== 'object') return null;
    target = target[part];
  }
  return Array.isArray(target) ? target : null;
}

export const DataEngine = {
  /** Initialize (set vault path) */
  init(vaultPath: string) {
    executionCounters.init++;
    console.log(`${LOG_PREFIX} init() #${executionCounters.init}`, { vaultPath, cacheSize: pageCache.size });

    let deletedCount = 0;
    pageCache.forEach((cache, pageId) => {
      if (cache.vaultPath !== vaultPath) {
        pageCache.delete(pageId);
        deletedCount++;
      }
    });

    console.log(`${LOG_PREFIX} init() completed`, { deletedPages: deletedCount, remainingCache: pageCache.size });
  },

  /** Read page */
  readPage(pageId: string, vaultPath: string): SchemaComponent | null {
    executionCounters.readPage++;
    console.log(`${LOG_PREFIX} readPage() #${executionCounters.readPage}`, { pageId, vaultPath });

    const cached = pageCache.get(pageId);
    const hit = cached && cached.vaultPath === vaultPath;

    console.log(`${LOG_PREFIX} readPage() result`, { pageId, cacheHit: hit, hasSchema: !!cached?.schema });

    if (hit) {
      return cached.schema;
    }
    return null;
  },

  /** Set page cache */
  setPage(pageId: string, vaultPath: string, schema: SchemaComponent): void {
    executionCounters.setPage++;
    console.log(`${LOG_PREFIX} setPage() #${executionCounters.setPage}`, { pageId, vaultPath, schemaElement: schema.element });

    pageCache.set(pageId, { schema, vaultPath });

    console.log(`${LOG_PREFIX} setPage() completed`, { pageId, cacheSize: pageCache.size });
  },

  /** Write page (debounced save) */
  writePage(pageId: string, vaultPath: string, data: SchemaComponent, onSave: (data: SchemaComponent) => void): void {
    executionCounters.writePage++;
    console.log(`${LOG_PREFIX} writePage() #${executionCounters.writePage}`, { pageId, vaultPath, schemaElement: data.element });

    // Update cache (new reference)
    pageCache.set(pageId, { schema: data, vaultPath });

    // Clear old timer
    const existing = writeQueue.get(pageId);
    if (existing) {
      console.log(`${LOG_PREFIX} writePage() clearing existing timer`, { pageId });
      clearTimeout(existing.timer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      console.log(`${LOG_PREFIX} writePage() executing save callback`, { pageId });
      onSave(data);
      writeQueue.delete(pageId);
      console.log(`${LOG_PREFIX} writePage() save completed`, { pageId, queueSize: writeQueue.size });
    }, DEBOUNCE_MS);

    writeQueue.set(pageId, { timer, onSave });
    console.log(`${LOG_PREFIX} writePage() debounce scheduled`, { pageId, queueSize: writeQueue.size, debounceMs: DEBOUNCE_MS });
  },

  /** Flush all pending writes immediately */
  flushPendingWrites(pageId?: string): void {
    executionCounters.flushPendingWrites++;
    console.log(`${LOG_PREFIX} flushPendingWrites() #${executionCounters.flushPendingWrites}`, { pageId, queueSize: writeQueue.size });

    if (pageId) {
      // Save specific page
      const pending = writeQueue.get(pageId);
      if (pending) {
        clearTimeout(pending.timer);
        const cache = pageCache.get(pageId);
        if (cache) {
          console.log(`${LOG_PREFIX} flushPendingWrites() saving page`, { pageId });
          pending.onSave(cache.schema);
        }
        writeQueue.delete(pageId);
      }
    } else {
      // Save all pending pages
      writeQueue.forEach((pending, id) => {
        clearTimeout(pending.timer);
        const cache = pageCache.get(id);
        if (cache) {
          console.log(`${LOG_PREFIX} flushPendingWrites() saving page`, { pageId: id });
          pending.onSave(cache.schema);
        }
      });
      writeQueue.clear();
    }

    console.log(`${LOG_PREFIX} flushPendingWrites() completed`, { remainingQueue: writeQueue.size });
  },

  /** Update field (immutable update) */
  updateField(pageId: string, vaultPath: string, path: string, value: unknown, onSave: (data: SchemaComponent) => void, componentId?: string): SchemaComponent | null {
    executionCounters.updateField++;
    console.log(`${LOG_PREFIX} updateField() #${executionCounters.updateField}`, { pageId, path, value, componentId });

    const schema = this.readPage(pageId, vaultPath);
    if (!schema) {
      console.log(`${LOG_PREFIX} updateField() aborted - schema not found`, { pageId });
      return null;
    }

    // Deep clone to create new object
    const newSchema = deepClone(schema);

    // Find target component
    let targetSchema = newSchema;
    if (componentId) {
      const componentPath = findComponentPath(newSchema, componentId);
      if (componentPath) {
        targetSchema = getComponentByPath(newSchema, componentPath);
        console.log(`${LOG_PREFIX} updateField() found component`, { pageId, componentId, path: componentPath });
      } else {
        console.log(`${LOG_PREFIX} updateField() component not found`, { pageId, componentId });
      }
    }

    // Update value
    setValueByPath(targetSchema, path, value);

    console.log(`${LOG_PREFIX} updateField() completed`, { pageId, path, newValue: value });

    // Update cache and trigger debounced save
    this.writePage(pageId, vaultPath, newSchema, onSave);

    return newSchema;
  },

  /** Array push (immutable update) */
  arrayPush(pageId: string, vaultPath: string, path: string, item: unknown, onSave: (data: SchemaComponent) => void, componentId?: string): SchemaComponent | null {
    executionCounters.arrayPush++;
    console.log(`${LOG_PREFIX} arrayPush() #${executionCounters.arrayPush}`, { pageId, path, item, componentId });

    const schema = this.readPage(pageId, vaultPath);
    if (!schema) {
      console.log(`${LOG_PREFIX} arrayPush() aborted - schema not found`, { pageId });
      return null;
    }

    // Deep clone to create new object
    const newSchema = deepClone(schema);

    // Find target component
    let targetSchema = newSchema;
    if (componentId) {
      const componentPath = findComponentPath(newSchema, componentId);
      if (componentPath) {
        targetSchema = getComponentByPath(newSchema, componentPath);
        console.log(`${LOG_PREFIX} arrayPush() found component`, { pageId, componentId, path: componentPath });
      }
    }

    const target = getArrayByPath(targetSchema, path);
    if (target) {
      target.push(item);
      console.log(`${LOG_PREFIX} arrayPush() completed`, { pageId, path, newLength: target.length });
      this.writePage(pageId, vaultPath, newSchema, onSave);
      return newSchema;
    } else {
      console.log(`${LOG_PREFIX} arrayPush() aborted - target is not array`, { pageId, path });
      return null;
    }
  },

  /** Array splice (immutable update) */
  arraySplice(pageId: string, vaultPath: string, path: string, index: number, count: number, onSave: (data: SchemaComponent) => void, componentId?: string): SchemaComponent | null {
    executionCounters.arraySplice++;
    console.log(`${LOG_PREFIX} arraySplice() #${executionCounters.arraySplice}`, { pageId, path, index, count, componentId });

    const schema = this.readPage(pageId, vaultPath);
    if (!schema) {
      console.log(`${LOG_PREFIX} arraySplice() aborted - schema not found`, { pageId });
      return null;
    }

    // Deep clone to create new object
    const newSchema = deepClone(schema);

    // Find target component
    let targetSchema = newSchema;
    if (componentId) {
      const componentPath = findComponentPath(newSchema, componentId);
      if (componentPath) {
        targetSchema = getComponentByPath(newSchema, componentPath);
        console.log(`${LOG_PREFIX} arraySplice() found component`, { pageId, componentId, path: componentPath });
      }
    }

    const target = getArrayByPath(targetSchema, path);
    if (target) {
      target.splice(index, count);
      console.log(`${LOG_PREFIX} arraySplice() completed`, { pageId, path, newLength: target.length });
      this.writePage(pageId, vaultPath, newSchema, onSave);
      return newSchema;
    } else {
      console.log(`${LOG_PREFIX} arraySplice() aborted - target is not array`, { pageId, path });
      return null;
    }
  },

  /** Array item update (immutable update) */
  arrayUpdate(pageId: string, vaultPath: string, path: string, index: number, field: string, value: unknown, onSave: (data: SchemaComponent) => void, componentId?: string): SchemaComponent | null {
    executionCounters.arrayUpdate++;
    console.log(`${LOG_PREFIX} arrayUpdate() #${executionCounters.arrayUpdate}`, { pageId, path, index, field, value, componentId });

    const schema = this.readPage(pageId, vaultPath);
    if (!schema) {
      console.log(`${LOG_PREFIX} arrayUpdate() aborted - schema not found`, { pageId });
      return null;
    }

    // Deep clone to create new object
    const newSchema = deepClone(schema);

    // Find target component
    let targetSchema = newSchema;
    if (componentId) {
      const componentPath = findComponentPath(newSchema, componentId);
      if (componentPath) {
        targetSchema = getComponentByPath(newSchema, componentPath);
        console.log(`${LOG_PREFIX} arrayUpdate() found component`, { pageId, componentId, path: componentPath });
      }
    }

    const target = getArrayByPath(targetSchema, path);
    if (target && target[index]) {
      (target[index] as Record<string, unknown>)[field] = value;
      console.log(`${LOG_PREFIX} arrayUpdate() completed`, { pageId, path, index, field, newValue: value });
      this.writePage(pageId, vaultPath, newSchema, onSave);
      return newSchema;
    } else {
      console.log(`${LOG_PREFIX} arrayUpdate() aborted - invalid target or index`, { pageId, path, index, isArray: Array.isArray(target) });
      return null;
    }
  },

  /** Execute complex nested array update (using dynamic evaluation) */
  executeComplexUpdate(pageId: string, vaultPath: string, expr: string, context: EventContext, onSave: (data: SchemaComponent) => void, componentId?: string): SchemaComponent | null {
    console.log(`${LOG_PREFIX} executeComplexUpdate()`, { pageId, expr, componentId });

    const schema = this.readPage(pageId, vaultPath);
    if (!schema) {
      console.log(`${LOG_PREFIX} executeComplexUpdate() aborted - schema not found`, { pageId });
      return null;
    }

    // Deep clone to create new object
    const newSchema = deepClone(schema);

    // Find target component
    let targetSchema = newSchema;
    if (componentId) {
      const componentPath = findComponentPath(newSchema, componentId);
      if (componentPath) {
        targetSchema = getComponentByPath(newSchema, componentPath);
        console.log(`${LOG_PREFIX} executeComplexUpdate() found component`, { pageId, componentId, path: componentPath });
      }
    }

    // Ensure targetSchema.data exists
    if (!targetSchema.data) {
      console.log(`${LOG_PREFIX} executeComplexUpdate() aborted - targetSchema.data is undefined`, { pageId, componentId });
      return null;
    }

    try {
      // Build parameter names and values
      const paramNames: string[] = ['data', 'event'];
      const paramValues: unknown[] = [targetSchema.data, context.event];

      // Add loop variables
      if (context.loopVars) {
        for (const [name, value] of Object.entries(context.loopVars)) {
          paramNames.push(name);
          paramValues.push(value);
        }
      }

      console.log(`${LOG_PREFIX} executeComplexUpdate() before execution`, {
        pageId,
        expr,
        paramNames,
        loopVars: context.loopVars,
        dataBefore: JSON.stringify(targetSchema.data).slice(0, 200),
      });

      // Dynamically execute assignment expression
      const func = new Function(...paramNames, expr);
      func(...paramValues);

      console.log(`${LOG_PREFIX} executeComplexUpdate() after execution`, {
        pageId,
        expr,
        dataAfter: JSON.stringify(targetSchema.data).slice(0, 200),
      });

      console.log(`${LOG_PREFIX} executeComplexUpdate() completed`, { pageId, expr });
      this.writePage(pageId, vaultPath, newSchema, onSave);
      return newSchema;
    } catch (error) {
      console.error(`${LOG_PREFIX} executeComplexUpdate() error`, { pageId, expr, error: String(error) });
      return null;
    }
  },

  /** Handle event expression */
  handleEvent(pageId: string, vaultPath: string, eventExpr: string, context: EventContext, onSave: (data: SchemaComponent) => void, componentId?: string): SchemaComponent | null {
    executionCounters.handleEvent++;
    console.log(`${LOG_PREFIX} handleEvent() #${executionCounters.handleEvent}`, { pageId, eventExpr, componentId });

    const parsed = parseEventExpression(eventExpr);
    console.log(`${LOG_PREFIX} handleEvent() parsed`, { pageId, type: parsed.type, path: parsed.path });

    let result: SchemaComponent | null = null;

    switch (parsed.type) {
      case 'set': {
        const value = evaluateExpression(parsed.value || '', context);
        console.log(`${LOG_PREFIX} handleEvent() executing SET`, { pageId, path: parsed.path, value, componentId });
        result = this.updateField(pageId, vaultPath, parsed.path, value, onSave, componentId);
        break;
      }
      case 'push': {
        const item = evaluateExpression(parsed.value || '', context);
        console.log(`${LOG_PREFIX} handleEvent() executing PUSH`, { pageId, path: parsed.path, item, componentId });
        result = this.arrayPush(pageId, vaultPath, parsed.path, item, onSave, componentId);
        break;
      }
      case 'splice': {
        // Get index from loopVars or context
        let index: number;
        if (context.loopVars && parsed.index && parsed.index in context.loopVars) {
          index = context.loopVars[parsed.index] as number;
        } else {
          index = context[parsed.index as keyof EventContext] as number;
        }
        console.log(`${LOG_PREFIX} handleEvent() executing SPLICE`, { pageId, path: parsed.path, index, count: parsed.count, componentId });
        result = this.arraySplice(pageId, vaultPath, parsed.path, index, parsed.count || 1, onSave, componentId);
        break;
      }
      case 'update': {
        // Get index from loopVars or context
        let index: number;
        if (context.loopVars && 'idx' in context.loopVars) {
          index = context.loopVars['idx'] as number;
        } else {
          index = context.idx ?? 0;
        }
        const [field, valueExpr] = (parsed.value || '=').split('=');
        const value = evaluateExpression(valueExpr, context);
        console.log(`${LOG_PREFIX} handleEvent() executing UPDATE`, { pageId, path: parsed.path, index, field, value, componentId });
        result = this.arrayUpdate(pageId, vaultPath, parsed.path, index, field, value, onSave, componentId);
        break;
      }
      case 'complex': {
        // Complex nested array access, use dynamic evaluation to modify data directly
        console.log(`${LOG_PREFIX} handleEvent() executing COMPLEX`, { pageId, fullExpr: parsed.fullExpr, componentId });
        result = this.executeComplexUpdate(pageId, vaultPath, parsed.fullExpr || eventExpr, context, onSave, componentId);
        break;
      }
    }

    console.log(`${LOG_PREFIX} handleEvent() completed`, { pageId, type: parsed.type, hasResult: !!result });
    return result;
  },
};
