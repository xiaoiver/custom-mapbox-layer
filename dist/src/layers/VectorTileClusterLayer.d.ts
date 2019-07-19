/**
 * draw cluster with tiles
 * @see https://blog.mapbox.com/a-dive-into-spatial-search-algorithms-ebd0c5e39d2a
 * @see https://zhuanlan.zhihu.com/p/64450167/
 */
import * as mat4 from 'gl-matrix/mat4';
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
interface IClusterText {
    text: string;
    position: number[];
    weight: number;
}
export default class VectorTileClusterLayer extends MapboxAdapterLayer implements IVectorTileLineLayerOptions {
    id: string;
    renderingMode: string;
    drawCircles: _regl.DrawCommand;
    drawText: _regl.DrawCommand;
    drawDebugSDF: _regl.DrawCommand;
    geoJSON: {};
    pointColor: number[];
    pointRadius: number;
    pointOpacity: number;
    strokeWidth: number;
    strokeColor: number[];
    strokeOpacity: number;
    fontSize: number;
    fontColor: number[];
    fontOpacity: number;
    haloColor: number[];
    haloWidth: number;
    haloBlur: number;
    symbolAnchor: SymbolAnchor;
    textJustify: TextJustify;
    textSpacing: number;
    textOffsetX: number;
    textOffsetY: number;
    debug: boolean;
    private tileIndex;
    private posMatrixCache;
    private glyphAtlas;
    private glyphMap;
    private glyphAtlasTexture;
    private collisionIndex;
    constructor(options: Partial<IVectorTileLineLayerOptions>);
    getReglInitializationOptions(): Partial<_regl.InitializationOptions>;
    init(map: mapboxgl.Map, gl: WebGLRenderingContext): void;
    initDrawCircleCommand(): void;
    initDrawTextCommand(): void;
    initDrawDebugSDFCommand(): void;
    /**
     * 创建 Atlas
     */
    initGlyphAtlas(): void;
    /**
     * 构建 Cluster 所需顶点数据
     * @param clusters
     */
    buildClusterBuffers(clusters: IClusterFeature[]): {
        packedBuffer: number[][];
        packedBuffer2: number[][];
        packedBuffer3: number[][];
        indexBuffer: [number, number, number][];
        textArray: IClusterText[];
    };
    buildPointBuffers(clusters: IPointFeature[]): {
        packedBuffer: number[][];
        packedBuffer2: number[][];
        packedBuffer3: number[][];
        indexBuffer: [number, number, number][];
    };
    buildTextBuffers(textArray: {
        text: string;
        position: number[];
    }[], posMatrix: mat4): {
        indexBuffer: [number, number, number][];
        charPositionBuffer: number[][];
        charUVBuffer: [number, number][];
        charOffsetBuffer: [number, number][];
    };
    renderClusters(clusters: IClusterFeature[], posMatrix: Float32Array, overscaledZ: number): void;
    renderPoints(clusters: IPointFeature[], posMatrix: Float32Array): void;
    renderTiles(): void;
    frame(gl: WebGLRenderingContext, m: Array<number>): void;
    calculatePosMatrix(unwrappedTileID: UnwrappedTileID, currentScale: number): Float32Array;
    cleanPosMatrixCache(): void;
}
export {};
