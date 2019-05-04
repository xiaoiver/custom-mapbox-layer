/**
 * draw lineStrings with tiles
 * @see https://blog.mapbox.com/rendering-big-geodata-on-the-fly-with-geojson-vt-4e4d2a5dd1f2
 * @see https://zhuanlan.zhihu.com/p/64130041/
 */

import * as mapboxgl from 'mapbox-gl';
import * as _regl from 'regl';
import Worker from 'worker-loader!../worker/worker';
import MapboxAdapterLayer from './MapboxAdapterLayer';
import { getModule } from '../utils/shader-module';
import { TilesFromWorker } from '../worker/getTiles';

interface IVectorTileLineLayerOptions {
  lineThickness: number;
  url: string;
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
  public lineThickness = 2.0;
  public url = '';
  public pointColor = [13/255, 64/255, 140/255, 1];

  private worker: Worker;
  private cachedTiles: TilesFromWorker;

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

  // @ts-ignore
  handleWorkerMessage = ({ data }) => {
    const { command, params, status } = data;
    if (status === 'failure') {
      console.error(params);
      return;
    }
    switch (command) {
      case 'renderTiles': {
        this.cachedTiles = params;
        this.renderTiles();
        break;
      }
    }
  }

  init(map: mapboxgl.Map, gl: WebGLRenderingContext) {

    // create a webworker
    this.worker = new Worker();
    this.worker.addEventListener('message', this.handleWorkerMessage);
    this.worker.postMessage({
      command: 'loadData',
      params: {
        url: this.url,
        type: 'geojson',
        isCluster: false
      }
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
  }

  renderTiles() {
    if (!this.cachedTiles) {
      return;
    }
    const { tiles, stats } = this.cachedTiles;
    tiles.forEach(({ attributes, posMatrix }) => {
      if (attributes) {
        const { position, miter, normal, counters, indices } = attributes;
        let drawParams: Partial<IVectorTileLineLayerDrawOptions> = {
          'u_matrix': posMatrix,
          'u_thickness': this.lineThickness,
          'a_pos': this.regl.buffer(position),
          'a_line_miter': this.regl.buffer(miter),
          'a_line_normal': this.regl.buffer(normal),
          'a_counters': this.regl.buffer(counters),
          'indices': indices
        };
        this.drawLines(drawParams);
      }
    });

    console.table(stats);
  }

  frame(gl: WebGLRenderingContext, m: Array<number>) {
    const bounds = this.map.getBounds();
    this.worker.postMessage({
      command: 'getTiles',
      params: {
        zoom: this.map.getZoom(),
        bounds: [
          bounds.getSouthWest(),
          bounds.getNorthEast(),
          bounds.getNorthWest(),
          bounds.getSouthEast()
        ],
        // @ts-ignore
        projMatrix: this.map.transform.projMatrix
      }
    });

    // render with old tiles
    this.renderTiles();
  }
}