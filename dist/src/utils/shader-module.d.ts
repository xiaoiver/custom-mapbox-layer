declare enum SHADER_TYPE {
    VS = "vs",
    FS = "fs"
}
export declare function registerModule(moduleName: string, { vs, fs }: {
    [v: string]: string;
}): void;
export declare function getModule(moduleName: string): {
    [SHADER_TYPE.VS]: string;
    [SHADER_TYPE.FS]: string;
};
export {};
