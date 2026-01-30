/** Render Engine - Pure rendering + event handling */

import React from 'react';
import { cn } from '@/lib/utils';
import type { SchemaComponent, EventContext } from './types';
import { evaluateExpression } from './expression';
import { DataEngine } from './data-engine';
import { parseWikiLinks } from '@/services/wikiLinkService';
import { LinkPreviewPopover } from '@/features/editor/components/LinkPreviewPopover';
import type { PageReference } from '@/types';

const ELEMENT_ALIASES: Record<string, string> = {
  box: 'div',
  text: 'span',
  input: 'input',
  button: 'button',
  image: 'img',
  link: 'a',
};

// Execution counters
const executionCounters = {
  renderSchema: 0,
  schemaRenderer: 0,
  conditionEval: 0,
  loopRender: 0,
  propsResolved: 0,
  eventBound: 0,
  childrenRendered: 0,
};

// Log prefix
const LOG_PREFIX = '[V8-RenderEngine]';

/**
 * Convert wiki links to HTML string (for contentEditable)
 */
function convertWikiLinksToHtml(text: string, pages?: PageReference[]): string {
  if (!text.includes('[[')) {
    return text;
  }

  const links = parseWikiLinks(text, pages);
  if (links.length === 0) {
    return text;
  }

  let result = '';
  let lastIndex = 0;

  for (const link of links) {
    if (link.start > lastIndex) {
      result += text.slice(lastIndex, link.start);
    }
    const colorClass = link.isValid
      ? 'color: rgb(59, 130, 246); cursor: pointer;'
      : 'color: rgb(239, 68, 68); opacity: 0.7;';
    const displayText = link.displayText || link.targetTitle;
    result += `<span data-wiki-link="${link.targetPageId || ''}" style="${colorClass}">${displayText}</span>`;
    lastIndex = link.end;
  }

  if (lastIndex < text.length) {
    result += text.slice(lastIndex);
  }

  return result;
}

/**
 * Render text with wiki links
 * Converts [[page name]] to clickable links
 */
function renderTextWithWikiLinks(
  text: string,
  pages?: PageReference[],
  onNavigate?: (pageId: string) => void,
  key?: number
): React.ReactNode {
  if (!text.includes('[[')) {
    return text;
  }

  const links = parseWikiLinks(text, pages);
  if (links.length === 0) {
    return text;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const link of links) {
    // Add plain text before the link
    if (link.start > lastIndex) {
      parts.push(text.slice(lastIndex, link.start));
    }
    // Add link element (with hover preview)
    parts.push(
      <LinkPreviewPopover
        key={`wiki-${key}-${link.start}`}
        targetPageId={link.targetPageId || ''}
        targetTitle={link.targetTitle}
        displayText={link.displayText || link.targetTitle}
        isValid={link.isValid}
        onNavigate={onNavigate}
      />
    );
    lastIndex = link.end;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <React.Fragment key={key}>{parts}</React.Fragment>;
}

export function renderSchema(
  schema: SchemaComponent,
  pageId: string,
  vaultPath: string,
  onUpdate: () => void,
  onSave: (data: SchemaComponent) => void,
  pages?: PageReference[],
  onNavigate?: (pageId: string) => void
): React.ReactElement {
  executionCounters.renderSchema++;
  console.log(`${LOG_PREFIX} renderSchema() #${executionCounters.renderSchema}`, { pageId, element: schema.element });

  // Initialize root context, using schema.data as root data
  const rootContext: Partial<EventContext> = {
    data: schema.data || {},
    loopVars: {},
  };

  // Initial dataOwnerId is the root component's ID (if it has data)
  const initialDataOwnerId = schema.data && Object.keys(schema.data).length > 0 ? schema.id : undefined;

  return <SchemaRenderer schema={schema} pageId={pageId} vaultPath={vaultPath} onUpdate={onUpdate} onSave={onSave} context={rootContext} rootSchema={schema} dataOwnerId={initialDataOwnerId} pages={pages} onNavigate={onNavigate} />;
}

interface SchemaRendererProps {
  schema: SchemaComponent;
  pageId: string;
  vaultPath: string;
  onUpdate: () => void;
  onSave: (data: SchemaComponent) => void;
  context: Partial<EventContext>;
  rootSchema?: SchemaComponent; // Root component for accessing root data
  dataOwnerId?: string; // ID of component owning current data (for event handling)
  pages?: PageReference[];
  onNavigate?: (pageId: string) => void;
}

function SchemaRenderer({ schema, pageId, vaultPath, onUpdate, onSave, context, rootSchema, dataOwnerId, pages, onNavigate }: SchemaRendererProps): React.ReactElement | null {
  executionCounters.schemaRenderer++;

  // Special attention to table cells
  const isTableCell = schema.element === 'td' || schema.element === 'th' || (schema.element?.includes && schema.element.includes('td'));

  console.log(`${LOG_PREFIX} SchemaRenderer() #${executionCounters.schemaRenderer}`, {
    pageId,
    element: schema.element,
    hasLoop: !!schema.loop,
    hasCondition: !!schema.condition,
    hasEvents: Object.keys(schema.events || {}).length > 0,
    eventNames: Object.keys(schema.events || {}),
    isTableCell,
    schemaId: schema.id
  });

  // Ensure data field exists in original schema
  if (!schema.data && schema.events && Object.keys(schema.events).length > 0) {
    schema.data = {};
  }

  const { element, props = {}, style, children, events = {}, condition, loop } = schema;

  // Data inheritance: child components prefer their own data, otherwise use context data (from parent)
  // Also track the component ID that owns the current data
  const hasOwnData = !!(schema.data && Object.keys(schema.data).length > 0);
  const data = hasOwnData ? schema.data! : (context.data || {});
  // If current component has its own data, use current component's ID; otherwise inherit parent's dataOwnerId
  const currentDataOwnerId = hasOwnData ? schema.id : dataOwnerId;
  console.log(`${LOG_PREFIX} SchemaRenderer() data state`, { pageId, componentId: schema.id, hasOwnData, dataOwnerId: currentDataOwnerId, dataKeys: Object.keys(data) });

  // Validate Schema format
  if (!element) {
    console.error(`${LOG_PREFIX} SchemaRenderer() invalid schema - missing element field`, { pageId, schema });
    return null;
  }

  // Build context - merge loop variables
  const fullContext: EventContext = {
    data,
    props,
    item: context.item,
    idx: context.idx,
    index: context.index,
    loopVars: context.loopVars || {},
  };

  // Conditional rendering
  if (condition) {
    executionCounters.conditionEval++;
    const conditionResult = evaluateExpression(condition, fullContext);
    console.log(`${LOG_PREFIX} SchemaRenderer() condition evaluated #${executionCounters.conditionEval}`, { pageId, condition, result: conditionResult });
    if (!conditionResult) {
      return null;
    }
  }

  // Loop rendering
  if (loop) {
    executionCounters.loopRender++;
    console.log(`${LOG_PREFIX} SchemaRenderer() loop rendering #${executionCounters.loopRender}`, {
      pageId,
      loopItems: loop.items,
      element: schema.element,
      hasEvents: Object.keys(schema.events || {}).length > 0,
      eventNames: Object.keys(schema.events || {})
    });
    const items = evaluateExpression(loop.items, fullContext) as unknown[];
    if (!Array.isArray(items)) {
      console.log(`${LOG_PREFIX} SchemaRenderer() loop items not array`, { pageId, loopItems: loop.items, result: items });
      return null;
    }
    console.log(`${LOG_PREFIX} SchemaRenderer() loop rendering ${items.length} items`, { pageId });

    const itemName = loop.itemName || 'item';
    const indexName = loop.indexName || 'idx';

    return (
      <>
        {items.map((item, idx) => {
          // Build new loop variables map, preserving outer loop variables
          const newLoopVars: Record<string, unknown> = {
            ...(context.loopVars || {}),
            [itemName]: item,
            [indexName]: idx,
            // Maintain backward compatibility
            '$first': idx === 0,
            '$last': idx === items.length - 1,
          };

          // Create schema copy without loop, preserving all other properties (including events)
          const schemaWithoutLoop = { ...schema, loop: undefined };
          console.log(`${LOG_PREFIX} SchemaRenderer() loop item ${idx}`, {
            pageId,
            element: schemaWithoutLoop.element,
            hasEvents: Object.keys(schemaWithoutLoop.events || {}).length > 0,
            eventNames: Object.keys(schemaWithoutLoop.events || {}),
            loopVars: newLoopVars
          });

          return (
            <SchemaRenderer
              key={idx}
              schema={schemaWithoutLoop}
              pageId={pageId}
              vaultPath={vaultPath}
              onUpdate={onUpdate}
              onSave={onSave}
              context={{
                ...fullContext,
                item,
                idx,
                index: idx,
                loopVars: newLoopVars,
              }}
              rootSchema={rootSchema}
              dataOwnerId={currentDataOwnerId}
              pages={pages}
              onNavigate={onNavigate}
            />
          );
        })}
      </>
    );
  }

  // Resolve dynamic element name (supports ${...} expressions)
  let resolvedElement = element;
  if (element.includes('${')) {
    const expr = element.replace(/\$\{(.+?)\}/g, '$1');
    console.log(`${LOG_PREFIX} SchemaRenderer() resolving dynamic element`, { pageId, element, expr });
    const evaluated = evaluateExpression(expr, fullContext);
    if (typeof evaluated === 'string') {
      resolvedElement = evaluated;
    }
    console.log(`${LOG_PREFIX} SchemaRenderer() dynamic element resolved`, { pageId, original: element, resolved: resolvedElement });
  }

  const tagName = ELEMENT_ALIASES[resolvedElement] || resolvedElement;
  console.log(`${LOG_PREFIX} SchemaRenderer() resolving element`, { pageId, element: resolvedElement, tagName });

  // Resolve props
  executionCounters.propsResolved++;
  console.log(`${LOG_PREFIX} SchemaRenderer() resolving props #${executionCounters.propsResolved}`, { pageId, propsCount: Object.keys(props).length });
  const resolvedProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string' && value.includes('${')) {
      const expr = value.replace(/\$\{(.+?)\}/g, '$1');
      console.log(`${LOG_PREFIX} SchemaRenderer() resolving prop with expression`, { pageId, key, originalValue: value, expr });
      const resolved = evaluateExpression(expr, fullContext);
      console.log(`${LOG_PREFIX} SchemaRenderer() resolved prop expression`, { pageId, key, expr, resolved });
      resolvedProps[key] = resolved;
    } else {
      resolvedProps[key] = value;
    }
  }

  // If element is contentEditable, add suppressContentEditableWarning
  if (resolvedProps.contentEditable) {
    resolvedProps.suppressContentEditableWarning = true;
  }

  console.log(`${LOG_PREFIX} SchemaRenderer() props resolved`, { pageId, resolvedCount: Object.keys(resolvedProps).length });

  // Resolve dynamic styles
  let resolvedClassName = style?.className || '';
  if (resolvedClassName.includes('${')) {
    const expr = resolvedClassName.replace(/\$\{(.+?)\}/g, '$1');
    const evaluated = evaluateExpression(expr, fullContext);
    if (typeof evaluated === 'string') {
      resolvedClassName = evaluated;
    }
  }

  // Handle conditional styles
  if (style?.conditional) {
    for (const conditionalStyle of style.conditional) {
      const conditionResult = evaluateExpression(conditionalStyle.condition, fullContext);
      if (conditionResult) {
        resolvedClassName = cn(resolvedClassName, conditionalStyle.className);
      }
    }
  }

  // Bind events
  executionCounters.eventBound++;
  console.log(`${LOG_PREFIX} SchemaRenderer() binding events #${executionCounters.eventBound}`, {
    pageId,
    eventCount: Object.keys(events).length,
    events: Object.keys(events),
    element: schema.element,
    resolvedElement,
    tagName,
    loopVars: fullContext.loopVars
  });
  const eventHandlers: Record<string, (e: React.SyntheticEvent) => void> = {};
  for (const [eventName, eventExpr] of Object.entries(events)) {
    const handlerName = `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
    console.log(`${LOG_PREFIX} SchemaRenderer() creating event handler`, {
      pageId,
      eventName,
      handlerName,
      eventExpr,
      element: schema.element,
      tagName,
      loopVars: fullContext.loopVars
    });

    // Create event handler function
    const handler = (e: React.SyntheticEvent) => {
      console.log(`${LOG_PREFIX} ====== EVENT TRIGGERED ======`, {
        pageId,
        eventName,
        handlerName,
        eventExpr,
        tagName,
        eventType: e.type,
        targetTagName: (e.target as HTMLElement).tagName,
        loopVars: fullContext.loopVars
      });

      const target = e.target as HTMLElement;
      // Support contentEditable elements: prefer innerText, otherwise use value
      const targetValue = (target as HTMLInputElement).value ?? target.innerText ?? '';
      console.log(`${LOG_PREFIX} SchemaRenderer() event target value`, {
        pageId,
        eventName,
        targetValue,
        innerText: target.innerText
      });

      // Build event object, including keyboard event key property
      const keyboardEvent = e.nativeEvent as KeyboardEvent;
      const eventObject = {
        target: {
          value: targetValue,
          checked: (target as HTMLInputElement).checked,
          innerText: target.innerText ?? '',
        },
        // Keyboard event properties
        key: keyboardEvent.key,
        code: keyboardEvent.code,
        ctrlKey: keyboardEvent.ctrlKey,
        shiftKey: keyboardEvent.shiftKey,
        altKey: keyboardEvent.altKey,
        metaKey: keyboardEvent.metaKey,
      };

      const eventContext: EventContext = {
        ...fullContext,
        event: eventObject,
      };

      // Pass component ID to find the correct child component
      // Use the component ID that owns the current data for data updates
      const componentId = currentDataOwnerId || rootSchema?.id || schema.id;
      console.log(`${LOG_PREFIX} SchemaRenderer() using componentId for event`, {
        pageId,
        eventName,
        componentId,
        currentDataOwnerId,
        rootSchemaId: rootSchema?.id,
        schemaId: schema.id,
        loopVars: eventContext.loopVars
      });

      DataEngine.handleEvent(pageId, vaultPath, eventExpr, eventContext, onSave, componentId);

      // For input events (contentEditable input), don't trigger re-render
      // This avoids content being overwritten during input
      if (eventName !== 'input') {
        onUpdate();
      }
      console.log(`${LOG_PREFIX} SchemaRenderer() event handled successfully`, { pageId, eventName });
    };

    eventHandlers[handlerName] = handler;
    console.log(`${LOG_PREFIX} SchemaRenderer() event handler registered`, {
      pageId,
      handlerName,
      isFunction: typeof eventHandlers[handlerName] === 'function'
    });
  }

  // Render children
  executionCounters.childrenRendered++;
  console.log(`${LOG_PREFIX} SchemaRenderer() rendering children #${executionCounters.childrenRendered}`, { pageId, childrenCount: children?.length || 0 });

  // For contentEditable elements, use dangerouslySetInnerHTML to initialize content
  // This prevents user input from being overwritten by re-renders
  const isContentEditable = resolvedProps.contentEditable === true || resolvedProps.contentEditable === 'true';

  let renderedChildren: React.ReactNode = null;
  let initialHtml: string | undefined;

  if (isContentEditable && children?.length === 1 && typeof children[0] === 'string') {
    // contentEditable element with single string child, use dangerouslySetInnerHTML
    const child = children[0];
    let text: string;
    if (child.includes('${')) {
      text = String(evaluateExpression(child.replace(/\$\{(.+?)\}/g, '$1'), fullContext) ?? '');
    } else {
      text = child;
    }
    // Convert wiki links to HTML
    initialHtml = convertWikiLinksToHtml(text, pages);
    console.log(`${LOG_PREFIX} SchemaRenderer() contentEditable using dangerouslySetInnerHTML`, { pageId, initialHtml });
  } else {
    // Normal elements render children normally
    renderedChildren = children?.map((child, idx) => {
      if (typeof child === 'string') {
        let text = child;
        if (child.includes('${')) {
          text = String(evaluateExpression(child.replace(/\$\{(.+?)\}/g, '$1'), fullContext) ?? '');
          console.log(`${LOG_PREFIX} SchemaRenderer() evaluated string child`, { pageId, idx, original: child, evaluated: text });
        }
        // Render wiki links
        return renderTextWithWikiLinks(text, pages, onNavigate, idx);
      }
      console.log(`${LOG_PREFIX} SchemaRenderer() rendering child component`, { pageId, idx, childElement: child.element });
      return (
        <SchemaRenderer
          key={idx}
          schema={child}
          pageId={pageId}
          vaultPath={vaultPath}
          onUpdate={onUpdate}
          onSave={onSave}
          context={fullContext}
          rootSchema={rootSchema}
          dataOwnerId={currentDataOwnerId}
          pages={pages}
          onNavigate={onNavigate}
        />
      );
    });
  }

  console.log(`${LOG_PREFIX} SchemaRenderer() creating React element`, { pageId, tagName, hasChildren: !!renderedChildren, isContentEditable, hasEventHandlers: Object.keys(eventHandlers).length > 0, eventHandlerNames: Object.keys(eventHandlers) });

  // Build final props
  const finalProps: Record<string, unknown> = {
    ...resolvedProps,
    ...eventHandlers,
    className: cn(resolvedClassName),
  };

  console.log(`${LOG_PREFIX} SchemaRenderer() finalProps`, {
    pageId,
    tagName,
    propKeys: Object.keys(finalProps),
    hasOnInput: 'onInput' in finalProps,
    hasOnBlur: 'onBlur' in finalProps,
    contentEditable: finalProps.contentEditable,
    hasDangerouslySetInnerHTML: 'dangerouslySetInnerHTML' in finalProps
  });

  // If contentEditable with initial content, use dangerouslySetInnerHTML
  if (isContentEditable && initialHtml !== undefined) {
    finalProps.dangerouslySetInnerHTML = { __html: initialHtml };
    console.log(`${LOG_PREFIX} SchemaRenderer() returning contentEditable element with dangerouslySetInnerHTML`, {
      pageId,
      tagName,
      initialHtml,
      finalPropKeys: Object.keys(finalProps),
      hasOnInput: 'onInput' in finalProps
    });
    return React.createElement(tagName, finalProps);
  }

  return React.createElement(tagName, finalProps, renderedChildren);
}
