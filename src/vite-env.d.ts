/// <reference types="vite/client" />

interface GPU {
  requestAdapter(options?: any): Promise<GPUAdapter | null>
}

interface Navigator {
  readonly gpu: GPU | undefined
}

// onnxruntime-web 类型声明
declare namespace ort {
  interface Session {
    release(): void
  }

  interface Env {
    wasm: {
      wasmPaths: string
      numThreads: number
      simd?: boolean
      proxy?: boolean
    }
  }

  interface Tensor {
    dims: number[]
    data: Float32Array
    dispose(): void
  }

  interface TensorConstructor {
    new (type: string, data: Float32Array | Uint8Array, dims?: number[]): Tensor
  }

  interface InferenceSession {
    run(feeds: Record<string, any>): Promise<Record<string, any>>
    release(): void
  }

  interface InferenceSessionConstructor {
    create(
      model: ArrayBuffer | Uint8Array,
      options?: { executionProviders?: string[] }
    ): Promise<InferenceSession>
  }

  const env: Env
  const Tensor: TensorConstructor
  const InferenceSession: InferenceSessionConstructor

  function session(path: string, options?: any): Promise<InferenceSession>
}

// Array.at() polyfill 类型
interface Array<T> {
  at(index: number): T | undefined
}
