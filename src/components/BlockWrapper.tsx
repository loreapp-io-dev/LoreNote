/** 组件包裹器 - 提供拖动、添加、删除、编辑、复制功能 */

import { GripVertical, Plus, Trash2, Pencil, Copy } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import type { SchemaComponent } from '@/engine-v8/types';

interface BlockWrapperProps {
  children: React.ReactNode;
  blockId: string;
  index: number;
  schema?: SchemaComponent;
  onAdd?: (index: number) => void;
  onEdit?: (index: number) => void;
  onDelete?: (index: number) => void;
  onCopy?: (index: number) => void;
  isSelected?: boolean;
}

export function BlockWrapper({
  children,
  blockId,
  index,
  schema,
  onAdd,
  onEdit,
  onDelete,
  onCopy,
  isSelected = false,
}: BlockWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: blockId });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex gap-2 py-1',
        isDragging && 'opacity-50 z-50 bg-background shadow-lg rounded',
        isOver && !isDragging && 'border-b border-dashed border-muted-foreground/50',
        isSelected && 'ring-2 ring-primary rounded-md bg-primary/5'
      )}
    >
      {/* 左侧控制栏 - 拖动手柄和添加按钮 */}
      <div className={cn(
        'flex items-start gap-1 pt-1 transition-opacity',
        isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      )}>
        {/* 拖动手柄 */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* 添加按钮 */}
        <button
          className="p-1 hover:bg-accent rounded"
          onClick={(e) => {
            e.stopPropagation();
            onAdd?.(index);
          }}
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* 组件内容 */}
      <div className="flex-1 min-w-0">
        {children}
      </div>

      {/* 右侧按钮组 - 复制、编辑和删除 */}
      <div className="flex items-start gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* 复制按钮 */}
        <button
          className="p-1 hover:bg-accent rounded"
          onClick={(e) => {
            e.stopPropagation();
            onCopy?.(index);
          }}
        >
          <Copy className="h-4 w-4 text-muted-foreground" />
        </button>
        {/* 编辑按钮 - 仅当组件有 isEditing 字段时显示 */}
        {schema?.data && 'isEditing' in schema.data && (
          <button
            className="p-1 hover:bg-accent rounded"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(index);
            }}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        {/* 删除按钮 */}
        <button
          className="p-1 hover:bg-destructive/10 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(index);
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </button>
      </div>
    </div>
  );
}
