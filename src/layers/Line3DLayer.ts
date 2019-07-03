/**
 * draw 3d line
 */

// @ts-ignore
import * as mat4 from 'gl-matrix/mat4';
// @ts-ignore
import * as vec4 from 'gl-matrix/vec4';
import * as mapboxgl from 'mapbox-gl';
import * as _regl from 'regl';
import MapboxAdapterLayer from './MapboxAdapterLayer';
import { getDistanceScales, zoomToScale } from '../utils/web-mercator';
import WebMercatorViewport from 'viewport-mercator-project';
import { getModule } from '../utils/shader-module';

interface ILineLayerOptions {
    lineThickness: number;
    points: Array<{lat: number, lng: number}>;
    // lookupTableImage: any;
    antialias: boolean;
}

interface ILineLayerDrawOptions {
    'u_matrix': Array<number>;
    'u_thickness': number;
    'u_is_offset': boolean;
    'u_pixels_per_degree': Array<number>;
    'u_pixels_per_degree2': Array<number>;
    'u_pixels_per_meter': Array<number>;
    'u_viewport_center': Array<number>;
    'u_viewport_size': Array<number>;
    'u_project_scale': number;
    'u_viewport_center_projection': Array<number>;
    'u_lookup_table': any;
    'u_antialias': boolean;
    'u_dash_array': number;
    'u_dash_offset': number;
    'u_dash_ratio': number;
}

const LNGLAT_AUTO_OFFSET_ZOOM_THRESHOLD = 0;

export default class Line3DLayer extends MapboxAdapterLayer implements ILineLayerOptions {
    id = 'line';

    drawPoints: _regl.DrawCommand;

    // @ts-ignore
    public points = [];
    public lineThickness = 5.0;
    public pointColor = [13/255, 64/255, 140/255, 1];
    public instance = true;
    public antialias = false;
    public dashOffset = 0;
    public dashArray = 0.02;
    public dashRatio = 0;
     // @ts-ignore
    // public lookupTableImage;

    constructor(options: Partial<ILineLayerOptions>) {
        super();
        Object.assign(this, options);
    }

    getReglInitializationOptions() {
        const reglOptions: Partial<_regl.InitializationOptions> = {};
        if (this.instance) {
            // https://blog.tojicode.com/2013/07/webgl-instancing-with.html
            reglOptions.extensions = [
                'ANGLE_instanced_arrays'
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
                // @ts-ignore
                Math.fround(Number(cur.lng)),
                // @ts-ignore 
                Math.fround(Number(cur.lat)),
            ]);
            return prev;
        }, []);

        let index = 0;
        const indexArray: Array<Array<number>> = [];
        const attrPosition: Array<Array<number>> = [];
        const directionAttributes: Array<number> = [];
        const attrCounters: Array<number> = [];

        points.forEach((point: Array<number>, pointIndex: number, list: Array<Array<number>>) => {
            var i = index;

            if (pointIndex !== list.length - 1) {
                indexArray.push([i + 0, i + 1, i + 2]);
                indexArray.push([i + 2, i + 1, i + 3]);
            }

            attrPosition.push([point[0], point[1], 0]);
            attrPosition.push([point[0], point[1], 0]);

            directionAttributes.push(-1, 1);
            attrCounters.push(pointIndex / list.length, pointIndex / list.length);
            index += 2;
        });

        const prevPosAttributes = [
            attrPosition[0],
            attrPosition[1],
            ...attrPosition
        ].slice(0, -2);
        const nextPosAttributes = [
            ...attrPosition,
            attrPosition[attrPosition.length - 2],
            attrPosition[attrPosition.length - 1]
        ].slice(2);

        const { vs, fs } = getModule('line3d');

        const reglDrawConfig: _regl.DrawConfig = {
            frag: fs,
            vert: vs,
            attributes: {
                'a_color': {
                    constant: this.pointColor
                },
                'a_pos': {
                    buffer: this.regl.buffer(
                        {
                            data: attrPosition,
                        }
                    ),
                    // divisor: 1
                },
                'a_prev': {
                    buffer: this.regl.buffer(
                        {
                            data: prevPosAttributes,
                        }
                    ),
                },
                'a_next': {
                    buffer: this.regl.buffer(
                        {
                            data: nextPosAttributes,
                        }
                    ),
                },
                'a_orientation': {
                    buffer: this.regl.buffer(
                        {
                            data: directionAttributes,
                        }
                    ),
                },
                'a_counters': {
                    buffer: this.regl.buffer(
                        {
                            data: attrCounters,
                        }
                    ),
                }
            },
            uniforms: {
                // @ts-ignore
                'u_matrix': this.regl.prop('u_matrix'),
                // @ts-ignore
                'u_thickness': this.regl.prop('u_thickness'),
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
                'u_viewport_size': this.regl.prop('u_viewport_size'),
                // @ts-ignore
                'u_project_scale': this.regl.prop('u_project_scale'),
                // @ts-ignore
                'u_viewport_center_projection': this.regl.prop('u_viewport_center_projection'),
                // 'u_lookup_table': this.regl.texture(this.lookupTableImage),
                // @ts-ignore
                'u_antialias': this.regl.prop('u_antialias'),
                // @ts-ignore
                'u_dash_array': this.regl.prop('u_dash_array'),
                // @ts-ignore
                'u_dash_offset': this.regl.prop('u_dash_offset'),
                // @ts-ignore
                'u_dash_ratio': this.regl.prop('u_dash_ratio'),
            },
            primitive: 'triangles',
            elements: indexArray,
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
        const { width, height, viewProjectionMatrix, projectionMatrix, viewMatrix, viewMatrixUncentered } = viewport;
        const devicePixelRatio = window.devicePixelRatio;
        const viewportSize = [ width * devicePixelRatio, height * devicePixelRatio ];

        const { pixelsPerDegree, pixelsPerMeter } = getDistanceScales({
            longitude: center.lng,
            latitude: center.lat,
            zoom: currentZoomLevel,
            highPrecision: false
        });

        let drawParams: Partial<ILineLayerDrawOptions> = {
            // @ts-ignore
            'u_matrix': viewProjectionMatrix,
            'u_thickness': this.lineThickness,
            'u_is_offset': false,
            'u_pixels_per_degree': pixelsPerDegree && pixelsPerDegree.map(p => Math.fround(p)),
            'u_pixels_per_degree2': [0, 0, 0],
            'u_viewport_center': [0, 0],
            'u_viewport_size': viewportSize,
            'u_pixels_per_meter': pixelsPerMeter,
            'u_project_scale': zoomToScale(currentZoomLevel),
            'u_viewport_center_projection': [0, 0, 0, 0],
            'u_antialias': this.antialias,
            'u_dash_array': this.dashArray,
            'u_dash_offset': this.dashOffset,
            'u_dash_ratio': this.dashRatio,
            // 'u_color': this.pointColor,
        };

        if (currentZoomLevel > LNGLAT_AUTO_OFFSET_ZOOM_THRESHOLD) {
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
            let viewProjectionMatrix2 = mat4.multiply([], projectionMatrix, viewMatrix2);
            const VECTOR_TO_POINT_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];
            viewProjectionMatrix2 = mat4.multiply([], viewProjectionMatrix2, VECTOR_TO_POINT_MATRIX);

            drawParams['u_matrix'] = viewProjectionMatrix2;
            drawParams['u_is_offset'] = true;
            drawParams['u_pixels_per_meter'] = pixelsPerMeter;
            drawParams['u_viewport_center'] = [Math.fround(center.lng), Math.fround(center.lat)];
            // @ts-ignore
            drawParams['u_viewport_center_projection'] = projectionCenter;
            drawParams['u_pixels_per_degree'] = pixelsPerDegree && pixelsPerDegree.map(p => Math.fround(p));
            drawParams['u_pixels_per_degree2'] = pixelsPerDegree2 && pixelsPerDegree2.map(p => Math.fround(p));
        }

        this.drawPoints(drawParams);
    }
}