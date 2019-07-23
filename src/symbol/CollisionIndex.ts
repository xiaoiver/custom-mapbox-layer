import GridIndex from "./GridIndex";
// @ts-ignore
import * as Point from '@mapbox/point-geometry';
import { mat4, vec4 } from "gl-matrix";
import { xyTransformMat4 } from "../utils/symbol-projection";

export type SingleCollisionBox = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  anchorPointX: number;
  anchorPointY: number;
};

const viewportPadding = 100;

export default class CollisionIndex {
  grid: GridIndex;
  transform: any;

  screenRightBoundary: number;
  screenBottomBoundary: number;
  gridRightBoundary: number;
  gridBottomBoundary: number;

  constructor(
    transform: any,
    grid: GridIndex = new GridIndex(transform.width + 2 * viewportPadding, transform.height + 2 * viewportPadding, 25),
  ) {
    this.transform = transform;

    this.grid = grid;

    this.screenRightBoundary = transform.width + viewportPadding;
    this.screenBottomBoundary = transform.height + viewportPadding;
    this.gridRightBoundary = transform.width + 2 * viewportPadding;
    this.gridBottomBoundary = transform.height + 2 * viewportPadding;
  }

  placeCollisionBox(collisionBox: SingleCollisionBox, allowOverlap: boolean, textPixelRatio: number, posMatrix: mat4, collisionGroupPredicate?: any): { box: Array<number>, offscreen: boolean } {
    const projectedPoint = this.projectAndGetPerspectiveRatio(posMatrix, collisionBox.anchorPointX, collisionBox.anchorPointY);

    const tlX = collisionBox.x1 + projectedPoint.point.x;
    const tlY = collisionBox.y1 + projectedPoint.point.y;
    const brX = collisionBox.x2 + projectedPoint.point.x;
    const brY = collisionBox.y2 + projectedPoint.point.y;

    if (!this.isInsideGrid(tlX, tlY, brX, brY) ||
      (!allowOverlap && this.grid.hitTest(tlX, tlY, brX, brY, collisionGroupPredicate))) {
      return {
        box: [],
        offscreen: false
      };
    }

    return {
      box: [tlX, tlY, brX, brY],
      offscreen: this.isOffscreen(tlX, tlY, brX, brY)
    };
  }

  insertCollisionBox(collisionBox: Array<number>, bucketInstanceId: number, featureIndex: number, collisionGroupID: number) {
    const key = { bucketInstanceId, featureIndex, collisionGroupID };
    this.grid.insert(key, collisionBox[0], collisionBox[1], collisionBox[2], collisionBox[3]);
  }

  /**
   * 后续碰撞检测都需要投影到 viewport 坐标系
   * @param posMatrix 瓦片坐标矩阵
   * @param x 瓦片坐标
   * @param y 瓦片坐标
   */
  projectAndGetPerspectiveRatio(posMatrix: mat4, x: number, y: number) {
    // @ts-ignore
    const p: vec4 = [x, y, 0, 1];
    xyTransformMat4(p, p, posMatrix);
    const a = new Point(
      (((p[0] / p[3] + 1) / 2) * this.transform.width) + viewportPadding,
      (((-p[1] / p[3] + 1) / 2) * this.transform.height) + viewportPadding
    );
    return {
      point: a,
      // See perspective ratio comment in symbol_sdf.vertex
      // We're doing collision detection in viewport space so we need
      // to scale down boxes in the distance
      perspectiveRatio: 0.5 + 0.5 * (this.transform.cameraToCenterDistance / p[3])
    };
  }

  isOffscreen(x1: number, y1: number, x2: number, y2: number) {
    return x2 < viewportPadding || x1 >= this.screenRightBoundary || y2 < viewportPadding || y1 > this.screenBottomBoundary;
  }

  isInsideGrid(x1: number, y1: number, x2: number, y2: number) {
    return x2 >= 0 && x1 < this.gridRightBoundary && y2 >= 0 && y1 < this.gridBottomBoundary;
  }
}