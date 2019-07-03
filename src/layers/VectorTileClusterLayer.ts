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
import { generateSDF } from '../utils/glyph-manager';
import { shapeText, SymbolAnchor, TextJustify } from '../utils/symbol-layout';
import GlyphAtlas from '../symbol/GlyphAtlas';
import { StyleGlyph } from '../symbol/AlphaImage';
import { getGlyphQuads } from '../symbol/SymbolQuad';
// @ts-ignore
import * as Point from '@mapbox/point-geometry';
import { getLabelPlaneMatrix, getGlCoordMatrix, pixelsToTileUnits } from '../utils/symbol-projection';

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

const defaultFontStack = 'sans-serif';

export default class VectorTileClusterLayer extends MapboxAdapterLayer implements IVectorTileLineLayerOptions {
  id = 'cluster';
  renderingMode = '2d';

  drawCircles: _regl.DrawCommand;
  drawText: _regl.DrawCommand;
  drawDebugSDF: _regl.DrawCommand;

  // @ts-ignore
  public geoJSON = {};

  // style variables
  public pointColor = [81, 187, 214];
  public strokeWidth = 2;
  public strokeColor = [255, 255, 255];

  public fontSize = 14.;
  public fontColor = [0, 0, 0];
  public fontOpacity = 1.0;
  public haloColor = [255, 255, 255];
  public haloWidth = 1.0;
  public haloBlur = 0.2;

  public symbolAnchor: SymbolAnchor = 'center';
  public textJustify: TextJustify = 'center';

  public debug: boolean = false;

  private tileIndex: any;
  private posMatrixCache: { [key: string]: Float32Array } = {};
  private glyphAtlas: GlyphAtlas;
  private glyphMap: { [key: number]: StyleGlyph };
  private glyphAtlasTexture: any;

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
    this.tileIndex = new Supercluster({
      maxZoom: 17,
      extent: EXTENT,
      radius: 50 * EXTENT / 512,
    });
    this.tileIndex.load(this.geoJSON);

    this.initDrawCircleCommand();
    this.initDrawTextCommand();
    this.initDrawDebugSDFCommand();
    this.initGlyphAtlas();
  }

  initDrawCircleCommand() {
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
        'u_extrude_scale': this.map.transform.pixelsToGLUnits,
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

  initDrawTextCommand() {
    const { vs, fs } = getModule('sdf');
    const reglDrawConfig: _regl.DrawConfig = {
      frag: fs,
      vert: vs,
      attributes: {
        // @ts-ignore
        'a_pos': this.regl.prop('a_pos'),
        // @ts-ignore
        'a_tex': this.regl.prop('a_tex'),
        // @ts-ignore
        'a_offset': this.regl.prop('a_offset'),
      },
      uniforms: {
        // @ts-ignore
        'u_matrix': this.regl.prop('u_matrix'),
        // @ts-ignore
        'u_label_matrix': this.regl.prop('u_label_matrix'),
        // @ts-ignore
        'u_gl_matrix': this.regl.prop('u_gl_matrix'),
        // @ts-ignore
        'u_sdf_map': this.regl.prop('u_sdf_map'),
        // @ts-ignore
        'u_gamma_scale': Math.cos(this.map.transform._pitch),
        // @ts-ignore
        'u_extrude_scale': this.map.transform.pixelsToGLUnits,
        // @ts-ignore
        'u_sdf_map_size': this.regl.prop('u_sdf_map_size'),
        'u_font_size': () => this.fontSize,
        'u_font_color': () => [...this.fontColor.map(c => c / 255), 1],
        'u_font_opacity': () => this.fontOpacity,
        'u_halo_width': () => this.haloWidth,
        'u_halo_blur': () => this.haloBlur,
        'u_halo_color': () => [...this.haloColor.map(c => c / 255), 1],
        'u_debug': () => this.debug,
      },
      primitive: 'triangles',
      // @ts-ignore
      elements: this.regl.prop('elements'),
    };

    this.drawText = this.regl(reglDrawConfig);
  }

  initDrawDebugSDFCommand() {
    const { vs, fs } = getModule('quad');
    const reglDrawConfig: _regl.DrawConfig = {
      frag: fs,
      vert: vs,
      attributes: {
        'a_extrude': [
          [-1, -1], [1, -1], [1, 1], [-1, 1]
        ]
      },
      uniforms: {
        // @ts-ignore
        'u_sdf_map': this.regl.prop('u_sdf_map'),
      },
      primitive: 'triangles',
      elements: [
        [0, 1, 2],
        [2, 3, 0]
      ],
    };

    this.drawDebugSDF = this.regl(reglDrawConfig);
  }

  initGlyphAtlas() {
    const glyphMap = '0123456789个总数'.split('').map(char => {
      return generateSDF('', char);
    }).reduce((prev, cur) => {
      // @ts-ignore
      prev[cur.id] = cur;
      return prev;
    }, {});

    if (!this.glyphMap) {
      this.glyphMap = {};
    }

    this.glyphMap[defaultFontStack] = glyphMap;
    
    this.glyphAtlas = new GlyphAtlas(this.glyphMap);

    this.glyphAtlasTexture = this.regl.texture();
  }

  renderClusters(clusters: IClusterFeature[], posMatrix: Float32Array, overscaledZ: number) {
    const positionBuffer: [number, number][] = [];
    const radiusBuffer: number[] = [];
    const colorBuffer: [number, number, number, number][] = [];
    const textArray: {
      text: string;
      position: number[];
    }[] = [];
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

      textArray.push({
        text: `${pointCount}个总数`,
        position: cluster.geometry[0]
      });
    });
    this.drawCircles({
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
    });

    // @ts-ignore
    const s = pixelsToTileUnits(overscaledZ, 1, this.map.transform.zoom);
    // @ts-ignore
    const labelPlaneMatrix = getLabelPlaneMatrix(posMatrix, false, false, this.map.transform, s);
    // @ts-ignore
    const glCoordMatrix = getGlCoordMatrix(posMatrix, false, false, this.map.transform, s);

    const charPositionBuffer: number[][] = [];
    const charUVBuffer: [number, number][] = [];
    const charOffsetBuffer: [number, number][] = [];
    const indexBuffer: [number, number, number][] = [];
    const { width, height, data } = this.glyphAtlas.image;

    const textOffset: [number, number] = [ 0, 0 ];
    let i = 0;
    textArray.forEach(({ text, position }) => {
      // 锚点
      // const anchor = new Point(position[0], position[1]);
      // 计算布局
      const shaping = shapeText(text, this.glyphMap, defaultFontStack, 0, 24, this.symbolAnchor, this.textJustify, 2, textOffset, 1);

      if (shaping) {
        // 计算每个独立字符相对于锚点的位置信息
        const glyphQuads = getGlyphQuads(shaping, textOffset,
          false, this.glyphAtlas.positions);
        
        
        glyphQuads.forEach(quad => {
          // TODO: vertex compression
          charPositionBuffer.push(position);
          charPositionBuffer.push(position);
          charPositionBuffer.push(position);
          charPositionBuffer.push(position);

          charUVBuffer.push([ quad.tex.x, quad.tex.y ]);
          charUVBuffer.push([ quad.tex.x + quad.tex.w, quad.tex.y ]);
          charUVBuffer.push([ quad.tex.x + quad.tex.w, quad.tex.y + quad.tex.h ]);
          charUVBuffer.push([ quad.tex.x, quad.tex.y + quad.tex.h ]);
       
          charOffsetBuffer.push([ quad.tl.x, quad.tl.y ]);
          charOffsetBuffer.push([ quad.tr.x, quad.tr.y ]);
          charOffsetBuffer.push([ quad.br.x, quad.br.y ]);
          charOffsetBuffer.push([ quad.bl.x, quad.bl.y ]);

          indexBuffer.push([0 + i, 1 + i, 2 + i]);
          indexBuffer.push([2 + i, 3 + i, 0 + i]);
          i += 4;
        });
      }
    });
    
    this.drawText({
      'u_matrix': posMatrix,
      'u_label_matrix': labelPlaneMatrix,
      'u_gl_matrix': glCoordMatrix,
      'a_pos': {
        buffer: this.regl.buffer(charPositionBuffer),
      },
      'a_tex': {
        buffer: this.regl.buffer(charUVBuffer),
      },
      'a_offset': {
        buffer: this.regl.buffer(charOffsetBuffer),
      },
      'u_sdf_map': this.glyphAtlasTexture({
        width,
        height,
        mag: 'linear',
        min: 'linear',
        format: 'alpha',
        data
      }),
      'u_sdf_map_size': [ width, height ],
      'elements': indexBuffer,
    });
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
        this.renderClusters(clusters, tile.posMatrix, tile.overscaledZ);
        this.renderPoints(singlePoints, tile.posMatrix);
      }
    });
  }

  frame(gl: WebGLRenderingContext, m: Array<number>) {
    this.renderTiles();

    if (this.debug) {
      // draw SDF for debug
      const { width, height, data } = this.glyphAtlas.image;
      this.drawDebugSDF({
        'u_sdf_map': this.glyphAtlasTexture({
          width,
          height,
          mag: 'linear',
          min: 'linear',
          format: 'alpha',
          flipY: true,
          data
        })
      });
    }
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
