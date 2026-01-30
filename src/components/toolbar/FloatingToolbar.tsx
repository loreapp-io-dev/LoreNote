import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';
import { IconButton } from '@/components/ui';

interface FloatingToolbarProps {
  onFormat?: (format: string) => void;
}

interface Position {
  x: number;
  y: number;
}

export function FloatingToolbar({ onFormat }: FloatingToolbarProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updateToolbarPosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setVisible(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // 检查选择是否在可编辑区域内
    const anchorNode = selection.anchorNode;
    const editableParent = anchorNode?.parentElement?.closest('[contenteditable="true"]');
    if (!editableParent) {
      setVisible(false);
      return;
    }

    // 计算工具栏位置（选区上方居中）
    const toolbarWidth = 320;
    const x = rect.left + rect.width / 2 - toolbarWidth / 2;
    const y = rect.top - 45;

    setPosition({
      x: Math.max(10, Math.min(x, window.innerWidth - toolbarWidth - 10)),
      y: Math.max(10, y),
    });
    setVisible(true);

    // 检查当前格式
    checkActiveFormats();
  }, []);

  const checkActiveFormats = () => {
    const formats: string[] = [];

    if (document.queryCommandState('bold')) formats.push('bold');
    if (document.queryCommandState('italic')) formats.push('italic');
    if (document.queryCommandState('underline')) formats.push('underline');
    if (document.queryCommandState('strikethrough')) formats.push('strikethrough');

    setActiveFormats(formats);
  };

  const handleFormat = (format: string) => {
    switch (format) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'underline':
        document.execCommand('underline', false);
        break;
      case 'strikethrough':
        document.execCommand('strikethrough', false);
        break;
      case 'code':
        // 包裹 code 标签
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          const range = selection.getRangeAt(0);
          const code = document.createElement('code');
          code.className = 'rounded bg-neutral-100 px-1 py-0.5 font-mono text-sm';
          range.surroundContents(code);
        }
        break;
      case 'link':
        const url = prompt('输入链接地址：');
        if (url) {
          document.execCommand('createLink', false, url);
        }
        break;
      case 'h1':
      case 'h2':
      case 'h3':
        // 转换为标题（需要更复杂的块级操作）
        onFormat?.(format);
        break;
    }

    checkActiveFormats();
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      // 延迟检测，等待选择稳定
      setTimeout(updateToolbarPosition, 10);
    };

    const handleMouseUp = () => {
      setTimeout(updateToolbarPosition, 10);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // 方向键或 Shift 键可能改变选择
      if (e.shiftKey || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        setTimeout(updateToolbarPosition, 10);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [updateToolbarPosition]);

  // 点击工具栏外部时隐藏
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        // 延迟检测，防止点击工具栏按钮时立即隐藏
        setTimeout(() => {
          const selection = window.getSelection();
          if (!selection || selection.isCollapsed) {
            setVisible(false);
          }
        }, 100);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!visible) return null;

  const toolbarItems = [
    { icon: Bold, format: 'bold', title: '粗体 (⌘B)' },
    { icon: Italic, format: 'italic', title: '斜体 (⌘I)' },
    { icon: Underline, format: 'underline', title: '下划线 (⌘U)' },
    { icon: Strikethrough, format: 'strikethrough', title: '删除线' },
    { icon: Code, format: 'code', title: '行内代码' },
    { icon: Link, format: 'link', title: '链接' },
    { type: 'divider' as const },
    { icon: Heading1, format: 'h1', title: '一级标题' },
    { icon: Heading2, format: 'h2', title: '二级标题' },
    { icon: Heading3, format: 'h3', title: '三级标题' },
  ];

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white px-1 py-1 shadow-lg"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {toolbarItems.map((item, index) =>
        item.type === 'divider' ? (
          <div key={index} className="mx-1 h-5 w-px bg-neutral-200" />
        ) : (
          <IconButton
            key={item.format}
            icon={item.icon!}
            size="sm"
            onClick={() => handleFormat(item.format!)}
            active={activeFormats.includes(item.format!)}
            title={item.title}
          />
        )
      )}
    </div>
  );
}
