import * as React from 'react';
import { storiesOf } from '@storybook/react';
// @ts-ignore
import badNotes from './PointLayerBad.md';
// @ts-ignore
import notes from './PointLayer.md';
// @ts-ignore
import circleNotes from './Point2DSDF.md';

import PointLayerBad from './components/PointLayerBad';
import PointLayer from './components/PointLayer';
import CircleLayer from './components/CircleLayer';

storiesOf('PointLayer', module)
  .add('精度问题', () => <PointLayerBad />,
  {
    notes: { markdown: badNotes }
  })
  .add('偏移坐标系', () => <PointLayer />,
  {
    notes: { markdown: notes }
  })
  .add('2D SDF', () => <CircleLayer />,
  {
    notes: { markdown: circleNotes }
  });
