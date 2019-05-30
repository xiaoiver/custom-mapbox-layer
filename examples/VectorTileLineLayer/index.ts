import * as dat from 'dat.gui';
import * as mapboxgl from 'mapbox-gl';
import { VectorTileLineLayer } from '../../src';

Object.getOwnPropertyDescriptor(mapboxgl, 'accessToken').set('pk.eyJ1IjoieGlhb2l2ZXIiLCJhIjoiY2pxcmc5OGNkMDY3cjQzbG42cXk5NTl3YiJ9.hUC5Chlqzzh0FFd_aEc-uQ');

const map = new mapboxgl.Map({
    container: 'map',
    // zoom: 8,
    // center: [-95.96471106679122, 28.604925848431535],
    center: [ 102.602992, 23.107329],
  // pitch: 15,
  zoom: 14.82,
    style: 'mapbox://styles/mapbox/light-v9'
});

map.on('load', async () => {
    // Insert the layer beneath any symbol layer.
    const layers = map.getStyle().layers;
    
    let labelLayerId;
    for (var i = 0; i < layers.length; i++) {
        // @ts-ignore
        if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
            labelLayerId = layers[i].id;
            break;
        }
    }

    const response = await fetch('https://gw.alipayobjects.com/os/rmsportal/ZVfOvhVCzwBkISNsuKCc.json');
    const layer = new VectorTileLineLayer({
        lineThickness: 6.8,
        geoJSON: await response.json()
    });

    const gui = new dat.GUI();
    const pointFolder = gui.addFolder('line');
    pointFolder.add(layer, 'lineThickness', 1, 10).onChange(() => {
        layer.triggerRepaint();
    });

    // @ts-ignore
    map.addLayer(layer, labelLayerId);
});
