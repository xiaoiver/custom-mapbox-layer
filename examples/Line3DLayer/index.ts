import * as dat from 'dat.gui';
import * as mapboxgl from 'mapbox-gl';
import { Line3DLayer } from '../../src';

Object.getOwnPropertyDescriptor(mapboxgl, 'accessToken').set('pk.eyJ1IjoieGlhb2l2ZXIiLCJhIjoiY2pxcmc5OGNkMDY3cjQzbG42cXk5NTl3YiJ9.hUC5Chlqzzh0FFd_aEc-uQ');

const map = new mapboxgl.Map({
  container: 'map',
  zoom: 10,
  center: [-122.4, 37.7],
  style: 'mapbox://styles/mapbox/light-v9',
  pitch: 0,
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

  // @ts-ignore
  let points = [
    [
      -122.3535851,
      37.9360513
    ],
    [
      -122.3535851,
      37.9249513
    ],
    [
      -122.300284,
      37.902646
    ],
    [
      -122.2843653,
      37.8735039
    ],
    [
      -122.269058,
      37.8694562
    ],
    [
      -122.2709185,
      37.85301
    ],
    [
      -122.2689342,
      37.8283973
    ],
    [
      -122.2707195,
      37.8080566
    ],
    [
      -122.2718706,
      37.804996
    ],
    [
      -122.2948251,
      37.8064628
    ],
    [
      -122.3971496,
      37.794745
    ],
    [
      -122.4030149,
      37.7905282
    ],
    [
      -122.4084631,
      37.7862646
    ],
    [
      -122.4157833,
      37.7803439
    ],
    [
      -122.4219476,
      37.7653052
    ],
    [
      -122.4206096,
      37.7528545
    ],
    [
      -122.4359052,
      37.7340058
    ],
    [
      -122.448995,
      37.723273
    ],
    [
      -122.471192,
      37.7067871
    ],
    [
      -122.4672607,
      37.6842548
    ],
    [
      -122.4449822,
      37.6635925
    ],
    [
      -122.4169649,
      37.6372339
    ],
    [
      -122.3876274,
      37.5993171
    ]
  ].map(p => ({
    lng: p[0],
    lat: p[1]
  }));

  // const image = await new Promise((resolve, reject) => {
  //   const image = new Image();
  //   image.src = './static/box.png';
  //   image.onload = () => resolve(image);
  //   image.onerror = reject;
  // });

  const layer = new Line3DLayer({
    points,
    // lookupTableImage: image
  });

  const gui = new dat.GUI();
  const pointFolder = gui.addFolder('line');
  pointFolder.add(layer, 'lineThickness', 1, 10).onChange(() => {
    layer.triggerRepaint();
  });
  pointFolder.add(layer, 'dashArray', 0, 1).onChange(() => {
    layer.triggerRepaint();
  });
  pointFolder.add(layer, 'dashOffset', 0, 1).onChange(() => {
    layer.triggerRepaint();
  });
  pointFolder.add(layer, 'dashRatio', 0, 1).onChange(() => {
    layer.triggerRepaint();
  });
  pointFolder.add(layer, 'antialias').onChange(() => {
    layer.triggerRepaint();
  });

  // @ts-ignore
  map.addLayer(layer, labelLayerId);
});
