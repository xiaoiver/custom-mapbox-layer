// @ts-ignore
import TinySDF from 'tiny-sdf';

var fontsize = 24; // Font size in pixels
var buffer = 3;    // Whitespace buffer around a glyph in pixels
var radius = 8;    // How many pixels around the glyph shape to use for encoding distance
var cutoff = 0.25  // How much of the radius (relative) is used for the inside part the glyph

var fontFamily = 'sans-serif'; // css font-family
var fontWeight = 400;     // css font-weight
var tinySDFGenerator = new TinySDF(fontsize, buffer, radius, cutoff, fontFamily, fontWeight);

const cache: {
  [key: string]: {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  };
} = {};

export function generateSDF(text: string) {
  if (cache[text]) {
    return cache[text];
  }

  const sdf = tinySDFGenerator.draw(text);
  cache[text] = sdf;
  return cache[text];
}
