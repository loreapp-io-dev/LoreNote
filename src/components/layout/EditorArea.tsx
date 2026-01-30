import type { ReactNode } from 'react';

interface EditorAreaProps {
  children?: ReactNode;
}

export function EditorArea({ children }: EditorAreaProps) {
  return (
    <main className="flex-1 overflow-y-auto scrollbar-hide bg-white dark:bg-[#1e1e1e]">
      <div className="mx-auto max-w-4xl px-8 py-6 h-full min-h-full">
        {children}
      </div>
    </main>
  );
}
