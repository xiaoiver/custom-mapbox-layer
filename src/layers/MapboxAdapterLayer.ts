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
    // @ts-ignore
    type = 'custom';
    regl: _regl.Regl;
    stats: Stats;
    map: mapboxgl.Map;

    protected abstract getReglInitializationOptions(): Partial<_regl.InitializationOptions>;
    protected abstract init(map: mapboxgl.Map, gl: WebGLRenderingContext): void;
    protected abstract frame(gl: WebGLRenderingContext, matrix: any): void;
    // protected abstract beforeRender(gl: WebGLRenderingContext, matrix: any): void;

    private initStats() {
        this.stats = new Stats();
        this.stats.showPanel(0);
        const $stats = this.stats.dom;
        $stats.style.position = 'absolute';
        $stats.style.left = '0px';
        $stats.style.top = '0px';
        document.body.appendChild($stats);
    }

    public triggerRepaint() {
        // @ts-ignore
        this.map.triggerRepaint();
    }

    onAdd(map: mapboxgl.Map, gl: WebGLRenderingContext) {
        this.map = map;
        // reuse the context
        this.regl = _regl({
            ...this.getReglInitializationOptions(),
            gl
        });
        this.init(map, gl);
        this.initStats();
    }

    /**
     * NOTE: mapbox won't call it every frame.
     * @see https://docs.mapbox.com/mapbox-gl-js/api/#map#triggerrepaint
     * 
     * @param gl 
     * @param matrix 
     */
    render(gl: WebGLRenderingContext, matrix: Array<number>) {
        if (!this.stats) {
            this.initStats();
        }
        if (this.stats) {
            this.stats.update();
        }
        this.frame(gl, matrix);
    }

    prerender(gl: WebGLRenderingContext, matrix: Array<number>) {
        // @ts-ignore
        if (this.beforeRender) {
            // @ts-ignore
            this.beforeRender(gl, matrix);
        }
    }
}