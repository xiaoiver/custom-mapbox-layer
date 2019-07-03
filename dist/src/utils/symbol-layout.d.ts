import { StyleGlyph } from "symbol/AlphaImage";
export declare type PositionedGlyph = {
    glyph: number;
    x: number;
    y: number;
    vertical: boolean;
    scale: number;
    fontStack: string;
};
export declare type Shaping = {
    positionedGlyphs: Array<PositionedGlyph>;
    top: number;
    bottom: number;
    left: number;
    right: number;
    writingMode: 1 | 2;
    lineCount: number;
    text: string;
};
export declare type SymbolAnchor = 'center' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export declare type TextJustify = 'left' | 'center' | 'right';
export declare function shapeText(text: string, glyphs: {
    [key: string]: {
        [key: number]: StyleGlyph;
    };
}, defaultFontStack: string, maxWidth: number, lineHeight: number, textAnchor: SymbolAnchor, textJustify: TextJustify, spacing: number, translate: [number, number], writingMode: 1 | 2): Shaping | false;
