/* tslint:disable */
/* eslint-disable */

export class RawVolume {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * All frames, x fastest.
     */
    readonly data: Float32Array;
    /**
     * [nx, ny, nz, nt]
     */
    readonly dims: Uint32Array;
    /**
     * Voxel sizes [dx, dy, dz] (mm).
     */
    readonly pixdim: Float64Array;
}

export class Volume {
    free(): void;
    [Symbol.dispose](): void;
    bounds(): Float64Array;
    difference(other: Volume): Volume;
    frames(): number;
    info_json(): string;
    constructor(bytes: Uint8Array | number[]);
    ratio(other: Volume): Volume;
    sample_plane(origin: Float64Array | number[], u: Float64Array | number[], v: Float64Array | number[], w: number, h: number, linear: boolean): Float32Array;
    set_frame(t: number): void;
    value_at(x: number, y: number, z: number): number;
    voxel_at(x: number, y: number, z: number): Float64Array;
    /**
     * World coordinates of a voxel (for "go to voxel").
     */
    world_of(i: number, j: number, k: number): Float64Array;
}

/**
 * Reads a NIfTI or MINC file (bytes as read from disk). Throws an Error with the reader's message.
 */
export function readVolume(bytes: Uint8Array | number[]): RawVolume;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_rawvolume_free: (a: number, b: number) => void;
    readonly __wbg_volume_free: (a: number, b: number) => void;
    readonly rawvolume_data: (a: number) => [number, number];
    readonly rawvolume_dims: (a: number) => [number, number];
    readonly rawvolume_pixdim: (a: number) => [number, number];
    readonly readVolume: (a: number, b: number) => [number, number, number];
    readonly volume_bounds: (a: number) => [number, number];
    readonly volume_difference: (a: number, b: number) => number;
    readonly volume_frames: (a: number) => number;
    readonly volume_info_json: (a: number) => [number, number];
    readonly volume_new: (a: number, b: number) => [number, number, number];
    readonly volume_ratio: (a: number, b: number) => number;
    readonly volume_sample_plane: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => [number, number];
    readonly volume_set_frame: (a: number, b: number) => void;
    readonly volume_value_at: (a: number, b: number, c: number, d: number) => number;
    readonly volume_voxel_at: (a: number, b: number, c: number, d: number) => [number, number];
    readonly volume_world_of: (a: number, b: number, c: number, d: number) => [number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
