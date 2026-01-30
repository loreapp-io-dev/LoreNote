import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'solid';
  active?: boolean;
  disabled?: boolean;
  className?: string;
  title?: string;
}

const sizeClasses = {
  sm: 'p-1',
  md: 'p-1.5',
  lg: 'p-2',
};

const iconSizes = {
  sm: 14,
  md: 16,
  lg: 18,
};

const variantClasses = {
  ghost: 'hover:bg-neutral-100 dark:hover:bg-[#383838]',
  outline: 'border border-neutral-200 hover:bg-neutral-50 dark:border-[#404040] dark:hover:bg-[#383838]',
  solid: 'bg-neutral-100 hover:bg-neutral-200 dark:bg-[#333] dark:hover:bg-[#404040]',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      icon: Icon,
      onClick,
      onContextMenu,
      size = 'md',
      variant = 'ghost',
      active = false,
      disabled = false,
      className = '',
      title,
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        onClick={onClick}
        onContextMenu={onContextMenu}
        disabled={disabled}
        title={title}
        className={`
          inline-flex items-center justify-center rounded-md transition-colors
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${active ? 'bg-neutral-200 text-neutral-900 dark:bg-[#404040] dark:text-[#dcddde]' : 'text-neutral-600 dark:text-[#888]'}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${className}
        `}
      >
        <Icon size={iconSizes[size]} />
      </button>
    );
  }
);
