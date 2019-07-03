/**
 * just a simple demo,
 * port from https://docs.mapbox.com/mapbox-gl-js/example/custom-style-layer/
 */
import * as mapboxgl from 'mapbox-gl';
import * as _regl from 'regl';
import MapboxAdapterLayer from './MapboxAdapterLayer';
export default class TriangleLayer extends MapboxAdapterLayer {
    id: string;
    drawTriangle: _regl.DrawCommand;
    getReglInitializationOptions(): {};
    init(map: mapboxgl.Map, gl: WebGLRenderingContext): void;
    frame(gl: WebGLRenderingContext, matrix: Array<number>): void;
}
