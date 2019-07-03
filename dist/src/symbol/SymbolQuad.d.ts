import * as Point from '@mapbox/point-geometry';
import { Shaping } from 'utils/symbol-layout';
import { GlyphPosition } from './GlyphAtlas';
export declare type SymbolQuad = {
    tl: Point;
    tr: Point;
    bl: Point;
    br: Point;
    tex: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    writingMode: any | void;
    glyphOffset: [number, number];
};
/**
 * Create the quads used for rendering a text label.
 * @private
 */
export declare function getGlyphQuads(shaping: Shaping, textOffset: [number, number], alongLine: boolean, positions: {
    [key: string]: {
        [key: number]: GlyphPosition;
    };
}): Array<SymbolQuad>;
