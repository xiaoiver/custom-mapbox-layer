import * as mapboxgl from 'mapbox-gl';
import * as _regl from 'regl';
import MapboxAdapterLayer from './MapboxAdapterLayer';
import { UnwrappedTileID } from '../source/tile_id';
interface IVectorTileLineLayerOptions {
    lineThickness: number;
    geoJSON: any;
}
export default class VectorTileLineLayer extends MapboxAdapterLayer implements IVectorTileLineLayerOptions {
    id: string;
    renderingMode: string;
    drawLines: _regl.DrawCommand;
    geoJSON: {};
    lineThickness: number;
    pointColor: number[];
    private tileIndex;
    private posMatrixCache;
    constructor(options: Partial<IVectorTileLineLayerOptions>);
    getReglInitializationOptions(): Partial<_regl.InitializationOptions>;
    init(map: mapboxgl.Map, gl: WebGLRenderingContext): void;
    renderTiles(): void;
    frame(gl: WebGLRenderingContext, m: Array<number>): void;
    calculatePosMatrix(unwrappedTileID: UnwrappedTileID, currentScale: number): Float32Array;
    cleanPosMatrixCache(): void;
}
export {};
