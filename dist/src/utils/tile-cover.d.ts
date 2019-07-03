import MercatorCoordinate from '../geo/mercator_coordinate';
import { OverscaledTileID } from '../source/tile_id';
export default function tileCover(z: number, bounds: [MercatorCoordinate, MercatorCoordinate, MercatorCoordinate, MercatorCoordinate], actualZ: number, renderWorldCopies: boolean | void): Array<OverscaledTileID>;
