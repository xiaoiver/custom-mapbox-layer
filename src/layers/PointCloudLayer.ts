/**
 * draw points with instance
 * 「WebGL Programing Guide - Chapter 10 Advanced Techniques」
 * 
 * TODO: perf optimazation & lighting
 * 1. apply frustum & occlusion culling
 * 2. LOD
 * 3. lighting & anti-alias
 * @see https://www.desultoryquest.com/blog/drawing-anti-aliased-circular-points-using-opengl-slash-webgl/
 * 4. use LNGLAT_OFFSETS coordinate system to improve accuracy
 * @see https://medium.com/vis-gl/how-sometimes-assuming-the-earth-is-flat-helps-speed-up-rendering-in-deck-gl-c43b72fd6db4
 */
// @ts-ignore
import * as vec4 from 'gl-matrix/vec4';
import * as mapboxgl from 'mapbox-gl';
import * as _regl from 'regl';
import MapboxAdapterLayer from './MapboxAdapterLayer';
import { getModule } from '../utils/shader-module';
import { zoomToScale } from '../utils/web-mercator';

interface IPointCloudLayerOptions {
    isCircle: boolean;
    instance: boolean;
    pointSize: number;
    points: Array<{lat: number, lng: number}>;
}

interface IPointCloudLayerDrawOptions {
    'u_matrix': Array<number>;
    'u_point_size': number;
    'u_is_circle': boolean;
    'u_is_offset': boolean;
    'u_pixels_per_degree': Array<number>;
    'u_pixels_per_degree2': Array<number>;
    'u_pixels_per_meter': Array<number>;
    'u_viewport_center': Array<number>;
    'u_viewport_center_projection': Array<number>;
    'u_scale': number;
}

// const LNGLAT_AUTO_OFFSET_ZOOM_THRESHOLD = 12;

export default class PointCloudLayer extends MapboxAdapterLayer implements IPointCloudLayerOptions {
    id = 'pointcloud';
    renderingMode = '2d';

    drawPoints: _regl.DrawCommand;
    // drawPointsInOffsetCoords: _regl.DrawCommand;

    // @ts-ignore
    public points = [];
    public pointSize = 5.0;
    public pointColor = [13/255, 64/255, 140/255, 1];
    public instance = true;
    public isCircle = true;

    constructor(options: Partial<IPointCloudLayerOptions>) {
        super();
        Object.assign(this, options);
    }

    getReglInitializationOptions() {
        const reglOptions: Partial<_regl.InitializationOptions> = {};
        if (this.instance) {
            // https://blog.tojicode.com/2013/07/webgl-instancing-with.html
            reglOptions.extensions = [
                'ANGLE_instanced_arrays',
                'OES_standard_derivatives',
            ];
            // TODO: webgl2 support @see http://webglsamples.org/WebGL2Samples/#draw_instanced
        }
        return reglOptions;
    }

    init(map: mapboxgl.Map, gl: WebGLRenderingContext) {
        // convert mercator coords to world in CPU.
        // @ts-ignore
        this.points = this.points
        .map(p => {
            // @ts-ignore
            const {x, y} = mapboxgl.MercatorCoordinate.fromLngLat({
                // @ts-ignore
                lng: p.lng,
                // @ts-ignore
                lat: p.lat
            });

            return [x, y];
        });

        const { vs, fs } = getModule('point1');
        const reglDrawConfig: _regl.DrawConfig = {
            frag: fs,
            vert: vs,
            attributes: {
                'a_color': [this.pointColor],
                'a_pos': {
                    buffer: this.regl.buffer(
                        {
                            data: this.points,
                            type: 'float32'
                        }
                    ),
                    divisor: 1
                },
            },
            uniforms: {
                // @ts-ignore
                'u_matrix': this.regl.prop('u_matrix'),
                // @ts-ignore
                'u_point_size': this.regl.prop('u_point_size'),
                // @ts-ignore
                'u_is_circle': this.regl.prop('u_is_circle'),
                // @ts-ignore
                'u_is_offset': this.regl.prop('u_is_offset'),
                // @ts-ignore
                // 'u_color': this.regl.prop('u_color'),
                'u_pixels_per_degree': this.regl.prop('u_pixels_per_degree'),
                // @ts-ignore
                'u_pixels_per_degree2': this.regl.prop('u_pixels_per_degree2'),
                // @ts-ignore
                'u_pixels_per_meter': this.regl.prop('u_pixels_per_meter'),
                // @ts-ignore
                'u_viewport_center': this.regl.prop('u_viewport_center'),
                // @ts-ignore
                'u_viewport_center_projection': this.regl.prop('u_viewport_center_projection'),
                // @ts-ignore
                'u_scale': this.regl.prop('u_scale'),
            },
            primitive: 'points',
            depth: {
                enable: false
            },
            count: 1,
            instances: this.points.length,
            blend: {
                enable: true,
                func: {
                    srcRGB: 'src alpha',
                    srcAlpha: 1,
                    dstRGB: 'one minus src alpha',
                    dstAlpha: 1
                },
            },
        };

        this.drawPoints = this.regl(reglDrawConfig);
    }

    frame(gl: WebGLRenderingContext, m: Array<number>) {
        const currentZoomLevel = this.map.getZoom();
        const currentScale = zoomToScale(currentZoomLevel);

        let drawParams: Partial<IPointCloudLayerDrawOptions> = {
            'u_matrix': m,
            'u_point_size': this.pointSize,
            'u_is_circle': this.isCircle,
            'u_is_offset': false,
            'u_pixels_per_degree': [0, 0, 0],
            'u_scale': currentScale,
            'u_pixels_per_degree2': [0, 0, 0],
            'u_viewport_center': [0, 0],
            'u_pixels_per_meter': [0, 0, 0],
            'u_viewport_center_projection': [0, 0, 0, 0],
        };

        this.drawPoints(drawParams);
    }
}