import { registerModule } from '../utils/shader-module';
// @ts-ignore
import * as common from './common.glsl';
// @ts-ignore
import * as project from './project.glsl';
// @ts-ignore
import * as point1VS from './point-vs-mapbox.glsl';
// @ts-ignore
import * as point1FS from './point-fs.glsl';
// @ts-ignore
import * as point2VS from './point-vs.glsl';
// @ts-ignore
import * as lineFS from './line-fs.glsl';
// @ts-ignore
import * as lineVS from './line-vs.glsl';
// @ts-ignore
import * as line3DFS from './line-3d-fs.glsl';
// @ts-ignore
import * as line3DVS from './line-3d-vs.glsl';
// @ts-ignore
import * as lineVTVS from './line-vt-vs.glsl';
// @ts-ignore
import * as circleFS from './circle-fs.glsl';
// @ts-ignore
import * as circleVS from './circle-vs.glsl';
// @ts-ignore
import * as sdfFS from './sdf-fs.glsl';
// @ts-ignore
import * as sdfVS from './sdf-vs.glsl';
// @ts-ignore
import * as quadFS from './quad-fs.glsl';
// @ts-ignore
import * as quadVS from './quad-vs.glsl';

export function compileBuiltinModules() {
    registerModule('point1', { vs: point1VS, fs: point1FS });
    registerModule('point2', { vs: point2VS, fs: point1FS });
    registerModule('common', { vs: common, fs: common });
    registerModule('project', { vs: project, fs: '' });
    registerModule('line', { vs: lineVS, fs: lineFS });
    registerModule('line3d', { vs: line3DVS, fs: line3DFS });
    registerModule('line-vt', { vs: lineVTVS, fs: lineFS });
    registerModule('circle', { vs: circleVS, fs: circleFS });
    registerModule('sdf', { vs: sdfVS, fs: sdfFS });
    registerModule('quad', { vs: quadVS, fs: quadFS });
};