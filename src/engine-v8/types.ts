/** V8 引擎类型定义 */

export interface ConditionalStyle {
  condition: string;
  className: string;
}

export interface ComponentStyle {
  className?: string;
  conditional?: ConditionalStyle[];
}

export interface SchemaComponent {
  element: string;
  id?: string;
  props?: Record<string, unknown>;
  style?: ComponentStyle;
  children?: (SchemaComponent | string)[];
  data?: Record<string, unknown>;
  events?: Record<string, string>;
  condition?: string;
  loop?: {
    items: string;
    itemName?: string;
    indexName?: string;
  };
}

export interface EventContext {
  data: Record<string, unknown>;
  props: Record<string, unknown>;
  item?: unknown;
  idx?: number;
  index?: number;
  event?: {
    target: {
      value?: string;
      checked?: boolean;
      innerText?: string;
    };
    // 键盘事件属性
    key?: string;
    code?: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  };
  // 循环变量映射（支持自定义变量名和嵌套循环）
  loopVars?: Record<string, unknown>;
}
