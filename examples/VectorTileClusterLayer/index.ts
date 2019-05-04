import * as dat from 'dat.gui';
import * as mapboxgl from 'mapbox-gl';
import { VectorTileClusterLayer } from '../../src';

Object.getOwnPropertyDescriptor(mapboxgl, 'accessToken').set('pk.eyJ1IjoieGlhb2l2ZXIiLCJhIjoiY2pxcmc5OGNkMDY3cjQzbG42cXk5NTl3YiJ9.hUC5Chlqzzh0FFd_aEc-uQ');

const map = new mapboxgl.Map({
    container: 'map',
    zoom: 1,
    center: [-95.96471106679122, 28.604925848431535],
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

    const response = await fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_geography_regions_points.geojson');
    const layer = new VectorTileClusterLayer({
        // @ts-ignore
        geoJSON: (await response.json()).features
    });

    const gui = new dat.GUI();
    const pointFolder = gui.addFolder('point');
    pointFolder.addColor(layer, 'pointColor').onChange(() => {
        layer.triggerRepaint();
    });
    pointFolder.addColor(layer, 'strokeColor').onChange(() => {
        layer.triggerRepaint();
    });
    pointFolder.add(layer, 'strokeWidth', 1, 10).onChange(() => {
        layer.triggerRepaint();
    });

    // @ts-ignore
    map.addLayer(layer, labelLayerId);
});
