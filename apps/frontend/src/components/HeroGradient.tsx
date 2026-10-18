import { useEffect, useRef } from "react";

import { useTheme } from "@/app/theme-context";

const stops = [
  { pos: 0, value: 0 },
  { pos: 0.355, value: 0 },
  { pos: 0.3927, value: 58 },
  { pos: 0.8173, value: 58 },
  { pos: 0.855, value: 167 },
  { pos: 1, value: 167 },
];

function shade(position: number) {
  const value = Math.max(0, Math.min(1, position));
  for (let index = 1; index < stops.length; index += 1) {
    const left = stops[index - 1]!;
    const right = stops[index]!;
    if (value <= right.pos) {
      const blend = (value - left.pos) / (right.pos - left.pos);
      const eased = blend * blend * (3 - 2 * blend);
      return left.value + (right.value - left.value) * eased;
    }
  }
  return 167;
}

export function HeroGradient() {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext || typeof window.matchMedia !== "function") return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let start = 0;
    let visible = true;
    let lastDraw = 0;

    const draw = (elapsed: number) => {
      const width = canvas.width;
      const height = canvas.height;
      if (!width || !height) return;
      const image = context.createImageData(width, height);
      const ph = elapsed * 0.52;
      const angle = (306 + Math.sin(ph * 0.6) * 28 * 0.35) * (Math.PI / 180);
      const normalX = Math.sin(angle);
      const normalY = -Math.cos(angle);
      const crossX = -normalY;
      const crossY = normalX;
      const waveClock = 20.75 + ph * 1.2;
      const aspect = width / height;
      const scale = 0.67;

      for (let y = 0; y < height; y += 1) {
        const ny = y / height - 0.5;
        for (let x = 0; x < width; x += 1) {
          const nx = (x / width - 0.5) * aspect;
          const cross = nx * crossX + ny * crossY;
          const along = nx * normalX + ny * normalY;
          const bend = (8 / 100) * 0.35 * Math.sin(cross * 2.4 * Math.PI * 2 + waveClock);
          const band = 0.5 + (along + bend) / scale;
          const vignette = Math.min(1, (nx * nx + ny * ny) * 1.7);
          const value = shade(band);
          const color = theme === "light" ? 252 - (value / 167) * 29 - vignette * 3 : value * (1 - vignette * 0.08);
          const offset = (y * width + x) * 4;
          image.data[offset] = color;
          image.data[offset + 1] = color;
          image.data[offset + 2] = color;
          image.data[offset + 3] = 255;
        }
      }
      context.putImageData(image, 0, 0);
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.min(760, Math.ceil(bounds.width * 0.65)));
      canvas.height = Math.max(1, Math.min(480, Math.ceil(bounds.height * 0.65)));
      draw(motion.matches ? 0 : (performance.now() - start) / 1000);
    };

    const tick = (now: number) => {
      if (now - lastDraw >= 40) {
        draw((now - start) / 1000);
        lastDraw = now;
      }
      if (!motion.matches && visible) frame = requestAnimationFrame(tick);
    };

    const updateMotion = () => {
      cancelAnimationFrame(frame);
      if (motion.matches) draw(0);
      else if (visible) {
        start = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(canvas);
    const visibilityObserver =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => {
            visible = entry?.isIntersecting ?? false;
            cancelAnimationFrame(frame);
            if (visible && !motion.matches) frame = requestAnimationFrame(tick);
          })
        : null;
    visibilityObserver?.observe(canvas);
    window.addEventListener("resize", resize);
    motion.addEventListener("change", updateMotion);
    start = performance.now();
    resize();
    if (!motion.matches) frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", updateMotion);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="landing-hero-canvas absolute inset-0 size-full" aria-hidden="true" />;
}
