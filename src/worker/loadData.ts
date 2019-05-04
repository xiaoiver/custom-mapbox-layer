// @ts-ignore
import geojsonvt from 'geojson-vt';

interface LoadDataMessage {
  url: string;
  type: string;
  isCluster: boolean;
}

export default async function loadData({ url, type, isCluster }: LoadDataMessage) {
  // need to fetch url
  const ret = await fetch(url);
  if (type === 'json' || type === 'geojson') {
    if (!isCluster) {
      return geojsonvt(await ret.json(), {
        maxZoom: 24,
        tolerance: 30,
        extent: 8192
      });
    }
  } else if (type === 'csv') {
    // const data = await ret.text();
  }
  // TODO: type === 'image'
}