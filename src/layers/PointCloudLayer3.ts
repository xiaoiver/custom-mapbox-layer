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
// @ts-ignore
import pointVS from '../shaders/point-vs-extrude.glsl';
// @ts-ignore
import pointFS from '../shaders/point-fs-extrude.glsl';
import { getDistanceScales, zoomToScale, lngLatToWorld } from '../utils/web-mercator';

interface IPointCloudLayerOptions {
    isCircle: boolean;
    instance: boolean;
    pointSize: number;
    points: Array<{lat: number, lng: number}>;
}

interface IPointCloudLayerDrawOptions {
    'u_matrix': Array<number>;
    // 'u_point_size': number;
    'u_extrude_scale': Array<number>;
}

const LNGLAT_AUTO_OFFSET_ZOOM_THRESHOLD = 12;

export default class PointCloudLayer3 extends MapboxAdapterLayer implements IPointCloudLayerOptions {
    id = 'pointcloud';
    renderingMode = '2d';

    drawPoints: _regl.DrawCommand;
    // drawPointsInOffsetCoords: _regl.DrawCommand;

    // @ts-ignore
    public points = [];
    public pointSize = 50;
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
            reglOptions.extensions = ['ANGLE_instanced_arrays'];
            // TODO: webgl2 support @see http://webglsamples.org/WebGL2Samples/#draw_instanced
        }
        return reglOptions;
    }

    init(map: mapboxgl.Map, gl: WebGLRenderingContext) {
        // convert mercator coords to world in CPU.
        this.points = this.points
        .slice(0, 4)
        .map(p => {
            // @ts-ignore
            const {x, y} = mapboxgl.MercatorCoordinate.fromLngLat({
                lng: p.lng,
                lat: p.lat
            });

            return [x, y];
        });

        const N = this.points.length;

        let unit: Array<Array<number>> = [];
        for (let i = 0; i < N; i++) {
            unit = [...unit,
                [-1, -1],
                [1, -1],
                [1, 1],
                [-1, 1]
            ];
        }
        let points: Array<Array<number>> = [];
        for (let i = 0; i < N; i++) {
            points = [...points,
                this.points[i],
                this.points[i],
                this.points[i],
                this.points[i],
            ];
        };
        let colors: Array<Array<number>> = [];
        for (let i = 0; i < N; i++) {
            colors = [...colors,
                this.pointColor,
                this.pointColor,
                this.pointColor,
                this.pointColor,
            ];
        };

        const reglDrawConfig: _regl.DrawConfig = {
            frag: pointFS,
            vert: pointVS,
            attributes: {
                'a_color': colors,
                'a_unit': unit,
                'a_pos': points
            },
            uniforms: {
                // @ts-ignore
                'u_matrix': this.regl.prop('u_matrix'),
                // @ts-ignore
                // 'u_point_size': this.regl.prop('u_point_size'),
                'u_extrude_scale': this.regl.prop('u_extrude_scale'),
            },
            primitive: 'triangle fan',
            depth: {
                enable: false
            },
            count: 4,
            instances: N,
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

        console.log('currentZoomLevel: ', currentZoomLevel);
        const currentScale = zoomToScale(currentZoomLevel);
        const pixelsToGLUnits = [2 / gl.drawingBufferWidth, -2 / gl.drawingBufferHeight];

        let drawParams: Partial<IPointCloudLayerDrawOptions> = {
            'u_matrix': m,
            // 'u_point_size': this.pointSize,
            'u_extrude_scale': pixelsToGLUnits,
        };

        this.drawPoints(drawParams);
    }
}