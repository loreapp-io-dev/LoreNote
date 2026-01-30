import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollableRowProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollableRow({ children, className }: ScrollableRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div
      className="group/scroll relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Left arrow - only visible on hover */}
      <button
        onClick={() => scroll('left')}
        className={cn(
          'absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-background hover:scale-110 dark:bg-background/80',
          canScrollLeft && isHovering
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 -translate-x-2 pointer-events-none'
        )}
        aria-label="Scroll left"
      >
        <ChevronLeft size={18} className="text-foreground" />
      </button>

      {/* Right arrow - only visible on hover */}
      <button
        onClick={() => scroll('right')}
        className={cn(
          'absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-background hover:scale-110 dark:bg-background/80',
          canScrollRight && isHovering
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-2 pointer-events-none'
        )}
        aria-label="Scroll right"
      >
        <ChevronRight size={18} className="text-foreground" />
      </button>

      {/* Left blur fade - always visible when can scroll */}
      <div
        className={cn(
          'pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-background via-background/80 to-transparent transition-opacity duration-300',
          canScrollLeft ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Right blur fade - always visible when can scroll */}
      <div
        className={cn(
          'pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-background via-background/80 to-transparent transition-opacity duration-300',
          canScrollRight ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className={cn(
          'scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth py-2',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
