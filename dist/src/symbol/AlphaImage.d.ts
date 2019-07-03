export declare type GlyphMetrics = {
    width: number;
    height: number;
    left: number;
    top: number;
    advance: number;
};
export declare type StyleGlyph = {
    id: number;
    bitmap: AlphaImage;
    metrics: GlyphMetrics;
};
export declare type Size = {
    width: number;
    height: number;
};
declare type Point = {
    x: number;
    y: number;
};
export declare class AlphaImage {
    width: number;
    height: number;
    data: Uint8Array | Uint8ClampedArray;
    constructor(size: Size, data?: Uint8Array | Uint8ClampedArray);
    resize(size: Size): void;
    clone(): AlphaImage;
    static copy(srcImg: AlphaImage, dstImg: AlphaImage, srcPt: Point, dstPt: Point, size: Size): void;
}
export {};
