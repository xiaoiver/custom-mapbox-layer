/**
 * An adapter for custom layer in mapbox.
 * @see https://docs.mapbox.com/mapbox-gl-js/api/#customlayerinterface
 *
 * reuse the context with regl
 * @see https://github.com/regl-project/regl/blob/gh-pages/API.md#from-a-webgl-context
 */
import * as mapboxgl from 'mapbox-gl';
import * as _regl from 'regl';
import * as Stats from 'stats.js';
export default abstract class MapboxAdapterLayer implements mapboxgl.Layer {
    protected id: string;
    type: string;
    regl: _regl.Regl;
    stats: Stats;
    map: mapboxgl.Map;
    protected abstract getReglInitializationOptions(): Partial<_regl.InitializationOptions>;
    protected abstract init(map: mapboxgl.Map, gl: WebGLRenderingContext): void;
    protected abstract frame(gl: WebGLRenderingContext, matrix: any): void;
    private initStats;
    triggerRepaint(): void;
    onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext): void;
    /**
     * NOTE: mapbox won't call it every frame.
     * @see https://docs.mapbox.com/mapbox-gl-js/api/#map#triggerrepaint
     *
     * @param gl
     * @param matrix
     */
    render(gl: WebGLRenderingContext, matrix: Array<number>): void;
    prerender(gl: WebGLRenderingContext, matrix: Array<number>): void;
}
