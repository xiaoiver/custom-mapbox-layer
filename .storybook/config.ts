import { configure, addParameters } from '@storybook/react';
import { create } from '@storybook/theming';
import '!style-loader!css-loader!sass-loader!./iframe.scss';

addParameters({
  options: {
    isFullscreen: false,
    showAddonsPanel: true,
    showSearchBox: false,
    panelPosition: 'bottom',
    hierarchySeparator: /\./,
    hierarchyRootSeparator: /\|/,
    enableShortcuts: true,
    theme: create({
      base: 'light',
      brandTitle: 'Custom Mapbox Layers',
      brandUrl: 'https://github.com/storybookjs/storybook/tree/master/examples/cra-kitchen-sink',
      gridCellSize: 12,
    })
  },
});

// automatically import all files ending in *.stories.tsx
const req = require.context('../stories', true, /\.stories\.tsx$/);

function loadStories() {
  req.keys().forEach(req);
}

configure(loadStories, module);
