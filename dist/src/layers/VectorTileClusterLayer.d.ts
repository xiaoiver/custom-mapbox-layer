import * as mapboxgl from 'mapbox-gl';
import * as _regl from 'regl';
import MapboxAdapterLayer from './MapboxAdapterLayer';
import { UnwrappedTileID } from '../source/tile_id';
import { SymbolAnchor, TextJustify } from '../utils/symbol-layout';
interface IVectorTileLineLayerOptions {
    geoJSON: any;
}
interface IClusterFeature {
    geometry: [number, number][];
    id: number;
    tags: {
        cluster: boolean;
        cluster_id: number;
        point_count: number;
        point_count_abbreviated: number;
    };
}
interface IPointFeature {
    geometry: [number, number][];
}
export default class VectorTileClusterLayer extends MapboxAdapterLayer implements IVectorTileLineLayerOptions {
    id: string;
    renderingMode: string;
    drawCircles: _regl.DrawCommand;
    drawText: _regl.DrawCommand;
    drawDebugSDF: _regl.DrawCommand;
    geoJSON: {};
    pointColor: number[];
    strokeWidth: number;
    strokeColor: number[];
    fontSize: number;
    fontColor: number[];
    fontOpacity: number;
    haloColor: number[];
    haloWidth: number;
    haloBlur: number;
    symbolAnchor: SymbolAnchor;
    textJustify: TextJustify;
    debug: boolean;
    private tileIndex;
    private posMatrixCache;
    private glyphAtlas;
    private glyphMap;
    private glyphAtlasTexture;
    constructor(options: Partial<IVectorTileLineLayerOptions>);
    getReglInitializationOptions(): Partial<_regl.InitializationOptions>;
    init(map: mapboxgl.Map, gl: WebGLRenderingContext): void;
    initDrawCircleCommand(): void;
    initDrawTextCommand(): void;
    initDrawDebugSDFCommand(): void;
    initGlyphAtlas(): void;
    renderClusters(clusters: IClusterFeature[], posMatrix: Float32Array, overscaledZ: number): void;
    renderPoints(clusters: IPointFeature[], posMatrix: Float32Array): void;
    renderTiles(): void;
    frame(gl: WebGLRenderingContext, m: Array<number>): void;
    calculatePosMatrix(unwrappedTileID: UnwrappedTileID, currentScale: number): Float32Array;
    cleanPosMatrixCache(): void;
}
export {};
