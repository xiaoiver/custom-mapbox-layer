/**
 * just a simple demo,
 * port from https://docs.mapbox.com/mapbox-gl-js/example/custom-style-layer/
 */
import * as mapboxgl from 'mapbox-gl';
import * as _regl from 'regl';
import MapboxAdapterLayer from './MapboxAdapterLayer';

export default class TriangleLayer extends MapboxAdapterLayer {
    id = 'triangle';
    drawTriangle: _regl.DrawCommand;

    getReglInitializationOptions() {
        return {};
    }

    init(map: mapboxgl.Map, gl: WebGLRenderingContext) {

        // @ts-ignore
        var helsinki = mapboxgl.MercatorCoordinate.fromLngLat({ lng: 25.004, lat: 60.239 });
        // @ts-ignore
        var berlin = mapboxgl.MercatorCoordinate.fromLngLat({ lng: 13.403, lat: 52.562 });
        // @ts-ignore
        var kyiv = mapboxgl.MercatorCoordinate.fromLngLat({ lng: 30.498, lat: 50.541 });

        this.drawTriangle = this.regl({
            frag: `
                void main() {
                    gl_FragColor = vec4(1.0, 0.0, 0.0, 0.5);
                }
            `,
            vert: `
                uniform mat4 u_matrix;
                attribute vec2 a_pos;
                void main() {
                    gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
                }
            `,
            attributes: {
                'a_pos': {
                    buffer: this.regl.buffer([
                        helsinki.x, helsinki.y,
                        berlin.x, berlin.y,
                        kyiv.x, kyiv.y,
                    ]),
                    offset: 0,
                    stride: 0,
                    normalized: false,
                }
            },
            uniforms: {
                // @ts-ignore
                'u_matrix': this.regl.prop('u_matrix')
            },
            primitive: 'triangle strip',
            offset: 0,
            count: 3,
            blend: {
                enable: true,
                func: {
                    srcRGB: 'src alpha',
                    srcAlpha: 1,
                    dstRGB: 'one minus src alpha',
                    dstAlpha: 1
                },
            },
        });
    }

    frame(gl: WebGLRenderingContext, matrix: Array<number>) {
        this.drawTriangle({
            'u_matrix': matrix
        });
    }
}