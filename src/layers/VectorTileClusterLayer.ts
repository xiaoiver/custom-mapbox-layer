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
import { getLabelPlaneMatrix, getGlCoordMatrix, pixelsToTileUnits } from '../utils/symbol-projection';
import { packCircleVertex } from '../utils/vertex-compression';
import { sdf2DFunctions } from '../utils/sdf-2d';

interface IVectorTileLineLayerOptions {
  geoJSON: any;
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
  public pointRadius = 10;
  public pointOpacity = 1;
  public strokeWidth = 2;
  public strokeColor = [255, 255, 255];
  public strokeOpacity = 1;

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
    const glyphMap = '0123456789包含个点'.split('').map(char => {
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

  /**
   * 构建 Cluster 所需顶点数据
   * @param clusters
   */
  buildClusterBuffers(clusters: IClusterFeature[]) {
    const packedBuffer: number[][] = [];
    const packedBuffer2: number[][] = [];
    const packedBuffer3: number[][] = [];
    const textArray: {
      text: string;
      position: number[];
    }[] = [];
    const indexBuffer: [number, number, number][] = [];

    let i = 0;
    clusters.forEach(cluster => {
      const [ tileX, tileY ] = cluster.geometry[0];
      const pointCount = cluster.tags.point_count;

      // 映射聚合点数目到 cluster 半径和颜色
      let radius: number;
      let color: [number, number, number, number];
      if (pointCount > 30) {
        radius = 40;
        color = [242, 140, 177, 255];
      } else if (pointCount > 10) {
        radius = 30;
        color = [241, 240, 117, 255];
      } else {
        radius = 20;
        color = [81, 187, 214, 255];
      }

      // 压缩顶点数据
      const {
        packedBuffer: packed1,
        packedBuffer2: packed2,
        packedBuffer3: packed3
      } = packCircleVertex({
        color, radius, tileX, tileY,
        shape: 'circle',
        opacity: 1,
        strokeColor: [255, 255, 255, 255],
        strokeOpacity: 0,
        strokeWidth: 0,
      })
      packedBuffer.push(...packed1);
      packedBuffer2.push(...packed2);
      packedBuffer3.push(...packed3);

      // 构造 index
      indexBuffer.push([0 + i, 1 + i, 2 + i]);
      indexBuffer.push([2 + i, 3 + i, 0 + i]);
      i += 4;

      // 为每个 cluster 构造字符数据
      textArray.push({
        text: `包含${pointCount}个点`,
        position: cluster.geometry[0]
      });
    });

    return {
      packedBuffer,
      packedBuffer2,
      packedBuffer3,
      indexBuffer,
      textArray,
    }
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
        shape: sdf2DFunctions[index % sdf2DFunctions.length],
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

  buildTextBuffers(textArray: {text: string; position: number[]}[]) {
    const charPositionBuffer: number[][] = [];
    const charUVBuffer: [number, number][] = [];
    const charOffsetBuffer: [number, number][] = [];
    const indexBuffer: [number, number, number][] = [];

    const textOffset: [number, number] = [ this.textOffsetX, this.textOffsetY ];
    let i = 0;
    textArray.forEach(({ text, position }) => {
      // 锚点
      // const anchor = new Point(position[0], position[1]);
      // 计算布局
      const shaping = shapeText(text, this.glyphMap, defaultFontStack, 0, 24, this.symbolAnchor, this.textJustify, this.textSpacing, textOffset, 1);

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

    return {
      indexBuffer,
      charPositionBuffer,
      charUVBuffer,
      charOffsetBuffer
    };
  }

  renderClusters(clusters: IClusterFeature[], posMatrix: Float32Array, overscaledZ: number) {
    const { width, height, data } = this.glyphAtlas.image;
    // @ts-ignore
    const s = pixelsToTileUnits(overscaledZ, 1, this.map.transform.zoom);
    // @ts-ignore
    const labelPlaneMatrix = getLabelPlaneMatrix(posMatrix, false, false, this.map.transform, s);
    // @ts-ignore
    const glCoordMatrix = getGlCoordMatrix(posMatrix, false, false, this.map.transform, s);

    // draw clusters
    const { packedBuffer, packedBuffer2, packedBuffer3, indexBuffer: circleIndexes, textArray } = this.buildClusterBuffers(clusters);
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
      'elements': circleIndexes
    });

    // draw text
    const { indexBuffer: textIndexes, charOffsetBuffer, charPositionBuffer, charUVBuffer } = this.buildTextBuffers(textArray);
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
