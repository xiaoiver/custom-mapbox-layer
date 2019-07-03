// https://github.com/webpack-contrib/worker-loader#integrating-with-typescript
declare module "worker-loader!*" {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}

declare module "potpack" {
  type Bin = {
      x: number,
      y: number,
      w: number,
      h: number
  };

  function potpack(bins: Array<Bin>): {w: number, h: number, fill: number};

  export default potpack;
}