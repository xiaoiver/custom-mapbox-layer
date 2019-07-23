import * as React from 'react';
import ReactMapboxGl from "react-mapbox-gl";
import * as dat from 'dat.gui';
import { TextLayer, CircleLayer } from '../../src';

const Map = ReactMapboxGl({
  accessToken: 'pk.eyJ1IjoieGlhb2l2ZXIiLCJhIjoiY2pxcmc5OGNkMDY3cjQzbG42cXk5NTl3YiJ9.hUC5Chlqzzh0FFd_aEc-uQ'
});

export default class VectorLineLayer extends React.Component {

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
            const geoJSON = await response.json();
            const layer = new TextLayer({
              // @ts-ignore
              url: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_geography_regions_points.geojson',
            });
            const circleLayer = new CircleLayer({
              // @ts-ignore
              geoJSON,
            });
            circleLayer.pointRadius = 4;

            const gui = new dat.GUI();
            this.gui = gui;
            gui.add(layer, 'debug').onChange(() => {
              layer.triggerRepaint();
            });

            const textFolder = gui.addFolder('font');
            textFolder.add(layer, 'fontFamily', [
              'Monaco, monospace',
              'sans-serif',
            ]).onChange(() => {
              layer.initGlyphAtlas();
              layer.triggerRepaint();
            });
            textFolder.add(layer, 'fontWeight', 400, 1000).onChange(() => {
              layer.initGlyphAtlas();
              layer.triggerRepaint();
            });
            textFolder.add(layer, 'fontSize', 8, 128).onChange(() => {
              layer.triggerRepaint();
            });
            textFolder.addColor(layer, 'fontColor').onChange(() => {
              layer.triggerRepaint();
            });
            textFolder.add(layer, 'fontOpacity', 0, 1, 0.1).onChange(() => {
              layer.triggerRepaint();
            });
            textFolder.addColor(layer, 'haloColor').onChange(() => {
              layer.triggerRepaint();
            });
            textFolder.add(layer, 'haloWidth', 0, 24, 0.1).onChange(() => {
              layer.triggerRepaint();
            });
            textFolder.add(layer, 'haloBlur', 0, 2, 0.1).onChange(() => {
              layer.triggerRepaint();
            });

            const layoutFolder = gui.addFolder('label layout');
            layoutFolder.add(layer, 'symbolAnchor', [ 'center', 'left', 'right', 'top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right' ]).onChange(() => {
              layer.triggerRepaint();
            });
            // layoutFolder.add(layer, 'textJustify', [ 'center', 'left', 'right' ]).onChange(() => {
            //   layer.triggerRepaint();
            // });
            layoutFolder.add(layer, 'textSpacing', 0, 10, 0.1).onChange(() => {
              layer.triggerRepaint();
            });
            layoutFolder.add(layer, 'textOffsetX', -20, 20, 0.1).onChange(() => {
              layer.triggerRepaint();
            });
            layoutFolder.add(layer, 'textOffsetY', -20, 20, 0.1).onChange(() => {
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
              map.addLayer(circleLayer, labelLayerId);
              
              // @ts-ignore
              map.addLayer(layer, labelLayerId);
            }
          }
        }}>
      </Map>
    </>)
  }
}
