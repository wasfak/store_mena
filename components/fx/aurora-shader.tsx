"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

// Full-bleed animated aurora / mesh-gradient rendered by one tiny WebGL
// fragment shader (no three.js). Domain-warped fbm noise drifts slowly and
// leans toward the pointer. Cheap by design:
//  - renders at half resolution (the field is soft, upscaling is invisible)
//  - pauses when off-screen or when the tab is hidden
//  - draws a single still frame for reduced-motion users

const VERT = /* glsl */ `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = /* glsl */ `
precision mediump float;
uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;
uniform vec3  uC1;
uniform vec3  uC2;
uniform vec3  uC3;
uniform float uStrength;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.02 + 3.1;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = uTime * 0.045;

  vec2 m = vec2(uMouse.x * aspect, uMouse.y);
  float pull = exp(-2.6 * distance(p, m));
  p += (m - p) * pull * 0.18;

  vec2 q = vec2(fbm(p * 1.3 + vec2(0.0, t)), fbm(p * 1.3 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p * 1.5 + 2.4 * q + vec2(1.7, 9.2) + t * 0.8),
                fbm(p * 1.5 + 2.4 * q + vec2(8.3, 2.8) - t * 0.6));
  float f = fbm(p * 1.1 + 2.0 * r);

  // Colour comes from the warped field; alpha (premultiplied) from density,
  // so the canvas blends over whatever the page background is.
  vec3 col = mix(uC1, uC2, smoothstep(0.3, 1.05, length(q)));
  col = mix(col, uC3, smoothstep(0.55, 0.95, r.y) * 0.75);
  col = min(col + (uC1 * 0.3 + uC2 * 0.2) * pull * 0.4, vec3(1.0));
  float dens = smoothstep(0.18, 0.88, f) * 0.95 + pull * 0.2;

  // Aurora sits in the upper part of the hero and melts into the page.
  float band = smoothstep(0.02, 0.7, uv.y);
  float vignette = 1.0 - smoothstep(0.2, 1.3, distance(uv, vec2(0.5, 0.62)));
  float a = clamp(dens * band * vignette * uStrength, 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
}
`;

type Palette = {
  c1: [number, number, number];
  c2: [number, number, number];
  c3: [number, number, number];
  strength: number;
};

const DARK: Palette = {
  c1: [0.98, 0.62, 0.12],
  c2: [0.95, 0.28, 0.22],
  c3: [0.78, 0.16, 0.62],
  strength: 0.85,
};

const LIGHT: Palette = {
  c1: [1.0, 0.8, 0.45],
  c2: [1.0, 0.62, 0.55],
  c3: [0.95, 0.6, 0.85],
  strength: 0.7,
};

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export function AuroraShader({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const { resolvedTheme, forcedTheme } = useTheme();
  const theme = forcedTheme ?? resolvedTheme;
  const paletteRef = React.useRef<Palette>(DARK);
  const redrawRef = React.useRef<() => void>(() => {});

  React.useEffect(() => {
    paletteRef.current = theme === "light" ? LIGHT : DARK;
    redrawRef.current();
  }, [theme]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(prog, "uRes"),
      time: gl.getUniformLocation(prog, "uTime"),
      mouse: gl.getUniformLocation(prog, "uMouse"),
        c1: gl.getUniformLocation(prog, "uC1"),
      c2: gl.getUniformLocation(prog, "uC2"),
      c3: gl.getUniformLocation(prog, "uC3"),
      strength: gl.getUniformLocation(prog, "uStrength"),
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SCALE = 0.5;
    const mouse = { x: 0.5, y: 0.7, tx: 0.5, ty: 0.7 };
    let raf = 0;
    let visible = true;
    const start = performance.now();
    let frozenTime = 18.0;

    const resize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * SCALE));
      const h = Math.max(1, Math.floor(canvas.clientHeight * SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const draw = (time: number) => {
      const p = paletteRef.current;
      resize();
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.time, time);
      gl.uniform2f(u.mouse, mouse.x, mouse.y);
      gl.uniform3fv(u.c1, p.c1);
      gl.uniform3fv(u.c2, p.c2);
      gl.uniform3fv(u.c3, p.c3);
      gl.uniform1f(u.strength, p.strength);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = () => {
      frozenTime = (performance.now() - start) / 1000 + 18.0;
      draw(frozenTime);
      raf = requestAnimationFrame(loop);
    };
    const play = () => {
      cancelAnimationFrame(raf);
      if (reduced || !visible || document.hidden) {
        draw(frozenTime);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    redrawRef.current = () => draw(frozenTime);

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - rect.left) / rect.width;
      mouse.ty = 1 - (e.clientY - rect.top) / rect.height;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      play();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(() => draw(frozenTime));
    ro.observe(canvas);
    document.addEventListener("visibilitychange", play);
    window.addEventListener("pointermove", onPointer, { passive: true });
    play();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", play);
      window.removeEventListener("pointermove", onPointer);
      redrawRef.current = () => {};
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none block size-full", className)}
    />
  );
}
