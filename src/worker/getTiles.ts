// @ts-ignore
import * as mat4 from 'gl-matrix/mat4';
import tileCover from '../utils/tile-cover';
import { zoomToScale, TILE_SIZE } from '../utils/web-mercator';
import { UnwrappedTileID, EXTENT } from '../source/tile_id';
// import getNormals from '../utils/polyline-normals';
import MercatorCoordinate from '../geo/mercator_coordinate';
// @ts-ignore
import * as Point from '@mapbox/point-geometry';

import { DrawableTile, GetTilesMessage, TilesFromWorker, LayerType } from '../d.ts';
import calcTextFeatures from './feature/text';

let posMatrixCache: { [key: string]: Float32Array } = {};

function calculatePosMatrix(unwrappedTileID: UnwrappedTileID, currentScale: number, projMatrix: Float32Array): Float32Array {
  const posMatrixKey = unwrappedTileID.key;
  const cache = posMatrixCache;
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
  mat4.multiply(posMatrix, projMatrix, posMatrix);

  cache[posMatrixKey] = new Float32Array(posMatrix);
  return cache[posMatrixKey];
}

function cleanPosMatrixCache() {
  posMatrixCache = {};
}

export default function getTiles(tileIndex: any, { layer, textField, zoom, bounds, projMatrix }: GetTilesMessage): TilesFromWorker {
  cleanPosMatrixCache();
  const currentScale = zoomToScale(zoom);
  const flooredZoom = Math.floor(zoom);

  const tiles = <DrawableTile[]>tileCover(flooredZoom, [
    MercatorCoordinate.fromLngLat(bounds[0]),
    MercatorCoordinate.fromLngLat(bounds[1]),
    MercatorCoordinate.fromLngLat(bounds[2]),
    MercatorCoordinate.fromLngLat(bounds[3])
  ], flooredZoom, false);

  tiles.forEach(tile => {
    // calculate matrix in tile coords
    tile.posMatrix = calculatePosMatrix(tile.toUnwrapped(), currentScale, projMatrix);

    // retrieve target tile
    const t = tileIndex.getTile(tile.canonical.z, tile.canonical.x, tile.canonical.y);
    if (t && t.features && t.features.length) {
      tile.textFeatures = [];
      t.features.forEach((feature: any) => {
        if (layer === LayerType.TEXT) {
          calcTextFeatures(tile, feature, textField);
        }
      });
    }
  });

  return { tiles };
}