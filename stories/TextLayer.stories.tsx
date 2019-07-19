import * as React from 'react';
import { storiesOf } from '@storybook/react';
// @ts-ignore
import clusterNotes from './Text.md';
import TextForPoint from './components/TextForPoint';

storiesOf('TextLayer', module)
  .add('Point Feature', () => <TextForPoint />,
  {
    notes: { markdown: clusterNotes }
  });
