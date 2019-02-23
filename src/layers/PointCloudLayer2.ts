/**
 * draw points with instance
 * 「WebGL Programing Guide - Chapter 10 Advanced Techniques」
 * anti-alias
 * @see https://www.desultoryquest.com/blog/drawing-anti-aliased-circular-points-using-opengl-slash-webgl/
 * use LNGLAT_OFFSETS coordinate system to improve accuracy
 * @see https://medium.com/vis-gl/how-sometimes-assuming-the-earth-is-flat-helps-speed-up-rendering-in-deck-gl-c43b72fd6db4
 * 
 * TODO: perf optimazation & lighting
 * 1. apply frustum & occlusion culling
 * 2. LOD
 * 
 */

// @ts-ignore
import * as mat4 from 'gl-matrix/mat4';
// @ts-ignore
import * as vec4 from 'gl-matrix/vec4';
import * as mapboxgl from 'mapbox-gl';
import * as _regl from 'regl';
import MapboxAdapterLayer from './MapboxAdapterLayer';
// @ts-ignore
import pointVS from '../shaders/point-vs.glsl';
// @ts-ignore
import pointFS from '../shaders/point-fs.glsl';
import { getDistanceScales, zoomToScale } from '../utils/web-mercator';
import WebMercatorViewport from 'viewport-mercator-project';

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
    'u_project_scale': number;
    'u_viewport_center_world': Array<number>;
}

const LNGLAT_AUTO_OFFSET_ZOOM_THRESHOLD = 12;

export default class PointCloudLayer2 extends MapboxAdapterLayer implements IPointCloudLayerOptions {
    id = 'pointcloud';

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
        // convert mercator coords to world in shader, instead of doing this in CPU.
        let points = this.points
        .reduce((prev, cur) => {
            prev.push([
                Math.fround(Number(cur.lng)), 
                Math.fround(Number(cur.lat))
            ]);
            return prev;
        }, []);

        const reglDrawConfig: _regl.DrawConfig = {
            frag: pointFS,
            vert: pointVS,
            attributes: {
                'a_color': [this.pointColor],
                'a_pos': {
                    buffer: this.regl.buffer(
                        {
                            data: points,
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
                'u_project_scale': this.regl.prop('u_project_scale'),
                // @ts-ignore
                'u_viewport_center_world': this.regl.prop('u_viewport_center_world'),
            },
            primitive: 'points',
            // primitive: 'triangle fan',
            depth: {
                enable: false
            },
            count: 1,
            instances: points.length,
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

    frame(gl: WebGLRenderingContext, matrix: Array<number>) {
        const currentZoomLevel = this.map.getZoom();
        const bearing = this.map.getBearing();
        const pitch = this.map.getPitch();
        const center = this.map.getCenter();

        const viewport = new WebMercatorViewport({
            width: gl.drawingBufferWidth / 2,
            height: gl.drawingBufferHeight / 2,
            longitude: center.lng,
            latitude: center.lat,
            zoom: currentZoomLevel,
            pitch,
            bearing,
        });

        // @ts-ignore
        const { viewProjectionMatrix, projectionMatrix, viewMatrix, viewMatrixUncentered } = viewport;

        let drawParams: Partial<IPointCloudLayerDrawOptions> = {
            // @ts-ignore
            'u_matrix': viewProjectionMatrix,
            'u_point_size': this.pointSize,
            'u_is_circle': this.isCircle,
            'u_is_offset': false,
            'u_pixels_per_degree': [0, 0, 0],
            'u_pixels_per_degree2': [0, 0, 0],
            'u_viewport_center': [0, 0],
            'u_pixels_per_meter': [0, 0, 0],
            'u_project_scale': zoomToScale(currentZoomLevel),
            'u_viewport_center_world': [0, 0, 0, 0],
            // 'u_color': this.pointColor,
        };

        if (currentZoomLevel > LNGLAT_AUTO_OFFSET_ZOOM_THRESHOLD) {
            const newMatrix: Array<number> = [];

            const { pixelsPerDegree, pixelsPerDegree2, pixelsPerMeter } = getDistanceScales({
                longitude: center.lng,
                latitude: center.lat,
                zoom: currentZoomLevel,
                highPrecision: true
            });
            
            const positionPixels = viewport.projectFlat(
                [ Math.fround(center.lng), Math.fround(center.lat) ],
                Math.pow(2, currentZoomLevel)
            );

            const projectionCenter = vec4.transformMat4(
                [],
                [positionPixels[0], positionPixels[1], 0.0, 1.0],
                viewProjectionMatrix
            );

            // Always apply uncentered projection matrix if available (shader adds center)
            let viewMatrix2 = viewMatrixUncentered || viewMatrix;

            // Zero out 4th coordinate ("after" model matrix) - avoids further translations
            // viewMatrix = new Matrix4(viewMatrixUncentered || viewMatrix)
            //   .multiplyRight(VECTOR_TO_POINT_MATRIX);
            let viewProjectionMatrix2 = mat4.multiply([], projectionMatrix, viewMatrix2);
            const VECTOR_TO_POINT_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];
            viewProjectionMatrix2 = mat4.multiply([], viewProjectionMatrix, VECTOR_TO_POINT_MATRIX);

            drawParams['u_matrix'] = viewProjectionMatrix2;
            drawParams['u_is_offset'] = true;
            drawParams['u_viewport_center'] = [Math.fround(center.lng), Math.fround(center.lat)];
            // @ts-ignore
            drawParams['u_viewport_center_world'] = projectionCenter;
            drawParams['u_pixels_per_degree'] = pixelsPerDegree.map(p => Math.fround(p));
            drawParams['u_pixels_per_degree2'] = pixelsPerDegree2.map(p => Math.fround(p));
        }

        this.drawPoints(drawParams);
    }
}