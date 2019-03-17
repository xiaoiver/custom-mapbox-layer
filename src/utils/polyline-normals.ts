// @ts-ignore
import { direction, normal, computeMiter } from 'polyline-miter-util';
import { create, copy, dot } from 'gl-vec2';

let lineA = [0, 0];
let lineB = [0, 0];
let tangent = [0, 0];
let miter = [0, 0];
let _lastFlip = -1;
let _started = false;
let _normal: any = null;
let tmp = create();
let count = 0;
const miterLimit = 3;

function extrusions(
  positions: Array<Array<number>>,
  out: any,
  point: Array<number>, normal: Array<number>, scale: number) {
  addNext(out, normal, -scale);
  addNext(out, normal, scale);
  positions.push(point);
  positions.push(point);
}

function addNext(out: Array<Array<any>>, normal: Array<number>, length: number) {
  out.push([[normal[0], normal[1]], length]);
}

export default function(points: Array<Array<number>>, closed: boolean) {
  const out: any = [];
  const attrPos: Array<Array<number>> = [];
  const attrIndex = [];
  const attrCounters: Array<number> = [0, 0];
  if (closed) {
    points = points.slice();
    points.push(points[0]);
  }

  const total = points.length;
  for (let i = 1; i < total; i++) {
    let index = count;
    const last = points[i-1];
    const cur = points[i];
    const next = i < points.length - 1 ? points[i + 1] : null;

    attrCounters.push(i/total, i/total);

    direction(lineA, cur, last);

    if (!_normal) {
      _normal = [0, 0];
      normal(_normal, lineA);
    }

    if (!_started) {
      _started = true;
      extrusions(attrPos, out, last, _normal, 1);
    }

    attrIndex.push([index+0, index+1, index+2]);

    if (!next) { //no miter, simple segment
      normal(_normal, lineA) //reset normal
      extrusions(attrPos, out, cur, _normal, 1);
      attrIndex.push(
        _lastFlip===1 ? [index, index+2, index+3] : [index+2, index+1, index+3]);

      count += 2;
    } else { //miter with last
      //get unit dir of next line
      direction(lineB, next, cur);

      //stores tangent & miter
      let miterLen = computeMiter(tangent, miter, lineA, lineB, 1);

      //get orientation
      let flip = (dot(tangent, _normal) < 0) ? -1 : 1;
      
      const bevel = miterLen > miterLimit;
      if (bevel) {
        miterLen = miterLimit;
        attrCounters.push(i/total);

        //next two points in our first segment
        addNext(out, _normal, -flip);
        attrPos.push(cur);
        addNext(out, miter, miterLen * flip);
        attrPos.push(cur);

        attrIndex.push(_lastFlip !== -flip
                ? [index, index+2, index+3] 
                : [index+2, index+1, index+3]);

        // now add the bevel triangle
        attrIndex.push([index+2, index+3, index+4]);

        normal(tmp, lineB);
        copy(_normal, tmp); //store normal for next round

        addNext(out, _normal, -flip);
        attrPos.push(cur);

        // the miter is now the normal for our next join
        count += 3;
      } else { //miter
        //next two points for our miter join
        extrusions(attrPos, out, cur, miter, miterLen);
        attrIndex.push(_lastFlip === 1
          ? [index, index+2, index+3] 
          : [index+2, index+1, index+3]);

        flip = -1;

        //the miter is now the normal for our next join
        copy(_normal, miter);
        count += 2;
      }
      _lastFlip = flip;
    }
  }

  return {
    normals: out,
    attrIndex,
    attrPos,
    attrCounters
  };
}
