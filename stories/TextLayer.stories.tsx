import * as React from 'react';
import { storiesOf } from '@storybook/react';
// @ts-ignore
import textNotes from './Text.md';
// @ts-ignore
import textForPolygonNotes from './TextForPolygon.md';
import TextForPoint from './components/TextForPoint';
import TextForPolygon from './components/TextForPolygon';

storiesOf('TextLayer', module)
  .add('Point Feature', () => <TextForPoint />,
  {
    notes: { markdown: textNotes }
  })
  .add('Polygon Feature', () => <TextForPolygon />,
  {
    notes: { markdown: textForPolygonNotes }
  });
