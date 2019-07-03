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
export default class PointCloudLayer3 extends MapboxAdapterLayer implements IPointCloudLayerOptions {
    id: string;
    renderingMode: string;
    drawPoints: _regl.DrawCommand;
    points: never[];
    pointSize: number;
    pointColor: number[];
    instance: boolean;
    isCircle: boolean;
    constructor(options: Partial<IPointCloudLayerOptions>);
    getReglInitializationOptions(): Partial<_regl.InitializationOptions>;
    init(map: mapboxgl.Map, gl: WebGLRenderingContext): void;
    frame(gl: WebGLRenderingContext, m: Array<number>): void;
}
export {};
