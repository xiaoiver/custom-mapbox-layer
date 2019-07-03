import * as React from 'react';
import ReactMapboxGl from "react-mapbox-gl";
import * as dat from 'dat.gui';
import { LineLayer } from '../../src';

const Map = ReactMapboxGl({
  accessToken: 'pk.eyJ1IjoieGlhb2l2ZXIiLCJhIjoiY2pxcmc5OGNkMDY3cjQzbG42cXk5NTl3YiJ9.hUC5Chlqzzh0FFd_aEc-uQ'
});

let points = [
  [
    -122.3545851,
    37.9249513
  ],
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

export default class LineLayer2D extends React.Component {

  private gui: dat.GUI;
  private layer: LineLayer;

  componentDidMount() {
    const layer = new LineLayer({
      points,
      lineThickness: 2.8
    });
    this.layer = layer;

    this.gui = new dat.GUI();
    const pointFolder = this.gui.addFolder('line');
    pointFolder.add(layer, 'lineThickness', 1, 30).onChange(() => {
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
  }

  componentWillUnmount() {
    this.gui.destroy();
  }

  render() {
    return(
      <Map
        style="mapbox://styles/mapbox/light-v9"
        center={[ -122.3535851, 37.9360513 ]}
        zoom={[ 12 ]}
        containerStyle={{
          height: "100vh",
          width: "100vw"
        }}
        onStyleLoad={(map) => {
          if (map) {
            // Insert the layer beneath any symbol layer.
            const layers = map.getStyle().layers;
            if (layers && layers.length) {
  
              let labelLayerId;
              for (let i = 0; i < layers.length; i++) {
  
                if (layers[i] && layers[i].type === 'symbol'
                  // @ts-ignore
                  && layers[i].layout['text-field']) {
                  labelLayerId = layers[i].id;
                  break;
                }
              }
  
              // @ts-ignore
              map.addLayer(this.layer, labelLayerId);
            }
          }
        }}>
      </Map>)
  }
}
