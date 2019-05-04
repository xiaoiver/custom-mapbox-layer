/**
 * draw cluster with tiles
 * @see https://blog.mapbox.com/a-dive-into-spatial-search-algorithms-ebd0c5e39d2a
 * @see https://zhuanlan.zhihu.com/p/64450167/
 */
// @ts-ignore
import * as mat4 from 'gl-matrix/mat4';
import * as mapboxgl from 'mapbox-gl';
import * as _regl from 'regl';
// @ts-ignore
import Supercluster from 'supercluster';
import MapboxAdapterLayer from './MapboxAdapterLayer';
import { getModule } from '../utils/shader-module';
import { zoomToScale, TILE_SIZE } from '../utils/web-mercator';
import tileCover from '../utils/tile-cover';
import MercatorCoordinate from '../geo/mercator_coordinate';
import { UnwrappedTileID, EXTENT } from '../source/tile_id';

interface IVectorTileLineLayerOptions {
  geoJSON: any;
}

interface IVectorTileClusterLayerDrawOptions {
  'u_matrix': Float32Array;
  'u_radius': number;
  'u_blur': number;
  'u_opacity': number;
  'u_extrude_scale': number;
  'u_stroke_width': number;
  'u_stroke_opacity': number;
  'a_pos': _regl.Attribute;
  'a_color': _regl.Attribute;
  'a_radius': _regl.Attribute;
  'a_extrude': [number, number][];
  'a_stroke_color': _regl.Attribute;
  'instances': number;
  'elements': [number, number, number][];
}

interface IClusterFeature {
  geometry: [number, number][];
  id: number;
  tags: {
    cluster: boolean;
    cluster_id: number;
    point_count: number;
    point_count_abbreviated: number;
  }
}

interface IPointFeature {
  geometry: [number, number][];
}

export default class VectorTileClusterLayer extends MapboxAdapterLayer implements IVectorTileLineLayerOptions {
  id = 'multiLine';
  renderingMode = '2d';

  drawCircles: _regl.DrawCommand;

  // @ts-ignore
  public geoJSON = {};

  // style variables
  public pointColor = [81, 187, 214];
  public strokeWidth = 2;
  public strokeColor = [255, 255, 255];

  private tileIndex: any;
  private posMatrixCache: { [key: string]: Float32Array } = {};

  constructor(options: Partial<IVectorTileLineLayerOptions>) {
    super();
    Object.assign(this, options);
  }

  getReglInitializationOptions() {
    const reglOptions: Partial<_regl.InitializationOptions> = {};
    // https://blog.tojicode.com/2013/07/webgl-instancing-with.html
    reglOptions.extensions = [
      'ANGLE_instanced_arrays'
    ];
    // TODO: webgl2 support @see http://webglsamples.org/WebGL2Samples/#draw_instanced
    return reglOptions;
  }

  init(map: mapboxgl.Map, gl: WebGLRenderingContext) {
    this.tileIndex = new Supercluster({
      maxZoom: 17,
      extent: EXTENT,
      radius: 50 * EXTENT / 512,
    });
    this.tileIndex.load(this.geoJSON);

    const { vs, fs } = getModule('circle');
    const reglDrawConfig: _regl.DrawConfig = {
      frag: fs,
      vert: vs,
      attributes: {
        // @ts-ignore
        'a_color': this.regl.prop('a_color'),
        // @ts-ignore
        'a_pos': this.regl.prop('a_pos'),
        // @ts-ignore
        'a_radius': this.regl.prop('a_radius'),
        // @ts-ignore
        'a_stroke_color': this.regl.prop('a_stroke_color'),
        'a_extrude': [
          [-1, -1], [1, -1], [1, 1], [-1, 1]
        ]
      },
      uniforms: {
        // @ts-ignore
        'u_matrix': this.regl.prop('u_matrix'),
        'u_blur': 0,
        'u_opacity': 1,
        // @ts-ignore
        'u_stroke_width': this.regl.prop('u_stroke_width'),
        'u_stroke_opacity': 1,
        // @ts-ignore
        'u_extrude_scale': this.map.transform.pixelsToGLUnits
      },
      primitive: 'triangles',
      elements: [
        [0, 1, 2],
        [0, 3, 2]
      ],
      // @ts-ignore
      instances: this.regl.prop('instances'),
      cull: {
        enable: false,
        face: 'back'
      }
    };

    this.drawCircles = this.regl(reglDrawConfig);
  }

  renderClusters(clusters: IClusterFeature[], posMatrix: Float32Array) {
    const positionBuffer: [number, number][] = [];
    const radiusBuffer: number[] = [];
    const colorBuffer: [number, number, number, number][] = [];
    clusters.forEach(cluster => {
      positionBuffer.push(cluster.geometry[0]);
      const pointCount = cluster.tags.point_count;
      if (pointCount > 30) {
        radiusBuffer.push(40);
        colorBuffer.push([242/255, 140/255, 177/255, 1]);
      } else if (pointCount > 10) {
        radiusBuffer.push(30);
        colorBuffer.push([241/255, 240/255, 117/255, 1]);
      } else {
        radiusBuffer.push(20);
        colorBuffer.push([81/255, 187/255, 214/255, 1]);
      }
    });
    let drawParams: Partial<IVectorTileClusterLayerDrawOptions> = {
      'u_matrix': posMatrix,
      'u_stroke_width': 0,
      'a_pos': {
        buffer: this.regl.buffer(positionBuffer),
        divisor: 1
      },
      'a_color': {
        buffer: this.regl.buffer(colorBuffer),
        divisor: 1
      },
      'a_stroke_color': {
        buffer: this.regl.buffer(colorBuffer),
        divisor: 1
      },
      'a_radius': {
        buffer: this.regl.buffer(radiusBuffer),
        divisor: 1
      },
      'instances': clusters.length
    };
    this.drawCircles(drawParams);
  }

  renderPoints(clusters: IPointFeature[], posMatrix: Float32Array) {
    const positionBuffer: [number, number][] = [];
    const radiusBuffer: number[] = [];
    clusters.forEach(cluster => {
      positionBuffer.push(cluster.geometry[0]);
      radiusBuffer.push(5);
    });
    let drawParams: Partial<IVectorTileClusterLayerDrawOptions> = {
      'u_matrix': posMatrix,
      'u_stroke_width': this.strokeWidth,
      'a_pos': {
        buffer: this.regl.buffer(positionBuffer),
        divisor: 1
      },
      'a_color': {
        buffer: this.regl.buffer(
          new Array(radiusBuffer.length).fill(undefined)
            .map(i => [...this.pointColor.map(c => c / 255), 1])
        ),
        divisor: 1
      },
      'a_stroke_color': {
        buffer: this.regl.buffer(
          new Array(radiusBuffer.length).fill(undefined)
            .map(i => [...this.strokeColor.map(c => c / 255), 1])
        ),
        divisor: 1
      },
      'a_radius': {
        buffer: this.regl.buffer(radiusBuffer),
        divisor: 1
      },
      'instances': clusters.length
    };
    this.drawCircles(drawParams);
  }

  renderTiles() {
    this.cleanPosMatrixCache();
    const currentZoomLevel = this.map.getZoom();
    const currentScale = zoomToScale(currentZoomLevel);
    const flooredZoom = Math.floor(currentZoomLevel);

    const bounds = this.map.getBounds();
    const tiles = tileCover(flooredZoom, [
      MercatorCoordinate.fromLngLat(bounds.getSouthWest()),
      MercatorCoordinate.fromLngLat(bounds.getNorthEast()),
      MercatorCoordinate.fromLngLat(bounds.getNorthWest()),
      MercatorCoordinate.fromLngLat(bounds.getSouthEast())
    ], flooredZoom, false);

    tiles.forEach(tile => {
      // calculate matrix in tile coords
      tile.posMatrix = this.calculatePosMatrix(tile.toUnwrapped(), currentScale);

      // retrieve target tile
      const t = this.tileIndex.getTile(tile.canonical.z, tile.canonical.x, tile.canonical.y);
      if (t && t.features && t.features.length) {
        const clusters = t.features.filter((f: IClusterFeature) => f.id);
        const singlePoints = t.features.filter((f: IClusterFeature) => !f.id);
        this.renderClusters(clusters, tile.posMatrix);
        this.renderPoints(singlePoints, tile.posMatrix);
      }
    });
  }

  frame(gl: WebGLRenderingContext, m: Array<number>) {
    this.renderTiles();
  }

  calculatePosMatrix(unwrappedTileID: UnwrappedTileID, currentScale: number): Float32Array {
    const posMatrixKey = unwrappedTileID.key;
    const cache = this.posMatrixCache;
    if (cache[posMatrixKey]) {
      return cache[posMatrixKey];
    }

    const canonical = unwrappedTileID.canonical;
    const scale = TILE_SIZE * currentScale / zoomToScale(canonical.z);
    const unwrappedX = canonical.x + Math.pow(2, canonical.z) * unwrappedTileID.wrap;

    const posMatrix = mat4.identity(new Float64Array(16));
    mat4.translate(posMatrix, posMatrix, [unwrappedX * scale, canonical.y * scale, 0]);
    mat4.scale(posMatrix, posMatrix, [scale / EXTENT, scale / EXTENT, 1]);
    // @ts-ignore
    mat4.multiply(posMatrix, this.map.transform.projMatrix, posMatrix);

    cache[posMatrixKey] = new Float32Array(posMatrix);
    return cache[posMatrixKey];
  }

  cleanPosMatrixCache() {
    this.posMatrixCache = {};
  }
}
