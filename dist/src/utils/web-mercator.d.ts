/**
 * borrow from
 * https://github.com/uber-common/viewport-mercator-project/blob/master/src/web-mercator-utils.js
 */
export declare const TILE_SIZE = 512;
export declare function zoomToScale(zoom: number): number;
interface DistanceScalesOptions {
    latitude: number;
    longitude: number;
    zoom: number;
    scale: number;
    highPrecision: boolean;
}
interface DistanceScales {
    pixelsPerMeter: number[];
    metersPerPixel: number[];
    pixelsPerDegree: number[];
    degreesPerPixel: number[];
    pixelsPerDegree2: number[];
    pixelsPerMeter2: number[];
}
export declare function lngLatToWorld([lng, lat]: [any, any], scale: number): number[];
/**
 * Calculate distance scales in meters around current lat/lon, both for
 * degrees and pixels.
 * In mercator projection mode, the distance scales vary significantly
 * with latitude.
 */
export declare function getDistanceScales(options: Partial<DistanceScalesOptions>): Partial<DistanceScales>;
export {};
