import { ITextFeature } from '../layers/TextLayer';
import { OverscaledTileID } from '../source/tile_id';

export const enum LayerType {
  TEXT = 'text',

}

export interface GetTilesMessage {
  layer: LayerType;
  textField: string;
  zoom: number;
  bounds: [number, number][];
  projMatrix: Float32Array;
}

export interface DrawableTile extends OverscaledTileID {
  textFeatures: ITextFeature[]
}

export interface TilesFromWorker {
  tiles: DrawableTile[];
}