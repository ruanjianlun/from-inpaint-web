/// <reference types="vite/client" />

interface GPU {
  requestAdapter(options?: any): Promise<GPUAdapter | null>
}

interface Navigator {
  readonly gpu: GPU | undefined
}

// onnxruntime-web 类型声明 - 使用 interface 而不是 namespace 避免 Vite 构建问题
interface OrtEnv {
  wasm: {
    wasmPaths: string
    numThreads: number
    simd?: boolean
    proxy?: boolean
  }
}

interface OrtTensor {
  dims: number[]
  data: Float32Array
  dispose(): void
}

interface OrtTensorConstructor {
  new (
    type: string,
    data: Float32Array | Uint8Array,
    dims?: number[]
  ): OrtTensor
}

interface OrtInferenceSession {
  run(feeds: Record<string, any>): Promise<Record<string, any>>
  release(): void
}

interface OrtInferenceSessionConstructor {
  create(
    model: ArrayBuffer | Uint8Array,
    options?: { executionProviders?: string[] }
  ): Promise<OrtInferenceSession>
}

declare const ort: {
  env: OrtEnv
  Tensor: OrtTensorConstructor
  InferenceSession: OrtInferenceSessionConstructor
  session(path: string, options?: any): Promise<OrtInferenceSession>
}

// Array.at() polyfill 类型
interface Array<T> {
  at(index: number): T | undefined
}
