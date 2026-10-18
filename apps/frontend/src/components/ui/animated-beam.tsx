/*
MIT License

Copyright (c) 2026 Klyv contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
import { useEffect, useId, useState, type CSSProperties, type RefObject } from "react";

import { cn } from "@/lib/utils";

type BeamProps = {
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  delay?: number;
  className?: string;
};

type Geometry = { width: number; height: number; path: string; length: number };

export function AnimatedBeam({ containerRef, fromRef, toRef, delay = 0, className }: BeamProps) {
  const gradientId = useId();
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const from = fromRef.current;
    const to = toRef.current;
    if (!container || !from || !to) return;

    const measure = () => {
      const bounds = container.getBoundingClientRect();
      const start = from.getBoundingClientRect();
      const end = to.getBoundingClientRect();
      const x1 = start.left - bounds.left + start.width / 2;
      const y1 = start.top - bounds.top + start.height / 2;
      const x2 = end.left - bounds.left + end.width / 2;
      const y2 = end.top - bounds.top + end.height / 2;
      const distance = Math.hypot(x2 - x1, y2 - y1);
      setGeometry({
        width: bounds.width,
        height: bounds.height,
        path: `M ${x1} ${y1} L ${x2} ${y2}`,
        length: distance,
      });
    };

    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    for (const element of [container, from, to]) observer?.observe(element);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [containerRef, fromRef, toRef]);

  if (!geometry || geometry.length === 0) return null;

  const lap = Math.round(geometry.length) + 54;
  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 z-0 overflow-visible", className)}
      width={geometry.width}
      height={geometry.height}
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      fill="none"
    >
      <defs>
        <linearGradient id={gradientId}>
          <stop offset="0%" stopColor="#c8f39a" stopOpacity="0" />
          <stop offset="50%" stopColor="#c8f39a" stopOpacity="1" />
          <stop offset="100%" stopColor="#c8f39a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={geometry.path} stroke="#c8f39a" strokeOpacity=".2" strokeWidth="1.5" />
      <path
        d={geometry.path}
        stroke={`url(#${gradientId})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`54 ${Math.round(geometry.length)}`}
        className="animated-beam-pulse"
        style={{ "--beam-travel": -lap, animationDelay: `${delay}s` } as CSSProperties}
      />
    </svg>
  );
}
