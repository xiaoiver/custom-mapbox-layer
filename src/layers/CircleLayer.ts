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
import geojsonvt from 'geojson-vt';
// @ts-ignore
import * as Point from '@mapbox/point-geometry';
import MapboxAdapterLayer from './MapboxAdapterLayer';
import { getModule } from '../utils/shader-module';
import { zoomToScale, TILE_SIZE } from '../utils/web-mercator';
import tileCover from '../utils/tile-cover';
import MercatorCoordinate from '../geo/mercator_coordinate';
import { UnwrappedTileID, EXTENT } from '../source/tile_id';
import { packCircleVertex } from '../utils/vertex-compression';

interface IVectorTileLineLayerOptions {
  geoJSON: any;
}

interface IPointFeature {
  geometry: [number, number][];
}

export default class CircleLayer extends MapboxAdapterLayer implements IVectorTileLineLayerOptions {
  id = 'circle';
  renderingMode = '2d';

  drawCircles: _regl.DrawCommand;

  // @ts-ignore
  public geoJSON = {};
  private tileIndex: any;

  // style variables
  public pointShape = 'circle';
  public pointColor = [81, 187, 214];
  public pointRadius = 10;
  public pointOpacity = 1;
  public strokeWidth = 2;
  public strokeColor = [255, 255, 255];
  public strokeOpacity = 1;

  private posMatrixCache: { [key: string]: Float32Array } = {};

  constructor(options: Partial<IVectorTileLineLayerOptions>) {
    super();
    Object.assign(this, options);
  }

  getReglInitializationOptions() {
    const reglOptions: Partial<_regl.InitializationOptions> = {};
    // https://blog.tojicode.com/2013/07/webgl-instancing-with.html
    reglOptions.extensions = [
      'ANGLE_instanced_arrays',
      'OES_standard_derivatives'
    ];
    // TODO: webgl2 support @see http://webglsamples.org/WebGL2Samples/#draw_instanced
    return reglOptions;
  }

  init(map: mapboxgl.Map, gl: WebGLRenderingContext) {
    this.tileIndex = geojsonvt(this.geoJSON, {
      maxZoom: 24,
      tolerance: 30,
      extent: 8192
    });

    this.initDrawCircleCommand();
  }

  initDrawCircleCommand() {
    const { vs, fs } = getModule('circle');
    const reglDrawConfig: _regl.DrawConfig = {
      frag: fs,
      vert: vs,
      attributes: {
        // @ts-ignore
        'a_packed_data': this.regl.prop('a_packed_data'),
        // @ts-ignore
        'a_packed_data2': this.regl.prop('a_packed_data2'),
        // @ts-ignore
        'a_packed_data3': this.regl.prop('a_packed_data3'),
      },
      uniforms: {
        // @ts-ignore
        'u_matrix': this.regl.prop('u_matrix'),
        // @ts-ignore
        'u_extrude_scale': this.map.transform.pixelsToGLUnits,
      },
      primitive: 'triangles',
      // @ts-ignore
      elements: this.regl.prop('elements'),
      cull: {
        enable: false,
        face: 'back'
      }
    };

    this.drawCircles = this.regl(reglDrawConfig);
  }

  buildPointBuffers(clusters: IPointFeature[]) {
    const packedBuffer: number[][] = [];
    const packedBuffer2: number[][] = [];
    const packedBuffer3: number[][] = [];
    const indexBuffer: [number, number, number][] = [];

    let i = 0;    
    clusters.forEach((cluster, index) => {
      const [ tileX, tileY ] = cluster.geometry[0];

      // 压缩顶点数据
      const {
        packedBuffer: packed1,
        packedBuffer2: packed2,
        packedBuffer3: packed3
      } = packCircleVertex({
        color: [...this.pointColor, 255],
        radius: this.pointRadius,
        tileX, tileY,
        shape: this.pointShape,
        opacity: this.pointOpacity,
        strokeColor: [...this.strokeColor, 255],
        strokeOpacity: this.strokeOpacity,
        strokeWidth: this.strokeWidth,
      })
      packedBuffer.push(...packed1);
      packedBuffer2.push(...packed2);
      packedBuffer3.push(...packed3);

      // 构造 index
      indexBuffer.push([0 + i, 1 + i, 2 + i]);
      indexBuffer.push([2 + i, 3 + i, 0 + i]);
      i += 4;
    });

    return {
      packedBuffer,
      packedBuffer2,
      packedBuffer3,
      indexBuffer,
    }
  }

  renderPoints(clusters: IPointFeature[], posMatrix: Float32Array) {
    const { packedBuffer, packedBuffer2, packedBuffer3, indexBuffer } = this.buildPointBuffers(clusters);
    this.drawCircles({
      'u_matrix': posMatrix,
      'a_packed_data': {
        buffer: this.regl.buffer({
          usage: 'dynamic',
          data: packedBuffer
        }),
      },
      'a_packed_data2': {
        buffer: this.regl.buffer({
          usage: 'dynamic',
          data: packedBuffer2
        }),
      },
      'a_packed_data3': {
        buffer: this.regl.buffer({
          usage: 'dynamic',
          data: packedBuffer3
        }),
      },
      'elements': indexBuffer
    });
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

      // get target tile
      const t = this.tileIndex.getTile(tile.canonical.z, tile.canonical.x, tile.canonical.y);
      if (t && t.features && t.features.length) {
        const points: IPointFeature[] = []

        t.features.forEach((feature: any) => {
          points.push({
            geometry: feature.geometry
          });
        });
        this.renderPoints(points, tile.posMatrix);
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
