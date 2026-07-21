'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Scroll-triggered entrance animation.
 *
 * Deliberately CSS + a self-controlled IntersectionObserver rather than
 * framer's `whileInView`: that path leaves content at opacity:0 whenever the
 * observer never fires (headless capture) or when `useReducedMotion` resolves
 * a beat after hydration. Here the content is guaranteed to become visible —
 * on intersect, or immediately for reduced-motion / no-observer environments,
 * or via a short fallback timer — so a reveal can never trap content off-screen.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) {
      setShown(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          obs.disconnect();
        }
      },
      { rootMargin: '0px 0px -80px 0px' },
    );
    obs.observe(el);
    // Fallback: never leave content hidden if the observer somehow never fires.
    const t = setTimeout(() => setShown(true), 1200);
    return () => {
      obs.disconnect();
      clearTimeout(t);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(16px)',
        transition: `opacity 560ms cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 560ms cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        willChange: shown ? undefined : 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
