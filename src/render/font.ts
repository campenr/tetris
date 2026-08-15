import { FONT_GLYPH_H, FONT_GLYPH_W } from "../config";
import { FALLBACK_GLYPH, GLYPH_COLS, GLYPH_ROWS, GLYPHS } from "./font-data";

const CHARSET = Object.keys(GLYPHS);
const ATLAS_COLS = 8;
const ATLAS_ROWS = Math.ceil((CHARSET.length + 1) / ATLAS_COLS); // +1 reserved solid cell
const SOLID_INDEX = ATLAS_COLS * ATLAS_ROWS - 1;

// Glyphs are drawn 5x7 within each 8x8 cell, offset by 1px on the left so
// there's natural letter spacing, and top-aligned with a 1px blank row
// beneath acting as line spacing.
const GLYPH_OFFSET_X = 1;
const GLYPH_OFFSET_Y = 0;

export interface UVRect {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

export class FontAtlas {
  readonly texture: WebGLTexture;
  readonly solidUV: { u: number; v: number };
  private atlasWidth = ATLAS_COLS * FONT_GLYPH_W;
  private atlasHeight = ATLAS_ROWS * FONT_GLYPH_H;
  private charIndex = new Map<string, number>();

  constructor(gl: WebGLRenderingContext) {
    CHARSET.forEach((ch, i) => this.charIndex.set(ch, i));

    const canvas = this.bake();

    const tex = gl.createTexture();
    if (!tex) throw new Error("Failed to create font atlas texture.");
    this.texture = tex;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const col = SOLID_INDEX % ATLAS_COLS;
    const row = Math.floor(SOLID_INDEX / ATLAS_COLS);
    this.solidUV = {
      u: (col + 0.5) * FONT_GLYPH_W / this.atlasWidth,
      v: (row + 0.5) * FONT_GLYPH_H / this.atlasHeight,
    };
  }

  private bake(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = this.atlasWidth;
    canvas.height = this.atlasHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.atlasWidth, this.atlasHeight);
    ctx.fillStyle = "#ffffff";

    CHARSET.forEach((ch, index) => {
      const cellCol = index % ATLAS_COLS;
      const cellRow = Math.floor(index / ATLAS_COLS);
      const baseX = cellCol * FONT_GLYPH_W + GLYPH_OFFSET_X;
      const baseY = cellRow * FONT_GLYPH_H + GLYPH_OFFSET_Y;
      const pattern = GLYPHS[ch];
      for (let r = 0; r < GLYPH_ROWS; r++) {
        const rowStr = pattern[r];
        for (let c = 0; c < GLYPH_COLS; c++) {
          if (rowStr[c] === "#") {
            ctx.fillRect(baseX + c, baseY + r, 1, 1);
          }
        }
      }
    });

    const rcol = SOLID_INDEX % ATLAS_COLS;
    const rrow = Math.floor(SOLID_INDEX / ATLAS_COLS);
    ctx.fillRect(rcol * FONT_GLYPH_W, rrow * FONT_GLYPH_H, FONT_GLYPH_W, FONT_GLYPH_H);

    return canvas;
  }

  uvForChar(ch: string): UVRect {
    const index = this.charIndex.get(ch) ?? this.charIndex.get(FALLBACK_GLYPH)!;
    const col = index % ATLAS_COLS;
    const row = Math.floor(index / ATLAS_COLS);
    return {
      u0: (col * FONT_GLYPH_W) / this.atlasWidth,
      v0: (row * FONT_GLYPH_H) / this.atlasHeight,
      u1: ((col + 1) * FONT_GLYPH_W) / this.atlasWidth,
      v1: ((row + 1) * FONT_GLYPH_H) / this.atlasHeight,
    };
  }
}
