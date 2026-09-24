"use client";

import { useEffect, useRef } from "react";

const GAP = 16;

/** Ambient dot matrix whose dots swell and dim with slow interfering waves. Colors follow theme tokens. */
export function DotWaveField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    let width = 0;
    let height = 0;
    let frame = 0;
    let colors = { base: "", accent: "" };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const darkMode = window.matchMedia("(prefers-color-scheme: dark)");

    function readColors() {
      const style = getComputedStyle(canvas!);
      colors = {
        base: style.getPropertyValue("--color-foreground").trim(),
        accent: style.getPropertyValue("--color-primary").trim(),
      };
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function draw(time: number) {
      if (width === 0 || height === 0) {
        return;
      }
      const t = time / 1000;
      context!.clearRect(0, 0, width, height);
      for (let x = GAP / 2; x < width; x += GAP) {
        for (let y = GAP / 2; y < height; y += GAP) {
          const wave = (Math.sin(x * 0.03 + t * 0.9) + Math.sin(y * 0.045 - t * 0.7) + Math.sin((x + y) * 0.018 + t * 0.5)) / 3;
          const level = (wave + 1) / 2;
          const accent = level > 0.84;
          context!.globalAlpha = accent ? 0.35 + level * 0.45 : 0.08 + level * 0.28;
          context!.fillStyle = accent ? colors.accent : colors.base;
          context!.beginPath();
          context!.arc(x, y, 0.6 + level * 1.8, 0, Math.PI * 2);
          context!.fill();
        }
      }
      context!.globalAlpha = 1;
    }

    function loop(time: number) {
      draw(time);
      frame = requestAnimationFrame(loop);
    }

    function start() {
      cancelAnimationFrame(frame);
      if (reducedMotion.matches) {
        draw(0);
      } else {
        frame = requestAnimationFrame(loop);
      }
    }

    function refreshColors() {
      readColors();
      if (reducedMotion.matches) {
        draw(0);
      }
    }

    const observer = new ResizeObserver(() => {
      resize();
      if (reducedMotion.matches) {
        draw(0);
      }
    });

    readColors();
    resize();
    observer.observe(canvas);
    reducedMotion.addEventListener("change", start);
    darkMode.addEventListener("change", refreshColors);
    start();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      reducedMotion.removeEventListener("change", start);
      darkMode.removeEventListener("change", refreshColors);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
