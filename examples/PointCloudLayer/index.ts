import * as dat from 'dat.gui';
import * as mapboxgl from 'mapbox-gl';
import { csvParse } from 'd3-dsv';
import { PointCloudLayer } from '../../src';

Object.getOwnPropertyDescriptor(mapboxgl, 'accessToken').set('pk.eyJ1IjoieGlhb2l2ZXIiLCJhIjoiY2pxcmc5OGNkMDY3cjQzbG42cXk5NTl3YiJ9.hUC5Chlqzzh0FFd_aEc-uQ');

const map = new mapboxgl.Map({
    container: 'map',
    zoom: 11,
    center: [121.51222019389274, 31.23572578718841],
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

    const response = await fetch('https://gw.alipayobjects.com/os/rmsportal/BElVQFEFvpAKzddxFZxJ.txt');
    const rawCSVData = await response.text();
    // @ts-ignore
    const points: Array<{lng: number, lat: number}> = csvParse(rawCSVData);
    const layer = new PointCloudLayer({
        instance: true,
        points
    });

    const gui = new dat.GUI();
    const pointFolder = gui.addFolder('point');
    pointFolder.add(layer, 'pointSize', 1, 50).onChange(() => {
        layer.triggerRepaint();
    });
    pointFolder.add(layer, 'isCircle').onChange(() => {
        layer.triggerRepaint();
    });

    // @ts-ignore
    map.addLayer(layer, labelLayerId);
});
