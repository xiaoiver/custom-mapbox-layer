/**
 * draw 2d lines
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
}
export default class LineLayer extends MapboxAdapterLayer implements ILineLayerOptions {
    id: string;
    drawPoints: _regl.DrawCommand;
    points: Array<{
        lng: number;
        lat: number;
    }>;
    lineThickness: number;
    dashOffset: number;
    dashArray: number;
    dashRatio: number;
    pointColor: number[];
    instance: boolean;
    constructor(options: Partial<ILineLayerOptions>);
    getReglInitializationOptions(): Partial<_regl.InitializationOptions>;
    init(map: mapboxgl.Map, gl: WebGLRenderingContext): void;
    frame(gl: WebGLRenderingContext, matrix: Array<number>): void;
}
export {};
