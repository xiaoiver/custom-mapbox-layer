// @ts-ignore
import * as mat4 from 'gl-matrix/mat4';
import tileCover from '../utils/tile-cover';
import { zoomToScale, TILE_SIZE } from '../utils/web-mercator';
import { UnwrappedTileID, EXTENT, OverscaledTileID } from '../source/tile_id';
import getNormals from '../utils/polyline-normals';
import MercatorCoordinate from '../geo/mercator_coordinate';

interface GetTilesMessage {
  zoom: number;
  bounds: [number, number][];
  projMatrix: Float32Array;
}

interface TileStats {
  tileID: number;
  pointsNum: number;
}

export interface DrawableTile extends OverscaledTileID {
  attributes: {
    position: number[][];
    miter: number[];
    normal: number[][];
    counters: number[];
    indices: number[][];
  }
}

export interface TilesFromWorker {
  stats: TileStats[];
  tiles: DrawableTile[];
}

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

export default function getTiles(tileIndex: any, { zoom, bounds, projMatrix }: GetTilesMessage): TilesFromWorker {
  cleanPosMatrixCache();
  const currentScale = zoomToScale(zoom);
  const flooredZoom = Math.floor(zoom);

  const stats: TileStats[] = [];
  const tiles = <DrawableTile[]>tileCover(flooredZoom, [
    MercatorCoordinate.fromLngLat(bounds[0]),
    MercatorCoordinate.fromLngLat(bounds[1]),
    MercatorCoordinate.fromLngLat(bounds[2]),
    MercatorCoordinate.fromLngLat(bounds[3])
  ], flooredZoom, false);

  tiles.forEach(tile => {
    // for stats
    let simplifiedNum = 0;

    // calculate matrix in tile coords
    tile.posMatrix = calculatePosMatrix(tile.toUnwrapped(), currentScale, projMatrix);

    // retrieve target tile
    const t = tileIndex.getTile(tile.canonical.z, tile.canonical.x, tile.canonical.y);
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

      tile.attributes = {
        position: attrPos,
        miter: attrMiter,
        normal: attrNormal,
        counters: attrCounters,
        indices: attrIndex
      };
    }

    stats.push({
      tileID: tile.key,
      pointsNum: simplifiedNum
    });
  });

  return { tiles, stats };
}