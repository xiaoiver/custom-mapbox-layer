/**
 * draw points with instance
 * 「WebGL Programing Guide - Chapter 10 Advanced Techniques」
 * anti-alias
 * @see https://www.desultoryquest.com/blog/drawing-anti-aliased-circular-points-using-opengl-slash-webgl/
 * use LNGLAT_OFFSETS coordinate system to improve accuracy
 * @see https://medium.com/vis-gl/how-sometimes-assuming-the-earth-is-flat-helps-speed-up-rendering-in-deck-gl-c43b72fd6db4
 *
 * TODO: perf optimazation & lighting
 * 1. apply frustum & occlusion culling
 * 2. LOD
 */
import * as mapboxgl from 'mapbox-gl';
import * as _regl from 'regl';
import MapboxAdapterLayer from './MapboxAdapterLayer';
interface IPointCloudLayerOptions {
    isCircle: boolean;
    instance: boolean;
    pointSize: number;
    points: Array<{
        lat: number;
        lng: number;
    }>;
}
export default class PointCloudLayer2 extends MapboxAdapterLayer implements IPointCloudLayerOptions {
    id: string;
    drawPoints: _regl.DrawCommand;
    points: never[];
    pointSize: number;
    pointColor: number[];
    instance: boolean;
    isCircle: boolean;
    constructor(options: Partial<IPointCloudLayerOptions>);
    getReglInitializationOptions(): Partial<_regl.InitializationOptions>;
    init(map: mapboxgl.Map, gl: WebGLRenderingContext): void;
    frame(gl: WebGLRenderingContext, matrix: Array<number>): void;
}
export {};
