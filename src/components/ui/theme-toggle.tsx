'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMounted } from '@/lib/hooks';
import { cn } from '@/lib/utils/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'relative grid h-10 w-10 place-items-center rounded-full glass text-foreground transition-all hover:border-primary/40 hover:shadow-glow',
        className,
      )}
    >
      {mounted && (
        <span className="relative h-5 w-5">
          <Sun
            className={cn(
              'absolute inset-0 h-5 w-5 transition-all duration-500',
              isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100',
            )}
          />
          <Moon
            className={cn(
              'absolute inset-0 h-5 w-5 transition-all duration-500',
              isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0',
            )}
          />
        </span>
      )}
    </button>
  );
}
