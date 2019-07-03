import MercatorCoordinate from '../geo/mercator_coordinate';
/**
* The maximum value of a coordinate in the internal tile coordinate system. Coordinates of
* all source features normalized to this extent upon load.
*
* The value is a consequence of the following:
*
* * Vertex buffer store positions as signed 16 bit integers.
* * One bit is lost for signedness to support tile buffers.
* * One bit is lost because the line vertex buffer used to pack 1 bit of other data into the int.
*   This is no longer the case but we're reserving this bit anyway.
* * One bit is lost to support features extending past the extent on the right edge of the tile.
* * This leaves us with 2^13 = 8192
*
* @private
* @readonly
*/
export declare const EXTENT = 8192;
export declare class CanonicalTileID {
    z: number;
    x: number;
    y: number;
    key: number;
    constructor(z: number, x: number, y: number);
    equals(id: CanonicalTileID): boolean;
    getTilePoint(coord: MercatorCoordinate): any;
}
export declare class UnwrappedTileID {
    wrap: number;
    canonical: CanonicalTileID;
    key: number;
    constructor(wrap: number, canonical: CanonicalTileID);
}
export declare class OverscaledTileID {
    overscaledZ: number;
    wrap: number;
    canonical: CanonicalTileID;
    key: number;
    posMatrix: Float32Array;
    constructor(overscaledZ: number, wrap: number, z: number, x: number, y: number);
    equals(id: OverscaledTileID): boolean;
    scaledTo(targetZ: number): OverscaledTileID;
    isChildOf(parent: OverscaledTileID): boolean;
    children(sourceMaxZoom: number): OverscaledTileID[];
    isLessThan(rhs: OverscaledTileID): boolean;
    wrapped(): OverscaledTileID;
    unwrapTo(wrap: number): OverscaledTileID;
    overscaleFactor(): number;
    toUnwrapped(): UnwrappedTileID;
    toString(): string;
    getTilePoint(coord: MercatorCoordinate): any;
}
