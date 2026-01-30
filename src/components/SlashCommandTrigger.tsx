/** 全局斜杠命令触发器 - 浮动输入框 */

import { useEffect, useRef, useState } from 'react';

interface SlashCommandTriggerProps {
  isOpen: boolean;
  position: { x: number; y: number };
  editorWidth: number;
  onInput: (value: string, isSlashMode: boolean) => void;
  onClose: () => void;
}

export function SlashCommandTrigger({ isOpen, position, editorWidth, onInput, onClose }: SlashCommandTriggerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');

  const isSlashMode = value.startsWith('/');

  // 自动聚焦
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setValue('');
    }
  }, [isOpen]);

  // 监听输入变化
  useEffect(() => {
    if (isOpen) {
      // 去掉开头的 /，传递给菜单作为过滤条件
      const filter = value.startsWith('/') ? value.slice(1) : '';
      onInput(filter, isSlashMode);
    }
  }, [value, isOpen, onInput, isSlashMode]);

  // 监听键盘事件
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 失焦时如果没有内容则关闭
  const handleBlur = () => {
    if (!value.trim()) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* 内联样式输入框 */}
      <div
        className={`fixed z-50 px-2 py-1 rounded ${isSlashMode ? 'bg-background shadow-sm border' : ''}`}
        style={{ left: position.x, top: position.y, width: editorWidth || 'auto' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          className="w-full outline-none bg-transparent text-foreground"
          placeholder={isSlashMode ? '筛选' : '输入文本，按"空格"启动AI，按"/"启用指令'}
        />
      </div>
    </>
  );
}
