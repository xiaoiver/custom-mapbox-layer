// @ts-ignore
import * as TinySDF from '@mapbox/tiny-sdf';
import { AlphaImage, StyleGlyph } from '../symbol/AlphaImage';

const fontsize = 24; // Font size in pixels
const buffer = 3;    // Whitespace buffer around a glyph in pixels
const radius = 8;    // How many pixels around the glyph shape to use for encoding distance
const cutoff = 0.25  // How much of the radius (relative) is used for the inside part the glyph

const fontFamily = 'sans-serif'; // css font-family

const sdfGeneratorCache: {
  [fontStack: string]: TinySDF;
} = {};

export function generateSDF(fontStack: string = '', char: string): StyleGlyph {
  let sdfGenerator = sdfGeneratorCache[fontStack];
  if (!sdfGenerator) {
    // 根据字体描述中包含的信息设置 fontWeight
    let fontWeight = '400';
    if (/bold/i.test(fontStack)) {
      fontWeight = '900';
    } else if (/medium/i.test(fontStack)) {
      fontWeight = '500';
    } else if (/light/i.test(fontStack)) {
      fontWeight = '200';
    }
    // 创建 SDF
    sdfGenerator = sdfGeneratorCache[fontStack]
      = new TinySDF(fontsize, buffer, radius, cutoff, fontFamily, fontWeight);
  }

  return {
    id: char.charCodeAt(0),
    // 在 canvas 中绘制字符，使用 Uint8Array 存储 30*30 sdf 数据
    bitmap: new AlphaImage({ width: 30, height: 30 }, sdfGenerator.draw(char)),
    metrics: {
      width: 24,
      height: 24,
      left: 0,
      top: -5,
      advance: 24
    }
  };
}
