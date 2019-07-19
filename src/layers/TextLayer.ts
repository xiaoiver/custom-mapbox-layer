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
import { generateSDF } from '../utils/glyph-manager';
import { shapeText, SymbolAnchor, TextJustify } from '../utils/symbol-layout';
import GlyphAtlas from '../symbol/GlyphAtlas';
import { StyleGlyph } from '../symbol/AlphaImage';
import { getGlyphQuads } from '../symbol/SymbolQuad';
import { getLabelPlaneMatrix, getGlCoordMatrix, pixelsToTileUnits, tileSize } from '../utils/symbol-projection';
import CollisionIndex from '../symbol/CollisionIndex';

interface IVectorTileLineLayerOptions {
  geoJSON: any;
}

interface IClusterFeature {
  position: [number, number];
  text: string;
}

// interface IClusterText {
//   text: string;
//   position: number[];
//   weight: number;
// }

const defaultFontStack = 'sans-serif';
// const compareClusterText = (t1: IClusterText, t2: IClusterText) => {
//   return t2.weight - t1.weight;
// }

export default class TextLayer extends MapboxAdapterLayer implements IVectorTileLineLayerOptions {
  id = 'text';
  renderingMode = '2d';

  drawCircles: _regl.DrawCommand;
  drawText: _regl.DrawCommand;
  drawDebugSDF: _regl.DrawCommand;

  // @ts-ignore
  public geoJSON = {};

  // style variables

  public textField = 'name';
  public fontSize = 14.;
  public fontColor = [0, 0, 0];
  public fontOpacity = 1.0;
  public haloColor = [255, 255, 255];
  public haloWidth = 1.0;
  public haloBlur = 0.2;

  public symbolAnchor: SymbolAnchor = 'center';
  public textJustify: TextJustify = 'center';
  public textSpacing: number = 2;
  public textOffsetX: number = 0;
  public textOffsetY: number = 0;

  public debug: boolean = false;

  private tileIndex: any;
  private posMatrixCache: { [key: string]: Float32Array } = {};
  private glyphAtlas: GlyphAtlas;
  private glyphMap: { [key: number]: StyleGlyph };
  private glyphAtlasTexture: any;

  private collisionIndex: CollisionIndex;

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

    this.initDrawTextCommand();
    this.initDrawDebugSDFCommand();
    this.initGlyphAtlas();
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

  /**
   * 创建 Atlas
   */
  initGlyphAtlas() {
    const glyphMap = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '.split('').map(char => {
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

  buildTextBuffers(textArray: IClusterFeature[], posMatrix: mat4) {
    const charPositionBuffer: number[][] = [];
    const charUVBuffer: [number, number][] = [];
    const charOffsetBuffer: [number, number][] = [];
    const indexBuffer: [number, number, number][] = [];

    const textOffset: [number, number] = [ this.textOffsetX, this.textOffsetY ];
    const textPixelRatio = tileSize / EXTENT;
    const fontScale = this.fontSize / 24;

    // 首先按权重从高到低排序
    // textArray.sort(compareClusterText);

    let i = 0;
    textArray.forEach(({ text, position }) => {
      // 锚点
      // const anchor = new Point(position[0], position[1]);
      // 计算布局
      const shaping = shapeText(text, this.glyphMap, defaultFontStack, 0, 24, this.symbolAnchor, this.textJustify, this.textSpacing, textOffset, 1);

      if (shaping) {
        // 加入索引
        const { box } = this.collisionIndex.placeCollisionBox({
          x1: shaping.left * fontScale,
          x2: shaping.right * fontScale,
          y1: shaping.top * fontScale,
          y2: shaping.bottom * fontScale,
          anchorPointX: position[0],
          anchorPointY: position[1],
        }, false, textPixelRatio, posMatrix);

        if (box && box.length) {
          this.collisionIndex.insertCollisionBox(box, 0, 0, 0);

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
        } else {
          // console.log('failed to pass hit test.', shaping);
        }
      }
    });

    return {
      indexBuffer,
      charPositionBuffer,
      charUVBuffer,
      charOffsetBuffer
    };
  }

  renderText(clusters: IClusterFeature[], posMatrix: Float32Array, overscaledZ: number) {
    const { width, height, data } = this.glyphAtlas.image;
    // @ts-ignore
    const s = pixelsToTileUnits(overscaledZ, 1, this.map.transform.zoom);
    // @ts-ignore
    const labelPlaneMatrix = getLabelPlaneMatrix(posMatrix, false, false, this.map.transform, s);
    // @ts-ignore
    const glCoordMatrix = getGlCoordMatrix(posMatrix, false, false, this.map.transform, s);

    // draw text
    const { indexBuffer: textIndexes, charOffsetBuffer, charPositionBuffer, charUVBuffer } = this.buildTextBuffers(clusters, posMatrix);
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
      'elements': textIndexes,
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

      // retrieve target tile
      const t = this.tileIndex.getTile(tile.canonical.z, tile.canonical.x, tile.canonical.y);
      if (t && t.features && t.features.length) {
        const points: IClusterFeature[] = [];
        t.features.forEach((feature: any) => {
          points.push({
            position: feature.geometry[0],
            text: feature.tags[this.textField],
          });
        });
        this.renderText(points, tile.posMatrix, tile.overscaledZ);
      }
    });
  }

  frame(gl: WebGLRenderingContext, m: Array<number>) {
    // 每次相机更新，需要重新创建碰撞索引
    // @ts-ignore
    this.collisionIndex = new CollisionIndex(this.map.transform);

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
