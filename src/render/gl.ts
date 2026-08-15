import { MIN_INTEGER_SCALE, SCREEN_HEIGHT, SCREEN_WIDTH } from "../config";

export function createGL(canvas: HTMLCanvasElement): WebGLRenderingContext {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, preserveDrawingBuffer: false });
  if (!gl) throw new Error("WebGL is not supported in this browser.");
  canvas.width = SCREEN_WIDTH;
  canvas.height = SCREEN_HEIGHT;
  return gl;
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info ?? "unknown"}`);
  }
  return shader;
}

export function createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program.");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    throw new Error(`Program link error: ${info ?? "unknown"}`);
  }
  return program;
}

/**
 * Keeps the canvas's internal pixel buffer fixed at SCREEN_WIDTH x SCREEN_HEIGHT
 * and scales its CSS display size by the largest integer factor that fits the
 * window, so nearest-neighbor upscaling stays crisp at any zoom level.
 */
export function fitCanvasToWindow(canvas: HTMLCanvasElement): number {
  const availW = window.innerWidth - 24;
  const availH = window.innerHeight - 24;
  const scaleX = Math.floor(availW / SCREEN_WIDTH);
  const scaleY = Math.floor(availH / SCREEN_HEIGHT);
  const scale = Math.max(MIN_INTEGER_SCALE, Math.min(scaleX, scaleY));
  canvas.style.width = `${SCREEN_WIDTH * scale}px`;
  canvas.style.height = `${SCREEN_HEIGHT * scale}px`;
  return scale;
}
