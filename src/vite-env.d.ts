/// <reference types="vite/client" />

interface GPU {
  requestAdapter(options?: any): Promise<GPUAdapter | null>
}

interface Navigator {
  readonly gpu: GPU | undefined
}

// onnxruntime-web 全局变量声明（使用 any 避免 Vite 构建问题）
declare var ort: any

// Array.at() polyfill 类型
interface Array<T> {
  at(index: number): T | undefined
}
