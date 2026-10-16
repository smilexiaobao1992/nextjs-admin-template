"use client";

import { useEffect, useRef } from "react";

/**
 * Generative topographic silk waves + harmonic dot lattice canvas.
 * Adapts to Graphite (terracotta/warm gold) and Indigo (electric indigo/violet) themes,
 * responds subtly to pointer position, and honors prefers-reduced-motion.
 */
export function DotWaveField({
  className,
  theme = "graphite",
}: {
  className?: string;
  theme?: "graphite" | "indigo";
}) {
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
    const pointer = { x: 0.5, y: 0.45, targetX: 0.5, targetY: 0.45 };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const palette =
      theme === "indigo"
        ? {
            glowA: "rgba(99, 102, 241, 0.24)",
            glowB: "rgba(56, 189, 248, 0.14)",
            linePrimary: "rgba(129, 140, 248, 0.34)",
            lineSecondary: "rgba(199, 210, 254, 0.14)",
            dotBase: "rgba(226, 232, 240, 0.22)",
            dotAccent: "rgba(129, 140, 248, 0.92)",
            ring: "rgba(148, 163, 184, 0.12)",
          }
        : {
            glowA: "rgba(224, 109, 68, 0.24)",
            glowB: "rgba(217, 167, 106, 0.14)",
            linePrimary: "rgba(232, 122, 82, 0.34)",
            lineSecondary: "rgba(245, 226, 210, 0.13)",
            dotBase: "rgba(231, 222, 212, 0.22)",
            dotAccent: "rgba(235, 118, 76, 0.92)",
            ring: "rgba(231, 222, 212, 0.11)",
          };

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
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

      const t = time * 0.00055;
      pointer.x += (pointer.targetX - pointer.x) * 0.04;
      pointer.y += (pointer.targetY - pointer.y) * 0.04;

      context!.clearRect(0, 0, width, height);

      // 1. Ambient atmospheric radial glows
      const px = width * pointer.x;
      const py = height * pointer.y;
      const gradA = context!.createRadialGradient(
        px,
        py,
        10,
        px,
        py,
        Math.max(width, height) * 0.62,
      );
      gradA.addColorStop(0, palette.glowA);
      gradA.addColorStop(0.55, palette.glowB);
      gradA.addColorStop(1, "rgba(0, 0, 0, 0)");
      context!.fillStyle = gradA;
      context!.fillRect(0, 0, width, height);

      // 2. Architectural orbital geometry (golden ratio rings)
      const cx = width * 0.62;
      const cy = height * 0.42;
      const baseRadius = Math.min(width, height) * 0.32;
      context!.strokeStyle = palette.ring;
      context!.lineWidth = 1;

      for (let r = 0; r < 3; r++) {
        const radius = baseRadius * (0.68 + r * 0.34);
        context!.beginPath();
        context!.arc(
          cx + Math.sin(t + r) * 8,
          cy + Math.cos(t * 0.8 + r) * 8,
          radius,
          0,
          Math.PI * 2,
        );
        context!.stroke();
      }

      // 3. Topographic flowing silk contour ribbons
      const lineCount = 26;
      const stepX = 14;
      for (let i = 0; i < lineCount; i++) {
        const progress = i / (lineCount - 1);
        const baseY = height * (0.16 + progress * 0.72);
        const isHighlight = i % 5 === 0;

        context!.beginPath();
        context!.strokeStyle = isHighlight
          ? palette.linePrimary
          : palette.lineSecondary;
        context!.lineWidth = isHighlight ? 1.25 : 0.85;

        for (let x = 0; x <= width + stepX; x += stepX) {
          const nx = x / width;
          const dx = nx - pointer.x;
          const dy = baseY / height - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const pointerLift = Math.exp(-dist * dist * 10) * 26;

          const wave1 = Math.sin(nx * 4.2 + t * 1.4 + i * 0.24) * 22;
          const wave2 = Math.cos(nx * 2.3 - t * 0.95 + i * 0.41) * 16;
          const wave3 = Math.sin((nx + progress) * 5.8 + t * 0.7) * 9;
          const y = baseY + wave1 + wave2 + wave3 - pointerLift;

          if (x === 0) {
            context!.moveTo(x, y);
          } else {
            context!.lineTo(x, y);
          }
        }
        context!.stroke();
      }

      // 4. Harmonic interference dot lattice
      const gap = 24;
      for (let x = gap; x < width - gap / 2; x += gap) {
        for (let y = gap; y < height - gap / 2; y += gap) {
          const wave =
            (Math.sin(x * 0.022 + t * 1.6) +
              Math.sin(y * 0.028 - t * 1.2) +
              Math.cos((x - y) * 0.016 + t)) /
            3;
          const level = (wave + 1) / 2;
          if (level < 0.42) {
            continue;
          }
          const isCrest = level > 0.82;
          context!.globalAlpha = isCrest
            ? 0.45 + (level - 0.82) * 2.8
            : (level - 0.42) * 0.55;
          context!.fillStyle = isCrest ? palette.dotAccent : palette.dotBase;
          context!.beginPath();
          context!.arc(
            x,
            y,
            isCrest ? 1.5 + (level - 0.82) * 4 : 0.9,
            0,
            Math.PI * 2,
          );
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
        draw(2400);
      } else {
        frame = requestAnimationFrame(loop);
      }
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pointer.targetX = (event.clientX - rect.left) / rect.width;
        pointer.targetY = (event.clientY - rect.top) / rect.height;
      }
    }

    const observer = new ResizeObserver(() => {
      resize();
      if (reducedMotion.matches) {
        draw(2400);
      }
    });

    resize();
    observer.observe(canvas);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    reducedMotion.addEventListener("change", start);
    start();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      reducedMotion.removeEventListener("change", start);
    };
  }, [theme]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
