// @ts-ignore
import quickselect from 'quickselect';
// @ts-ignore
import * as Point from '@mapbox/point-geometry';

/**
 * Returns the signed area for the polygon ring.  Postive areas are exterior rings and
 * have a clockwise winding.  Negative areas are interior rings and have a counter clockwise
 * ordering.
 *
 * @private
 * @param ring Exterior or interior ring
 */
export function calculateSignedArea(ring: Array<Point>): number {
  let sum = 0;
  for (let i = 0, len = ring.length, j = len - 1, p1, p2; i < len; j = i++) {
      p1 = ring[i];
      p2 = ring[j];
      sum += (p2.x - p1.x) * (p1.y + p2.y);
  }
  return sum;
}

// classifies an array of rings into polygons with outer rings and holes
export default function classifyRings(rings: Point[][], maxRings: number) {
  const len = rings.length;

  if (len <= 1) return [rings];

  const polygons = [];
  let polygon,
    ccw;

  for (let i = 0; i < len; i++) {
    const area = calculateSignedArea(rings[i]);
    if (area === 0) continue;

    // @ts-ignore
    rings[i].area = Math.abs(area);

    if (ccw === undefined) ccw = area < 0;

    if (ccw === area < 0) {
      if (polygon) polygons.push(polygon);
      polygon = [rings[i]];

    } else {
      // @ts-ignore
      polygon.push(rings[i]);
    }
  }
  if (polygon) polygons.push(polygon);

  // Earcut performance degrages with the # of rings in a polygon. For this
  // reason, we limit strip out all but the `maxRings` largest rings.
  if (maxRings > 1) {
    for (let j = 0; j < polygons.length; j++) {
      if (polygons[j].length <= maxRings) continue;
      quickselect(polygons[j], maxRings, 1, polygons[j].length - 1, compareAreas);
      polygons[j] = polygons[j].slice(0, maxRings);
    }
  }

  return polygons;
}

// @ts-ignore
function compareAreas(a, b) {
  return b.area - a.area;
}
