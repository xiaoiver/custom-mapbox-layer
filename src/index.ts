import 'whatwg-fetch';
import PointCloudLayer from './layers/PointCloudLayer';
import PointCloudLayer2 from './layers/PointCloudLayer2';
import PointCloudLayer3 from './layers/PointCloudLayer3';
import TriangleLayer from './layers/TriangleLayer';

export {
    PointCloudLayer, // gl_Points, mercator in CPU
    PointCloudLayer2, // deck.gl, mercator in GPU
    PointCloudLayer3, // extrude, mercator in CPU
    TriangleLayer
};