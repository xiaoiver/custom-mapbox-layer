import { AlphaImage, GlyphMetrics, StyleGlyph } from './AlphaImage';
declare type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
export declare type GlyphPosition = {
    rect: Rect;
    metrics: GlyphMetrics;
};
export declare type GlyphPositions = {
    [key: string]: {
        [key: number]: GlyphPosition;
    };
};
export default class GlyphAtlas {
    image: AlphaImage;
    positions: GlyphPositions;
    constructor(stacks: {
        [key: string]: {
            [key: number]: StyleGlyph;
        };
    });
}
export {};
