import { mat4, vec4 } from 'gl-matrix';
export declare const tileSize = 512;
/**
 * Converts a pixel value at a the given zoom level to tile units.
 */
export declare function pixelsToTileUnits(overscaledZ: number, pixelValue: number, z: number): number;
export declare function getLabelPlaneMatrix(posMatrix: mat4, pitchWithMap: boolean, rotateWithMap: boolean, transform: any, pixelsToTileUnits: number): mat4;
export declare function getGlCoordMatrix(posMatrix: mat4, pitchWithMap: boolean, rotateWithMap: boolean, transform: any, pixelsToTileUnits: number): mat4;
export declare function xyTransformMat4(out: vec4, a: vec4, m: mat4): vec4;
