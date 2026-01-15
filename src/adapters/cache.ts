import localforage from 'localforage'

export type modelType = 'inpaint' | 'superResolution' | 'backgroundRemoval'

localforage.config({
  name: 'modelCache',
})

// Minimum expected sizes for each model (in bytes)
const MIN_MODEL_SIZES = {
  inpaint: 30 * 1024 * 1024, // 30 MB
  superResolution: 70 * 1024 * 1024, // 70 MB
  backgroundRemoval: 170 * 1024 * 1024, // 170 MB
}

export async function saveModel(modelType: modelType, modelBlob: ArrayBuffer) {
  const modelName = getModel(modelType).name
  console.log('[saveModel] Saving model:', modelType, 'as', modelName)
  console.log('[saveModel] Blob size:', modelBlob.byteLength)
  await localforage.setItem(modelName, modelBlob)
  console.log('[saveModel] Model saved successfully')
}

// Clear all model cache
export async function clearAllModelCache() {
  console.log('[clearAllModelCache] Clearing all model cache...')
  await localforage.clear()
  console.log('[clearAllModelCache] All cache cleared')
}

// Clear specific model cache
export async function clearModelCache(modelType: modelType) {
  const modelName = getModel(modelType).name
  console.log('[clearModelCache] Clearing model cache:', modelType, modelName)
  await localforage.removeItem(modelName)
  console.log('[clearModelCache] Model cache cleared')
}

function getModel(modelType: modelType) {
  if (modelType === 'inpaint') {
    const modelList = [
      {
        name: 'model',
        url: 'https://huggingface.co/lxfater/inpaint-web/resolve/main/migan.onnx',
        backupUrl: '',
      },
      {
        name: 'model-perf',
        url: 'https://huggingface.co/andraniksargsyan/migan/resolve/main/migan.onnx',
        backupUrl: '',
      },
      {
        name: 'migan-pipeline-v2',
        url: 'https://huggingface.co/andraniksargsyan/migan/resolve/main/migan_pipeline_v2.onnx',
        backupUrl:
          'https://worker-share-proxy-01f5.lxfater.workers.dev/andraniksargsyan/migan/resolve/main/migan_pipeline_v2.onnx',
      },
    ]
    const currentModel = modelList[2]
    return currentModel
  }
  if (modelType === 'superResolution') {
    const modelList = [
      {
        name: 'realesrgan-x4',
        url: 'https://huggingface.co/lxfater/inpaint-web/resolve/main/realesrgan-x4.onnx',
        backupUrl:
          'https://worker-share-proxy-01f5.lxfater.workers.dev/lxfater/inpaint-web/resolve/main/realesrgan-x4.onnx',
      },
    ]
    const currentModel = modelList[0]
    return currentModel
  }
  if (modelType === 'backgroundRemoval') {
    const modelList = [
      {
        name: 'isnet-general-use',
        // Cloudflare R2 CDN URL
        url: 'https://pub-4482b2c550544992990c2634f2cc43e7.r2.dev/isnet-general-use.onnx',
      },
    ]
    const currentModel = modelList[0]
    return currentModel
  }
  throw new Error('wrong modelType')
}

export async function loadModel(modelType: modelType): Promise<ArrayBuffer> {
  const modelConfig = getModel(modelType)
  console.log('[loadModel] Loading model:', modelType, 'config:', modelConfig)
  const model = (await localforage.getItem(modelConfig.name)) as ArrayBuffer
  console.log(
    '[loadModel] Model loaded from cache:',
    model ? 'success' : 'not found'
  )

  // Validate model size
  if (model && model.byteLength > 0) {
    const minSize = MIN_MODEL_SIZES[modelType]
    console.log(
      '[loadModel] Model size validation:',
      model.byteLength,
      'bytes (minimum expected:',
      minSize,
      'bytes)'
    )

    if (model.byteLength < minSize) {
      console.warn(
        `[loadModel] Model size is too small (${model.byteLength} bytes < ${minSize} bytes). Cache may be corrupted.`
      )
      console.log('[loadModel] Removing corrupted cache...')
      await localforage.removeItem(modelConfig.name)
      throw new Error(`Model cache corrupted: size too small`)
    }
  }

  return model
}

export async function modelExists(modelType: modelType) {
  console.log('[modelExists] Checking if model exists:', modelType)
  try {
    const model = await loadModel(modelType)
    const exists = model !== null && model !== undefined
    console.log('[modelExists] Model exists result:', exists, 'for', modelType)
    return exists
  } catch (error) {
    // If loadModel throws error (e.g., corrupted cache), consider model as not existing
    console.log('[modelExists] Error checking model:', error)
    return false
  }
}

export async function ensureModel(modelType: modelType) {
  console.log('[ensureModel] Ensuring model:', modelType)
  if (await modelExists(modelType)) {
    console.log('[ensureModel] Model exists, loading from cache')
    return loadModel(modelType)
  }
  console.log('[ensureModel] Model does not exist, downloading')
  const model = getModel(modelType)
  console.log('[ensureModel] Fetching from:', model.url)
  const response = await fetch(model.url)
  console.log('[ensureModel] Response status:', response.status)
  const buffer = await response.arrayBuffer()
  console.log('[ensureModel] Buffer size:', buffer.byteLength)
  await saveModel(modelType, buffer)
  console.log('[ensureModel] Model saved')
  return buffer
}

export async function downloadModel(
  modelType: modelType,
  setDownloadProgress: (arg0: number) => void
) {
  console.log('[downloadModel] Starting download for:', modelType)
  if (await modelExists(modelType)) {
    console.log('[downloadModel] Model already exists, skipping download')
    return
  }
  console.log('[downloadModel] Model does not exist, starting download process')

  async function downloadFromUrl(url: string) {
    console.log('[downloadModel] Downloading from URL:', url)
    setDownloadProgress(0)
    const response = await fetch(url)
    console.log(
      '[downloadModel] Response received:',
      response.status,
      response.ok
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const fullSize = response.headers.get('content-length')
    console.log('[downloadModel] Content length:', fullSize)
    const reader = response.body!.getReader()
    const total: Uint8Array[] = []
    let downloaded = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      downloaded += value?.length || 0

      if (value) {
        total.push(value)
      }

      const progress = (downloaded / Number(fullSize)) * 100
      console.log(
        '[downloadModel] Download progress:',
        `${progress.toFixed(2)}%`
      )
      setDownloadProgress(progress)
    }

    const buffer = new Uint8Array(downloaded)
    let offset = 0
    for (const chunk of total) {
      buffer.set(chunk, offset)
      offset += chunk.length
    }

    console.log('[downloadModel] Saving model to cache...')
    await saveModel(modelType, buffer)
    setDownloadProgress(100)
    console.log('[downloadModel] Model saved successfully')
  }

  const model = getModel(modelType)
  console.log('[downloadModel] Model config:', model)
  try {
    await downloadFromUrl(model.url)
    console.log('[downloadModel] Download completed successfully')
  } catch (e) {
    console.error('[downloadModel] Download failed:', e)
    alert(`Failed to download the model, network problem: ${e}`)
  }
}
