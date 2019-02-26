enum SHADER_TYPE {
  VS = 'vs',
  FS = 'fs'
}

const moduleCache: {
  [key: string]: {
    [SHADER_TYPE.VS]: string;
    [SHADER_TYPE.FS]: string;
  };
} = {};
const rawContentCache: {
  [key: string]: {
    [SHADER_TYPE.VS]: string;
    [SHADER_TYPE.FS]: string;
  };
} = {};
const precisionRegExp = /precision\s+(high|low|medium)p\s+float/;
const globalDefaultprecision = '#ifdef GL_FRAGMENT_PRECISION_HIGH\n precision highp float;\n #else\n precision mediump float;\n#endif\n';
const includeRegExp = /#pragma include (["^+"]?["\ "[a-zA-Z_0-9](.*)"]*?)/g;

/**
 * process module
 * @param rawContent 
 * @param includeList 
 * @param type 
 */
function processModule(rawContent: string, includeList: Array<string>, type: SHADER_TYPE) {
  return rawContent.replace(includeRegExp, (_, strMatch) => {
    const includeOpt = strMatch.split(' ');
    const includeName = includeOpt[0].replace(/"/g, '');

    if (includeList.indexOf(includeName) > -1) {
      return '';
    }

    let txt = rawContentCache[includeName][type];
    includeList.push(includeName);

    txt = processModule(txt, includeList, type);
    return txt;
  });
}

function convertToWebGL2(content: string, type: SHADER_TYPE): string {
  return content;
}

export function registerModule(moduleName: string, {vs, fs}: {[v:string]:string}) {
  rawContentCache[moduleName] = {
    vs, fs
  };
}

export function getModule(moduleName: string) {
  if (moduleCache[moduleName]) {
    return moduleCache[moduleName];
  }

  const {vs, fs} = rawContentCache[moduleName];

  let vert = processModule(vs, [], SHADER_TYPE.VS);
  let frag = processModule(fs, [], SHADER_TYPE.FS);

  frag = convertToWebGL2(frag, SHADER_TYPE.FS);

  /**
   * set default precision for fragment shader
   * https://stackoverflow.com/questions/28540290/why-it-is-necessary-to-set-precision-for-the-fragment-shader
   */
  if (!precisionRegExp.test(frag)) {
    frag = globalDefaultprecision + frag;
  }

  moduleCache[moduleName] = {
    vs: vert,
    fs: frag
  };
  return moduleCache[moduleName];
}