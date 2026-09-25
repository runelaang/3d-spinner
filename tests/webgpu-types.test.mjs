import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// The engine declares its own slice of the WebGPU API (core/webgpu-api.ts) so the
// published types do not depend on `@webgpu/types`. This compiles a check file
// against the built declarations and `@webgpu/types` (a dev dependency): every
// local member must exist on the official type, every call the local types allow
// must be valid for the official method, and every value the official API returns
// must fit the local type.

const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\\/g, "/");

const check = `
import type * as Local from "./dist/engines/little-3d-engine/core/webgpu-api.js";

/** The official type for each brand the local types carry. */
interface Official {
  GPU: GPU;
  GPUAdapter: GPUAdapter;
  GPUQueue: GPUQueue;
  GPUCanvasContext: GPUCanvasContext;
  GPUCommandEncoder: GPUCommandEncoder;
  GPURenderPassEncoder: GPURenderPassEncoder;
  GPUBuffer: GPUBuffer;
  GPUTexture: GPUTexture;
  GPUTextureView: GPUTextureView;
  GPUSampler: GPUSampler;
  GPUBindGroup: GPUBindGroup;
  GPUBindGroupLayout: GPUBindGroupLayout;
  GPUShaderModule: GPUShaderModule;
  GPUPipelineLayout: GPUPipelineLayout;
  GPURenderPipeline: GPURenderPipeline;
  GPUCommandBuffer: GPUCommandBuffer;
  GPUDevice: GPUDevice;
}

/**
 * T with every local WebGPU type replaced by the official type it stands for;
 * each of those pairs is checked on its own below. Typed arrays count as
 * BufferSource: the spec accepts any typed array, but @webgpu/types only views on
 * a plain ArrayBuffer, which needs the generic typed arrays of TypeScript 5.7+ and
 * would break consumers on older versions. The engine never uses shared memory.
 */
type AsOfficial<T> = T extends { readonly __brand: infer B extends keyof Official }
  ? Official[B]
  : T extends ArrayBufferView
    ? BufferSource
    : T extends TexImageSource
      ? T
      : T extends Promise<infer U>
        ? Promise<AsOfficial<U>>
        : T extends object
          ? { [K in keyof T]: AsOfficial<T[K]> }
          : T;

/** The names of the local members that do not match the official type. */
type Mismatches<Real, Local> = {
  [K in keyof Local]: K extends keyof Real
    ? Local[K] extends (...args: infer A) => infer R
      ? Real[K] extends (...args: infer B) => infer S
        ? AsOfficial<A> extends B
          ? S extends AsOfficial<R>
            ? never
            : K
          : K
        : K
      : Real[K] extends AsOfficial<Local[K]>
        ? never
        : K
    : K;
}[keyof Local];

/** Compiles only when there is no mismatch; the error names the member that differs. */
type None<T extends never> = T;

export type Checks = [
  None<Mismatches<GPUAdapter, Local.GpuAdapter>>,
  None<Mismatches<GPUDevice, Local.GpuDevice>>,
  None<Mismatches<GPUQueue, Local.GpuQueue>>,
  None<Mismatches<GPUCanvasContext, Local.GpuCanvasContext>>,
  None<Mismatches<GPUCommandEncoder, Local.GpuCommandEncoder>>,
  // setBindGroup is overloaded in the official types, and inference only sees the last
  // overload; the call below checks it against all of them.
  None<Exclude<Mismatches<GPURenderPassEncoder, Local.GpuRenderPass>, "setBindGroup">>,
  None<Mismatches<GPURenderPipeline, Local.GpuRenderPipeline>>,
  None<Mismatches<GPUTexture, Local.GpuTexture>>,
  None<Mismatches<GPUBuffer, Local.GpuBuffer>>,
  // The spec only ever returns "bgra8unorm" or "rgba8unorm"; the official type allows any format.
  None<Exclude<Mismatches<GPU, Local.Gpu>, "getPreferredCanvasFormat">>,
  None<Mismatches<typeof GPUBufferUsage, Local.GpuFlags["bufferUsage"]>>,
  None<Mismatches<typeof GPUTextureUsage, Local.GpuFlags["textureUsage"]>>,
  None<Mismatches<typeof GPUShaderStage, Local.GpuFlags["shaderStage"]>>,
];

declare const pass: GPURenderPassEncoder;
declare const setBindGroupArgs: AsOfficial<Parameters<Local.GpuRenderPass["setBindGroup"]>>;
pass.setBindGroup(...setBindGroupArgs);
`;

test("the local WebGPU types match @webgpu/types", () => {
  const options = {
    target: ts.ScriptTarget.ES2022,
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types: ["@webgpu/types"],
    strict: true,
    noEmit: true,
  };
  const file = `${root}webgpu-types-check.ts`;
  const host = ts.createCompilerHost(options);
  const { getSourceFile, fileExists, readFile } = host;
  host.getSourceFile = (name, language, ...rest) =>
    name.replace(/\\/g, "/") === file
      ? ts.createSourceFile(name, check, language)
      : getSourceFile.call(host, name, language, ...rest);
  host.fileExists = (name) => name.replace(/\\/g, "/") === file || fileExists.call(host, name);
  host.readFile = (name) => (name.replace(/\\/g, "/") === file ? check : readFile.call(host, name));
  const program = ts.createProgram([file], options, host);
  const errors = ts
    .getPreEmitDiagnostics(program)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " "));
  assert.deepEqual(errors, []);
});
