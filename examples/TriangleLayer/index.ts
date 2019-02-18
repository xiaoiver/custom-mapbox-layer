import * as mapboxgl from 'mapbox-gl';
import { TriangleLayer } from '../../src';

Object.getOwnPropertyDescriptor(mapboxgl, 'accessToken').set('pk.eyJ1IjoieGlhb2l2ZXIiLCJhIjoiY2pxcmc5OGNkMDY3cjQzbG42cXk5NTl3YiJ9.hUC5Chlqzzh0FFd_aEc-uQ');

const map = new mapboxgl.Map({
    container: 'map',
    zoom: 3,
    center: [7.5, 58],
    style: 'mapbox://styles/mapbox/light-v9'
});

map.on('load', () => {
    // @ts-ignore
    map.addLayer(new TriangleLayer());
});
