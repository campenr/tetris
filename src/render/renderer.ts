import { COLOR_DARK, COLOR_FACE, COLOR_LIGHT, COLOR_SHADOW, FONT_GLYPH_H, FONT_GLYPH_W, SCREEN_HEIGHT, SCREEN_WIDTH } from "../config";
import { FontAtlas } from "./font";
import { createProgram } from "./gl";

const VERT_SRC = `
attribute vec2 aPos;
attribute vec2 aUV;
attribute vec4 aColor;
uniform vec2 uResolution;
varying vec2 vUV;
varying vec4 vColor;
void main() {
  vec2 clip = vec2((aPos.x / uResolution.x) * 2.0 - 1.0, 1.0 - (aPos.y / uResolution.y) * 2.0);
  gl_Position = vec4(clip, 0.0, 1.0);
  vUV = aUV;
  vColor = aColor;
}
`;

const FRAG_SRC = `
precision mediump float;
varying vec2 vUV;
varying vec4 vColor;
uniform sampler2D uTex;
void main() {
  vec4 texel = texture2D(uTex, vUV);
  gl_FragColor = texel * vColor;
}
`;

export type RGB = readonly [number, number, number];

interface UV {
  u: number;
  v: number;
}

export function shade(color: RGB, factor: number): RGB {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return [clamp(color[0] * factor), clamp(color[1] * factor), clamp(color[2] * factor)];
}

export class Renderer {
  readonly font: FontAtlas;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private buffer: WebGLBuffer;
  private aPos: number;
  private aUV: number;
  private aColor: number;
  private uResolution: WebGLUniformLocation | null;
  private uTex: WebGLUniformLocation | null;
  private vertices: number[] = [];

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.program = createProgram(gl, VERT_SRC, FRAG_SRC);
    this.font = new FontAtlas(gl);

    const buf = gl.createBuffer();
    if (!buf) throw new Error("Failed to create vertex buffer.");
    this.buffer = buf;

    this.aPos = gl.getAttribLocation(this.program, "aPos");
    this.aUV = gl.getAttribLocation(this.program, "aUV");
    this.aColor = gl.getAttribLocation(this.program, "aColor");
    this.uResolution = gl.getUniformLocation(this.program, "uResolution");
    this.uTex = gl.getUniformLocation(this.program, "uTex");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  begin(): void {
    this.vertices.length = 0;
    const gl = this.gl;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  private pushVertex(x: number, y: number, u: number, v: number, r: number, g: number, b: number, a: number): void {
    this.vertices.push(x, y, u, v, r, g, b, a);
  }

  pushQuad(x: number, y: number, w: number, h: number, uv0: UV, uv1: UV, color: RGB, alpha = 1): void {
    const r = color[0] / 255;
    const g = color[1] / 255;
    const b = color[2] / 255;
    const x0 = x;
    const y0 = y;
    const x1 = x + w;
    const y1 = y + h;
    this.pushVertex(x0, y0, uv0.u, uv0.v, r, g, b, alpha);
    this.pushVertex(x1, y0, uv1.u, uv0.v, r, g, b, alpha);
    this.pushVertex(x0, y1, uv0.u, uv1.v, r, g, b, alpha);
    this.pushVertex(x1, y0, uv1.u, uv0.v, r, g, b, alpha);
    this.pushVertex(x1, y1, uv1.u, uv1.v, r, g, b, alpha);
    this.pushVertex(x0, y1, uv0.u, uv1.v, r, g, b, alpha);
  }

  solid(x: number, y: number, w: number, h: number, color: RGB, alpha = 1): void {
    if (w <= 0 || h <= 0) return;
    const s = this.font.solidUV;
    this.pushQuad(x, y, w, h, s, s, color, alpha);
  }

  /** Single-pixel Win3.0-style bevel edge. `raised` true = button-out look, false = sunken/inset. */
  bevelRect(x: number, y: number, w: number, h: number, raised: boolean, face: RGB = COLOR_FACE): void {
    this.solid(x, y, w, h, face);
    const lightColor = raised ? COLOR_LIGHT : COLOR_SHADOW;
    const darkColor = raised ? COLOR_SHADOW : COLOR_LIGHT;
    this.solid(x, y, w, 1, lightColor);
    this.solid(x, y, 1, h, lightColor);
    this.solid(x, y + h - 1, w, 1, darkColor);
    this.solid(x + w - 1, y, 1, h, darkColor);
  }

  /** Double-thickness bevel, closer to a real Win3.0 group-box/panel edge. */
  panelBevel(x: number, y: number, w: number, h: number, raised: boolean, face: RGB = COLOR_FACE): void {
    this.solid(x, y, w, h, face);
    const outer = raised ? COLOR_DARK : COLOR_LIGHT;
    const outerOpp = raised ? COLOR_LIGHT : COLOR_DARK;
    this.solid(x, y, w, 1, outer);
    this.solid(x, y, 1, h, outer);
    this.solid(x, y + h - 1, w, 1, outerOpp);
    this.solid(x + w - 1, y, 1, h, outerOpp);
    const inner = raised ? COLOR_LIGHT : COLOR_SHADOW;
    const innerOpp = raised ? COLOR_SHADOW : COLOR_LIGHT;
    this.solid(x + 1, y + 1, w - 2, 1, inner);
    this.solid(x + 1, y + 1, 1, h - 2, inner);
    this.solid(x + 1, y + h - 2, w - 2, 1, innerOpp);
    this.solid(x + w - 2, y + 1, 1, h - 2, innerOpp);
  }

  /** A classic beveled tetromino square: dark outer rim, bright top/left inner highlight, dark bottom/right inner shadow. */
  block(x: number, y: number, size: number, color: RGB, alpha = 1): void {
    this.solid(x, y, size, size, shade(color, 0.55), alpha);
    const inner = size - 2;
    if (inner <= 0) return;
    this.solid(x + 1, y + 1, inner, inner, color, alpha);
    this.solid(x + 1, y + 1, inner, 1, shade(color, 1.4), alpha);
    this.solid(x + 1, y + 1, 1, inner, shade(color, 1.4), alpha);
    this.solid(x + 1, y + size - 2, inner, 1, shade(color, 0.6), alpha);
    this.solid(x + size - 2, y + 1, 1, inner, shade(color, 0.6), alpha);
  }

  glyph(x: number, y: number, ch: string, color: RGB, alpha = 1, scale = 1): void {
    if (ch === " ") return;
    const uv = this.font.uvForChar(ch);
    this.pushQuad(x, y, FONT_GLYPH_W * scale, FONT_GLYPH_H * scale, { u: uv.u0, v: uv.v0 }, { u: uv.u1, v: uv.v1 }, color, alpha);
  }

  text(x: number, y: number, str: string, color: RGB, scale = 1, alpha = 1): void {
    let cx = x;
    for (const ch of str) {
      this.glyph(cx, y, ch, color, alpha, scale);
      cx += FONT_GLYPH_W * scale;
    }
  }

  textWidth(str: string, scale = 1): number {
    return str.length * FONT_GLYPH_W * scale;
  }

  textCentered(cx: number, y: number, str: string, color: RGB, scale = 1, alpha = 1): void {
    this.text(cx - this.textWidth(str, scale) / 2, y, str, color, scale, alpha);
  }

  flush(): void {
    const gl = this.gl;
    if (this.vertices.length === 0) return;
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.DYNAMIC_DRAW);

    const stride = 8 * 4;
    gl.enableVertexAttribArray(this.aPos);
    gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(this.aUV);
    gl.vertexAttribPointer(this.aUV, 2, gl.FLOAT, false, stride, 2 * 4);
    gl.enableVertexAttribArray(this.aColor);
    gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, stride, 4 * 4);

    gl.uniform2f(this.uResolution, SCREEN_WIDTH, SCREEN_HEIGHT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.font.texture);
    gl.uniform1i(this.uTex, 0);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 8);
  }
}
