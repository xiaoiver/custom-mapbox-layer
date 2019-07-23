// @ts-ignore
import * as Point from '@mapbox/point-geometry';
import classifyRings from '../../utils/classify-rings';
// @ts-ignore
import findPoleOfInaccessibility from '../../utils/find_pole_of_inaccessibility';
import { DrawableTile } from "../../d.ts";

export default function calcTextFeatures(tile: DrawableTile, feature: any, textField: string) {
  const text = feature.tags[textField];
  if (feature.type === 3) { // Polygon feature
    const rings = feature.geometry.map((ring: number[][]) => {
      return ring.map((p: number[]) => new Point(p[0], p[1]));
    });

    for (const polygon of classifyRings(rings, 0)) {
      // 计算多边形的难抵极
      const poi = findPoleOfInaccessibility(polygon, 16);

      tile.textFeatures = [
        ...tile.textFeatures,
        {
          position: [poi.x, poi.y],
          text,
        }
      ]
    }
  } else if (feature.type === 1) { // Point feature
    tile.textFeatures = [
      ...tile.textFeatures,
      {
        position: feature.geometry[0],
        text,
      }
    ];
  }
}