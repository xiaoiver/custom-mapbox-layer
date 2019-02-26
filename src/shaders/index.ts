import { registerModule } from '../utils/shader-module';
// @ts-ignore
import common from './common.glsl';
// @ts-ignore
import project from './project.glsl';
// @ts-ignore
import point1VS from '../shaders/point-vs-mapbox.glsl';
// @ts-ignore
import point1FS from '../shaders/point-fs.glsl';
// @ts-ignore
import point2VS from '../shaders/point-vs.glsl';

export function compileBuiltinModules() {
    registerModule('point1', { vs: point1VS, fs: point1FS });
    registerModule('point2', { vs: point2VS, fs: point1FS });
    registerModule('common', { vs: common, fs: common });
    registerModule('project', { vs: project, fs: '' });
};