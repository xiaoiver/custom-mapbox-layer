import 'whatwg-fetch';
import PointCloudLayer from './layers/PointCloudLayer';
import PointCloudLayer2 from './layers/PointCloudLayer2';
import PointCloudLayer3 from './layers/PointCloudLayer3';
import VectorTileClusterLayer from './layers/VectorTileClusterLayer';
import VectorTileLineLayer from './layers/VectorTileLineLayer';
// import WorkerVectorTileLineLayer from './layers/WorkerVectorTileLineLayer';
import TriangleLayer from './layers/TriangleLayer';
import LineLayer from './layers/LineLayer';
import Line3DLayer from './layers/Line3DLayer';
import { compileBuiltinModules } from './shaders';

compileBuiltinModules();

export {
    PointCloudLayer, // gl_Points, mercator in CPU
    PointCloudLayer2, // deck.gl, mercator in GPU
    PointCloudLayer3, // extrude, mercator in CPU
    VectorTileClusterLayer,
    VectorTileLineLayer,
    // WorkerVectorTileLineLayer,
    TriangleLayer,
    LineLayer, // 2d line
    Line3DLayer, // 3d line
};