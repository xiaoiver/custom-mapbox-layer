/**
 * draw points with instance
 * 
 * TODO: perf optimazation & lighting
 * 1. apply frustum & occlusion culling
 * 2. LOD
 * 3. lighting & anti-alias
 * @see https://www.desultoryquest.com/blog/drawing-anti-aliased-circular-points-using-opengl-slash-webgl/
 * 4. use LNGLAT_OFFSETS coordinate system to improve accuracy
 * @see https://medium.com/vis-gl/how-sometimes-assuming-the-earth-is-flat-helps-speed-up-rendering-in-deck-gl-c43b72fd6db4
 */
import * as mapboxgl from 'mapbox-gl';
import * as _regl from 'regl';
import MapboxAdapterLayer from './MapboxAdapterLayer';
// @ts-ignore
import pointVS from '../shaders/point-vs.glsl';
// @ts-ignore
import pointFS from '../shaders/point-fs.glsl';

interface IPointCloudLayerOptions {
    isCircle: boolean;
    instance: boolean;
    pointSize: number;
    points: Array<{lat: number, lng: number}>;
}

export default class PointCloudLayer extends MapboxAdapterLayer implements IPointCloudLayerOptions {
    id = 'pointcloud';
    drawPoints: _regl.DrawCommand;
    // @ts-ignore
    public points = [];
    public pointSize = 2.0;
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
        // convert mercator coords to world
        // @ts-ignore
        const points = this.points.map(p => mapboxgl.MercatorCoordinate.fromLngLat({
            lng: p.lng,
            lat: p.lat
        }))
        .reduce((prev, cur) => {
            prev.push([cur.x, cur.y]);
            return prev;
        }, []);

        const reglDrawConfig: _regl.DrawConfig = {
            frag: pointFS,
            vert: pointVS,
            attributes: {
                'a_color': [this.pointColor],
                // 'a_point_size': [this.pointSize],
                'a_pos': {
                    buffer: this.regl.buffer(points),
                    divisor: 1
                }
            },
            uniforms: {
                // @ts-ignore
                'u_matrix': this.regl.prop('u_matrix'),
                // @ts-ignore
                'u_point_size': this.regl.prop('u_point_size'),
                // @ts-ignore
                'u_is_circle': this.regl.prop('u_is_circle'),
                // @ts-ignore
                // 'u_color': this.regl.prop('u_color'),
            },
            primitive: 'points',
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
        this.drawPoints({
            'u_matrix': matrix,
            'u_point_size': this.pointSize,
            'u_is_circle': this.isCircle,
            // 'u_color': this.pointColor,
        });
    }
}