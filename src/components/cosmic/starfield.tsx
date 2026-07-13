'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/hooks';

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  speed: number;
  phase: number;
  drift: number;
}

/**
 * GPU-friendly twinkling starfield on a single canvas. Density scales with
 * viewport area; honours reduced-motion by rendering a static field.
 */
export function Starfield({ density = 0.00016 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let stars: Star[] = [];
    let color = '255,255,255';

    const readColor = () => {
      color = document.documentElement.classList.contains('dark') ? '255,255,255' : '90,70,160';
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { innerWidth: w, innerHeight: h } = window;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(420, Math.floor(w * h * density));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        baseAlpha: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.0016 + 0.0004,
        phase: Math.random() * Math.PI * 2,
        drift: Math.random() * 0.04 + 0.01,
      }));
    };

    const draw = (t: number) => {
      const h = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const twinkle = reduced ? s.baseAlpha : s.baseAlpha + Math.sin(t * s.speed + s.phase) * 0.35;
        const alpha = Math.max(0, Math.min(1, twinkle));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${color},${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (!reduced) {
          s.y -= s.drift;
          if (s.y < -2) s.y = h + 2;
        }
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };

    readColor();
    resize();
    draw(0);

    const observer = new MutationObserver(readColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [density, reduced]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}
