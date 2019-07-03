import * as React from 'react';
import { storiesOf } from '@storybook/react';
import LineLayer2D from './components/LineLayer2D';
// @ts-ignore
import markdownNotes from './LineLayer.md';

storiesOf('LineLayer', module)
  .add('2D', () => <LineLayer2D />,
  {
    notes: { markdown: markdownNotes }
  });
