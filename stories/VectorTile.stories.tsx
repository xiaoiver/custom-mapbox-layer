import * as React from 'react';
import { storiesOf } from '@storybook/react';
// @ts-ignore
import clusterNotes from './VectorTileCluster.md';
// @ts-ignore
import vectorLineNotes from './VectorTileLine.md';
import VectorTileLine from './components/VectorTileLine';
import VectorTileCluster from './components/VectorTileCluster';

storiesOf('VectorLayer', module)
  .add('Line', () => <VectorTileLine />,
  {
    notes: { markdown: vectorLineNotes }
  })
  .add('Cluster', () => <VectorTileCluster />,
  {
    notes: { markdown: clusterNotes }
  });
