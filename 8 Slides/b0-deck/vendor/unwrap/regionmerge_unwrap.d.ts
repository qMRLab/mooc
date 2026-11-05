/* tslint:disable */
/* eslint-disable */

/**
 * Result of `unwrap2d`. Each getter returns a fresh typed-array copy.
 */
export class Unwrapped2d {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Merge-order fingerprint, 16 hex digits.
     */
    readonly fingerprint: string;
    /**
     * Initial region labels; 4294967295 outside the mask.
     */
    readonly labels: Uint32Array;
    /**
     * The mask used (0/1).
     */
    readonly mask: Uint8Array;
    /**
     * Number of initial regions.
     */
    readonly nRegions: number;
    /**
     * Unwrapped phase (radians), 0 outside the mask.
     */
    readonly unwrapped: Float32Array;
}

/**
 * Region-merging unwrapping (after Jenkinson 2003) of an nx × ny phase image (x fastest).
 * `mask`: optional, non-zero = inside. `n_intervals`: optional, default 6. Throws an `Error` on bad input.
 */
export function unwrap2d(phase: Float32Array, nx: number, ny: number, mask?: Uint8Array | null, n_intervals?: number | null): Unwrapped2d;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_unwrapped2d_free: (a: number, b: number) => void;
    readonly unwrap2d: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number, number];
    readonly unwrapped2d_fingerprint: (a: number) => [number, number];
    readonly unwrapped2d_labels: (a: number) => [number, number];
    readonly unwrapped2d_mask: (a: number) => [number, number];
    readonly unwrapped2d_nRegions: (a: number) => number;
    readonly unwrapped2d_unwrapped: (a: number) => [number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
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
