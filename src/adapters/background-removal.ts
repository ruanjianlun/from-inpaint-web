// @ts-nocheck
/* eslint-disable camelcase */
/* eslint-disable no-plusplus */
/* eslint-disable no-console */
import cv, { Mat } from 'opencv-ts'
import { ensureModel } from './cache'
import { getCapabilities } from './util'

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image from ${url}`))
    img.src = url
  })
}

function imgProcess(img: Mat, targetSize = 1024) {
  // Resize image to target size (isnet expects 1024x1024)
  const resized = new cv.Mat()
  const dsize = new cv.Size(targetSize, targetSize)
  cv.resize(img, resized, dsize, 0, 0, cv.INTER_LINEAR)

  const channels = new cv.MatVector()
  cv.split(resized, channels) // 分割通道

  const C = channels.size() // 通道数
  const H = resized.rows // 图像高度 (targetSize)
  const W = resized.cols // 图像宽度 (targetSize)

  const chwArray = new Float32Array(C * H * W) // isnet uses float32

  for (let c = 0; c < C; c++) {
    const channelData = channels.get(c).data // 获取单个通道的数据
    for (let h = 0; h < H; h++) {
      for (let w = 0; w < W; w++) {
        // Normalize to [0, 1] range and convert to float32
        chwArray[c * H * W + h * W + w] = channelData[h * W + w] / 255.0
      }
    }
  }

  channels.delete() // 清理内存
  resized.delete() // 清理内存
  return chwArray // 返回转换后的数据
}

function processImage(
  img: HTMLImageElement,
  canvasId?: string
): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    try {
      const src = cv.imread(img)
      const src_rgb = new cv.Mat()
      // 将图像从RGBA转换为RGB
      cv.cvtColor(src, src_rgb, cv.COLOR_RGBA2RGB)
      if (canvasId) {
        cv.imshow(canvasId, src_rgb)
      }
      resolve(imgProcess(src_rgb))

      src.delete()
      src_rgb.delete()
    } catch (error) {
      reject(error)
    }
  })
}

function postProcess(
  maskData: Float32Array,
  originalImageData: ImageData,
  modelSize = 1024
): ImageData {
  const { width, height } = originalImageData
  const size = width * height

  // Create new image data with transparent background
  const newImageData = new ImageData(width, height)

  // Resize mask from model size to original image size
  // The mask is output at modelSize x modelSize (1024x1024)
  // We need to resize it to the original image dimensions
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = modelSize
  maskCanvas.height = modelSize
  const maskCtx = maskCanvas.getContext('2d')!
  const maskImageData = maskCtx.createImageData(modelSize, modelSize)

  // Fill mask image data from Float32Array
  for (let i = 0; i < modelSize * modelSize; i++) {
    const maskValue = maskData[i]
    const pixelIndex = i * 4
    // Convert mask to grayscale (0-255)
    const value = Math.floor(maskValue * 255)
    maskImageData.data[pixelIndex] = value
    maskImageData.data[pixelIndex + 1] = value
    maskImageData.data[pixelIndex + 2] = value
    maskImageData.data[pixelIndex + 3] = 255
  }

  maskCtx.putImageData(maskImageData, 0, 0)

  // Create canvas for resized mask
  const resizedMaskCanvas = document.createElement('canvas')
  resizedMaskCanvas.width = width
  resizedMaskCanvas.height = height
  const resizedMaskCtx = resizedMaskCanvas.getContext('2d')!

  // Draw and resize the mask
  resizedMaskCtx.drawImage(maskCanvas, 0, 0, width, height)

  // Get the resized mask data
  const resizedMaskImageData = resizedMaskCtx.getImageData(0, 0, width, height)

  // Apply the resized mask to original image
  for (let i = 0; i < size; i++) {
    const maskValue = resizedMaskImageData.data[i * 4] / 255 // Convert back to 0-1
    const pixelIndex = i * 4

    // If mask value indicates foreground, keep original pixel
    // If mask value indicates background, make it transparent
    if (maskValue > 0.5) {
      // Foreground - keep original
      newImageData.data[pixelIndex] = originalImageData.data[pixelIndex] // R
      newImageData.data[pixelIndex + 1] = originalImageData.data[pixelIndex + 1] // G
      newImageData.data[pixelIndex + 2] = originalImageData.data[pixelIndex + 2] // B
      newImageData.data[pixelIndex + 3] = 255 // A
    } else {
      // Background - make transparent
      newImageData.data[pixelIndex] = 0
      newImageData.data[pixelIndex + 1] = 0
      newImageData.data[pixelIndex + 2] = 0
      newImageData.data[pixelIndex + 3] = 0 // Transparent
    }
  }

  return newImageData
}

function imageDataToDataURL(imageData: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height

  const ctx = canvas.getContext('2d')
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  ctx!.putImageData(imageData, 0, 0)

  return canvas.toDataURL()
}

function configEnv(capabilities: any) {
  ort.env.wasm.wasmPaths =
    'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.3/dist/'
  // Always use WASM configuration for background removal (WebGPU doesn't support ceil() in MaxPool)
  if (capabilities.threads) {
    ort.env.wasm.numThreads = navigator.hardwareConcurrency ?? 4
  }
  if (capabilities.simd) {
    ort.env.wasm.simd = true
  }
  ort.env.wasm.proxy = true
  console.log('env', ort.env.wasm)
}

let model: ort.InferenceSession | null = null

export default async function removeBackground(
  imageFile: File | HTMLImageElement,
  setProgress?: (progress: number) => void
): Promise<string> {
  console.log('[removeBackground] Function started')
  console.time('sessionCreate')
  if (!model) {
    console.log('[removeBackground] Creating new inference session')
    setProgress?.(10)
    const capabilities = await getCapabilities()
    console.log('[removeBackground] Capabilities:', capabilities)
    configEnv(capabilities)
    console.log('[removeBackground] Loading model buffer...')
    setProgress?.(20)
    const modelBuffer = await ensureModel('backgroundRemoval')
    console.log(
      '[removeBackground] Model buffer loaded, size:',
      modelBuffer.byteLength
    )
    console.log('[removeBackground] Creating inference session...')
    setProgress?.(30)
    // Force WASM backend for background removal (WebGPU doesn't support ceil() in MaxPool)
    console.log('[removeBackground] Using WASM execution provider')
    model = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: ['wasm'],
    })
    console.log('[removeBackground] Inference session created')
    setProgress?.(50)
  } else {
    console.log('[removeBackground] Using existing inference session')
    setProgress?.(50)
  }
  console.timeEnd('sessionCreate')

  console.time('preProcess')
  setProgress?.(60)

  const originalImg =
    imageFile instanceof HTMLImageElement
      ? imageFile
      : await loadImage(URL.createObjectURL(imageFile))

  // Get original image data for post-processing
  const canvas = document.createElement('canvas')
  canvas.width = originalImg.width
  canvas.height = originalImg.height
  const ctx = canvas.getContext('2d')
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  ctx!.drawImage(originalImg, 0, 0)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const originalImageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)

  // Process image for model input (resizes to 1024x1024 for isnet)
  const img = await processImage(originalImg)
  setProgress?.(70)

  // Create input tensor - isnet expects [1, 3, 1024, 1024] float32 normalized to [0, 1]
  const MODEL_SIZE = 1024
  const imageTensor = new ort.Tensor('float32', img, [
    1,
    3,
    MODEL_SIZE,
    MODEL_SIZE,
  ])

  const Feed: { [key: string]: any } = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    [model.inputNames[0]]: imageTensor,
  }

  console.timeEnd('preProcess')

  console.time('run')
  const results = await model.run(Feed)
  console.timeEnd('run')
  setProgress?.(90)

  console.time('postProcess')
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const outsTensor = results[model.outputNames[0]]
  // isnet outputs [1, 1, 1024, 1024] mask
  const maskData = outsTensor.data as Float32Array

  const newImageData = postProcess(maskData, originalImageData, MODEL_SIZE)
  const result = imageDataToDataURL(newImageData)
  console.timeEnd('postProcess')
  setProgress?.(100)

  return result
}

// Function to composite foreground (with transparency) over a background image
export function compositeWithBackground(
  foregroundUrl: string,
  backgroundUrl: string,
  width: number,
  height: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Unable to get canvas context'))
      return
    }

    Promise.all([loadImage(foregroundUrl), loadImage(backgroundUrl)])
      .then(([foregroundImg, backgroundImg]) => {
        // Draw background first (scaled to fit)
        ctx.drawImage(backgroundImg, 0, 0, width, height)

        // Draw foreground on top
        ctx.drawImage(foregroundImg, 0, 0, width, height)

        resolve(canvas.toDataURL())
      })
      .catch(reject)
  })
}
