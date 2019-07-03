/**
 * draw 3d line
 */
import * as mapboxgl from 'mapbox-gl';
import * as _regl from 'regl';
import MapboxAdapterLayer from './MapboxAdapterLayer';
interface ILineLayerOptions {
    lineThickness: number;
    points: Array<{
        lat: number;
        lng: number;
    }>;
    antialias: boolean;
}
export default class Line3DLayer extends MapboxAdapterLayer implements ILineLayerOptions {
    id: string;
    drawPoints: _regl.DrawCommand;
    points: never[];
    lineThickness: number;
    pointColor: number[];
    instance: boolean;
    antialias: boolean;
    dashOffset: number;
    dashArray: number;
    dashRatio: number;
    constructor(options: Partial<ILineLayerOptions>);
    getReglInitializationOptions(): Partial<_regl.InitializationOptions>;
    init(map: mapboxgl.Map, gl: WebGLRenderingContext): void;
    frame(gl: WebGLRenderingContext, matrix: Array<number>): void;
}
export {};
