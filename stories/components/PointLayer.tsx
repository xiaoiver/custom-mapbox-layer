import * as React from 'react';
import ReactMapboxGl from "react-mapbox-gl";
import * as dat from 'dat.gui';
import { csvParse } from 'd3-dsv';
import { PointCloudLayer2 } from '../../src';

const Map = ReactMapboxGl({
  accessToken: 'pk.eyJ1IjoieGlhb2l2ZXIiLCJhIjoiY2pxcmc5OGNkMDY3cjQzbG42cXk5NTl3YiJ9.hUC5Chlqzzh0FFd_aEc-uQ'
});

export default class PointLayer extends React.Component {

  private gui: dat.GUI;

  componentWillUnmount() {
    if (this.gui) {
      this.gui.destroy();
    }
  }

  render() {
    return(
      <Map
        style="mapbox://styles/mapbox/light-v9"
        center={[ 121.498510, 31.289317 ]}
        zoom={[ 15 ]}
        containerStyle={{
          height: "100vh",
          width: "100vw"
        }}
        onStyleLoad={async (map) => {
          if (map) {
            const response = await fetch('https://gw.alipayobjects.com/os/rmsportal/BElVQFEFvpAKzddxFZxJ.txt');
            const rawCSVData = await response.text();
            // @ts-ignore
            const points: Array<{lng: number, lat: number}> = csvParse(rawCSVData);

            const layer = new PointCloudLayer2({
                instance: true,
                points
            });

            const gui = new dat.GUI();
            this.gui = gui;
            const pointFolder = gui.addFolder('point');
            pointFolder.add(layer, 'pointSize', 1, 200).onChange(() => {
                layer.triggerRepaint();
            });
            pointFolder.add(layer, 'isCircle').onChange(() => {
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
      </Map>)
  }
}
