import * as React from 'react';
import ReactMapboxGl from "react-mapbox-gl";
import * as dat from 'dat.gui';
import { CircleLayer } from '../../src';
import { sdf2DFunctions } from '../../src/utils/sdf-2d';

const Map = ReactMapboxGl({
  accessToken: 'pk.eyJ1IjoieGlhb2l2ZXIiLCJhIjoiY2pxcmc5OGNkMDY3cjQzbG42cXk5NTl3YiJ9.hUC5Chlqzzh0FFd_aEc-uQ'
});

export default class CircleLayerDemo extends React.Component {

  private gui: dat.GUI;
  private $stats: Node;

  componentWillUnmount() {
    if (this.gui) {
      this.gui.destroy();
    }
    if (this.$stats) {
      document.body.removeChild(this.$stats);
    }
  }

  render() {
    return (<>
      <div id="stats" />
      <Map
        style="mapbox://styles/mapbox/light-v9"
        center={[-95.96471106679122, 28.604925848431535]}
        zoom={[0]}
        containerStyle={{
          height: "100vh",
          width: "100vw"
        }}
        onStyleLoad={async (map) => {
          if (map) {
            const response = await fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_geography_regions_points.geojson');
            const layer = new CircleLayer({
              // @ts-ignore
              geoJSON: await response.json()
            });

            const gui = new dat.GUI();
            this.gui = gui;

            const pointFolder = gui.addFolder('leaf point');
            pointFolder.add(layer, 'pointShape', sdf2DFunctions).onChange(() => {
              layer.triggerRepaint();
            });
            pointFolder.addColor(layer, 'pointColor').onChange(() => {
              layer.triggerRepaint();
            });
            pointFolder.add(layer, 'pointRadius', 2, 20).onChange(() => {
              layer.triggerRepaint();
            });
            pointFolder.add(layer, 'pointOpacity', 0, 1, 0.1).onChange(() => {
              layer.triggerRepaint();
            });
            pointFolder.addColor(layer, 'strokeColor').onChange(() => {
              layer.triggerRepaint();
            });
            pointFolder.add(layer, 'strokeWidth', 1, 10, 0.1).onChange(() => {
              layer.triggerRepaint();
            });
            pointFolder.add(layer, 'strokeOpacity', 0, 1, 0.1).onChange(() => {
              layer.triggerRepaint();
            });

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
              map.addLayer(layer, labelLayerId);
            }
          }
        }}>
      </Map>
    </>)
  }
}
