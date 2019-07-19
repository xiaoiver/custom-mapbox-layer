import { mat4, vec4 } from 'gl-matrix';
import { EXTENT } from '../source/tile_id';

export const tileSize = 512;
/**
 * Converts a pixel value at a the given zoom level to tile units.
 */
export function pixelsToTileUnits(overscaledZ: number, pixelValue: number, z: number): number {
  return pixelValue * (EXTENT / (tileSize * Math.pow(2, z - overscaledZ)));
}

export function getLabelPlaneMatrix(
  posMatrix: mat4,
  pitchWithMap: boolean,
  rotateWithMap: boolean,
  transform: any,
  pixelsToTileUnits: number) {
  // @ts-ignore
  const m = mat4.identity(new Float32Array(16));
  if (pitchWithMap) {
    mat4.identity(m);
    mat4.scale(m, m, [1 / pixelsToTileUnits, 1 / pixelsToTileUnits, 1]);
    if (!rotateWithMap) {
      mat4.rotateZ(m, m, transform.angle);
    }
  } else {
    mat4.scale(m, m, [transform.width / 2, -transform.height / 2, 1]);
    mat4.translate(m, m, [1, -1, 0]);
    mat4.multiply(m, m, posMatrix);
  }
  return m;
}

/*
 * Returns a matrix for converting from the correct label coordinate space to gl coords.
 */
export function getGlCoordMatrix(
  posMatrix: mat4,
  pitchWithMap: boolean,
  rotateWithMap: boolean,
  transform: any,
  pixelsToTileUnits: number) {
  // @ts-ignore
  const m = mat4.identity(new Float32Array(16));
  if (pitchWithMap) {
    mat4.multiply(m, m, posMatrix);
    mat4.scale(m, m, [pixelsToTileUnits, pixelsToTileUnits, 1]);
    if (!rotateWithMap) {
      mat4.rotateZ(m, m, -transform.angle);
    }
  } else {
    mat4.scale(m, m, [1, -1, 1]);
    mat4.translate(m, m, [-1, -1, 0]);
    mat4.scale(m, m, [2 / transform.width, 2 / transform.height, 1]);
  }
  return m;
}

// For line label layout, we're not using z output and our w input is always 1
// This custom matrix transformation ignores those components to make projection faster
export function xyTransformMat4(out: vec4, a: vec4, m: mat4) {
  const x = a[0], y = a[1];
  out[0] = m[0] * x + m[4] * y + m[12];
  out[1] = m[1] * x + m[5] * y + m[13];
  out[3] = m[3] * x + m[7] * y + m[15];
  return out;
}