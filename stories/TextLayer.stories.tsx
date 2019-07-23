import * as React from 'react';
import { storiesOf } from '@storybook/react';
// @ts-ignore
import clusterNotes from './Text.md';
import TextForPoint from './components/TextForPoint';
import TextForPolygon from './components/TextForPolygon';

storiesOf('TextLayer', module)
  .add('Point Feature', () => <TextForPoint />,
  {
    notes: { markdown: clusterNotes }
  })
  .add('Polygon Feature', () => <TextForPolygon />,
  {
    notes: { markdown: clusterNotes }
  });
