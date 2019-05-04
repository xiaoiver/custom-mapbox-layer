/**
 * draw lineStrings with tiles
 * @see https://blog.mapbox.com/rendering-big-geodata-on-the-fly-with-geojson-vt-4e4d2a5dd1f2
 * @see https://zhuanlan.zhihu.com/p/64130041/
 */
// @ts-ignore
import * as mat4 from 'gl-matrix/mat4';
import * as mapboxgl from 'mapbox-gl';
import * as _regl from 'regl';
// @ts-ignore
import geojsonvt from 'geojson-vt';
import MapboxAdapterLayer from './MapboxAdapterLayer';
import { getModule } from '../utils/shader-module';
import { zoomToScale, TILE_SIZE } from '../utils/web-mercator';
import tileCover from '../utils/tile-cover';
import getNormals from '../utils/polyline-normals';
import MercatorCoordinate from '../geo/mercator_coordinate';
import { UnwrappedTileID, EXTENT } from '../source/tile_id';

interface IVectorTileLineLayerOptions {
  lineThickness: number;
  geoJSON: any;
}

interface IVectorTileLineLayerDrawOptions {
  'u_matrix': Float32Array;
  'u_thickness': number;
  'a_pos': _regl.Buffer;
  'a_line_miter': _regl.Buffer;
  'a_line_normal': _regl.Buffer;
  'a_counters': _regl.Buffer;
  'indices': number[][];
}

export default class VectorTileLineLayer extends MapboxAdapterLayer implements IVectorTileLineLayerOptions {
  id = 'multiLine';
  renderingMode = '2d';

  drawLines: _regl.DrawCommand;

  // @ts-ignore
  public geoJSON = {};
  public lineThickness = 2.0;
  public pointColor = [13/255, 64/255, 140/255, 1];

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

    const { vs, fs } = getModule('line-vt');
    const reglDrawConfig: _regl.DrawConfig = {
      frag: fs,
      vert: vs,
      attributes: {
        'a_color': {
          constant: this.pointColor
        },
        // @ts-ignore
        'a_pos': this.regl.prop('a_pos'),
        // @ts-ignore
        'a_line_miter': this.regl.prop('a_line_miter'),
        // @ts-ignore
        'a_line_normal': this.regl.prop('a_line_normal'),
        // @ts-ignore
        'a_counters': this.regl.prop('a_counters'),
      },
      uniforms: {
        // @ts-ignore
        'u_matrix': this.regl.prop('u_matrix'),
        // @ts-ignore
        'u_thickness': this.regl.prop('u_thickness'),
        // @ts-ignore
        'u_dash_array': 0.02,
        // @ts-ignore
        'u_dash_offset': 0,
        // @ts-ignore
        'u_dash_ratio': 0,
      },
      primitive: 'triangles',
      // @ts-ignore
      elements: this.regl.prop('indices'),
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

    this.drawLines = this.regl(reglDrawConfig);

    // this.renderTilesThrottled = throttle(this.renderTiles, 500);
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

    const stats: Array<{
      tileID: number;
      pointsNum: number;
    }> = [];

    tiles.forEach(tile => {
      // for stats
      let simplifiedNum = 0;

      // calculate matrix in tile coords
      tile.posMatrix = this.calculatePosMatrix(tile.toUnwrapped(), currentScale);

      // retrieve target tile
      const t = this.tileIndex.getTile(tile.canonical.z, tile.canonical.x, tile.canonical.y);
      if (t && t.features && t.features.length) {
        const attrNormal: Array<Array<number>> = [];
        const attrMiter: Array<number> = [];
        let attrIndex: Array<Array<number>> = [];
        let attrPos: Array<Array<number>> = [];
        let attrCounters: Array<number> = [];
        let indexOffset = 0;

        // for stats
        simplifiedNum += t.numSimplified;

        t.features.forEach((feature: any) => {
          feature.geometry.forEach((points: number[][]) => {
            const { normals, attrIndex: aIndex, attrPos: aPos, attrCounters: aCounters } = getNormals(points, false, indexOffset);
            attrIndex = attrIndex.concat(aIndex);
            attrPos = attrPos.concat(aPos);
            attrCounters = attrCounters.concat(aCounters);
            indexOffset += aPos.length;

            normals.forEach((n: Array<Array<number>>) => {
              var norm = n[0];
              var miter = n[1];
              attrNormal.push([norm[0], norm[1]]);
              // @ts-ignore
              attrMiter.push(miter);
            });
          });
        });

        let drawParams: Partial<IVectorTileLineLayerDrawOptions> = {
          'u_matrix': tile.posMatrix,
          'u_thickness': this.lineThickness,
          'a_pos': this.regl.buffer(attrPos),
          'a_line_miter': this.regl.buffer(attrMiter),
          'a_line_normal': this.regl.buffer(attrNormal),
          'a_counters': this.regl.buffer(attrCounters),
          'indices': attrIndex
        };
        this.drawLines(drawParams);
      }

      stats.push({
        tileID: tile.key,
        pointsNum: simplifiedNum
      });
    });

    console.table(stats);
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