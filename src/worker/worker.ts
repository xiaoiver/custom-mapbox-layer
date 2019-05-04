import loadData from './loadData';
import getTiles from './getTiles';

const ctx: Worker = self as any;

// geojson-vt
let tileIndex: any;

ctx.addEventListener('message', async ({ data: payload }) => {
  const { command, params } = payload;

  switch (command) {
    case 'loadData': {
      try {
        tileIndex = await loadData(params);
        ctx.postMessage({
          status: 'success'
        });
      } catch (e) {
        ctx.postMessage({
          params: e.toString(),
          status: 'failure'
        });
      }
      break;
    }

    case 'getTiles': {
      if (tileIndex) {
        ctx.postMessage({
          command: 'renderTiles',
          params: getTiles(tileIndex, params),
          status: 'success'
        });
      }
      break;
    }
  }
});