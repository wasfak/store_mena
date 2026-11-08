// Tiny dependency-free confetti burst on a throwaway full-screen canvas.

const COLORS = ["#fbbf24", "#fb7185", "#f97316", "#e879f9", "#fde68a", "#ffffff"];

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  shape: 0 | 1;
};

export function fireConfetti(origin?: { x: number; y: number }, count = 160) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: "200",
  });
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.remove();
  ctx.scale(dpr, dpr);

  const ox = origin?.x ?? window.innerWidth / 2;
  const oy = origin?.y ?? window.innerHeight / 2;
  const pieces: Piece[] = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const speed = 7 + Math.random() * 11;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      shape: Math.random() > 0.35 ? 0 : 1,
    };
  });

  const start = performance.now();
  const DURATION = 2600;
  const tick = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const fade = Math.max(0, 1 - Math.max(0, t - DURATION * 0.6) / (DURATION * 0.4));
    for (const p of pieces) {
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.32;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 0) {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)));
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (t < DURATION) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}
