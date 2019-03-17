import * as dat from 'dat.gui';
import * as mapboxgl from 'mapbox-gl';
import { csvParse } from 'd3-dsv';
import { PointCloudLayer } from '../../src';

Object.getOwnPropertyDescriptor(mapboxgl, 'accessToken').set('pk.eyJ1IjoieGlhb2l2ZXIiLCJhIjoiY2pxcmc5OGNkMDY3cjQzbG42cXk5NTl3YiJ9.hUC5Chlqzzh0FFd_aEc-uQ');

const map = new mapboxgl.Map({
    container: 'map',
    zoom: 12,
    center: [121.498510, 31.289317],
    // center: [120.19382669582967, 30.258134],
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
    pointFolder.add(layer, 'pointSize', 1, 200).onChange(() => {
        layer.triggerRepaint();
    });
    pointFolder.add(layer, 'isCircle').onChange(() => {
        layer.triggerRepaint();
    });

    // @ts-ignore
    map.addLayer(layer, labelLayerId);

    // var geojson = {
    //     "type": "FeatureCollection",
    //     "features": [{
    //         "type": "Feature",
    //         "geometry": {
    //             "type": "Point",
    //             "coordinates": [121.498510, 31.289317]
    //         }
    //     }]
    // };
    // // @ts-ignore
    // map.addSource('point', {
    //     "type": "geojson",
    //     "data": geojson
    // });
    // map.addLayer({
    //     "id": "point",
    //     "type": "circle",
    //     "source": "point",
    //     "paint": {
    //         "circle-radius": 10,
    //         "circle-color": "#3887be"
    //     }
    // });
});
