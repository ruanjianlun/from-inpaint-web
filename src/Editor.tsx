/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import {
  DownloadIcon,
  EyeIcon,
  ViewBoardsIcon,
  PhotographIcon,
} from '@heroicons/react/outline'
import { useCallback, useEffect, useState, useRef, useMemo } from 'react'
import { useWindowSize } from 'react-use'
import inpaint from './adapters/inpainting'
import superResolution from './adapters/superResolution'
import removeBackground from './adapters/background-removal'
import Button from './components/Button'
import Slider from './components/Slider'
import { downloadImage, loadImage, useImage } from './utils'
import Progress from './components/Progress'
import { modelExists, downloadModel } from './adapters/cache'
import Modal from './components/Modal'
import * as m from './paraglide/messages'

interface EditorProps {
  file: File
}

interface Line {
  size?: number
  pts: { x: number; y: number }[]
  src: string
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: Line[],
  color = 'rgba(255, 0, 0, 0.5)'
) {
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  lines.forEach(line => {
    if (!line?.pts.length || !line.size) {
      return
    }
    ctx.lineWidth = line.size
    ctx.beginPath()
    ctx.moveTo(line.pts[0].x, line.pts[0].y)
    line.pts.forEach(pt => ctx.lineTo(pt.x, pt.y))
    ctx.stroke()
  })
}

const BRUSH_HIDE_ON_SLIDER_CHANGE_TIMEOUT = 2000
export default function Editor(props: EditorProps) {
  const { file } = props
  const [brushSize, setBrushSize] = useState(40)
  const [original, isOriginalLoaded] = useImage(file)
  const [renders, setRenders] = useState<HTMLImageElement[]>([])
  const [context, setContext] = useState<CanvasRenderingContext2D>()
  const [maskCanvas] = useState<HTMLCanvasElement>(() => {
    return document.createElement('canvas')
  })
  const [lines, setLines] = useState<Line[]>([{ pts: [], src: '' }])
  const brushRef = useRef<HTMLDivElement>(null)
  const [showBrush, setShowBrush] = useState(false)
  const [hideBrushTimeout, setHideBrushTimeout] = useState(0)
  const [showOriginal, setShowOriginal] = useState(false)
  const [isInpaintingLoading, setIsProcessingLoading] = useState(false)
  const [generateProgress, setGenerateProgress] = useState(0)
  const modalRef = useRef(null)
  const [separator, setSeparator] = useState<HTMLDivElement>()
  const [useSeparator, setUseSeparator] = useState(false)
  const [originalImg, setOriginalImg] = useState<HTMLDivElement>()
  const [separatorLeft, setSeparatorLeft] = useState(0)
  const [beforeBgRemoval, setBeforeBgRemoval] =
    useState<HTMLImageElement | null>(null)
  const historyListRef = useRef<HTMLDivElement>(null)
  const isBrushSizeChange = useRef<boolean>(false)
  const scaledBrushSize = useMemo(() => brushSize, [brushSize])
  const canvasDiv = useRef<HTMLDivElement>(null)
  const [downloaded, setDownloaded] = useState(true)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const windowSize = useWindowSize()
  const [showAddBackground, setShowAddBackground] = useState(false)
  const backgroundInputRef = useRef<HTMLInputElement>(null)

  // Foreground layer editing state
  const [isEditingForeground, setIsEditingForeground] = useState(false)
  const [foregroundPosition, setForegroundPosition] = useState({ x: 0, y: 0 })
  const [foregroundScale, setForegroundScale] = useState(1)
  const [foregroundImage, setForegroundImage] =
    useState<HTMLImageElement | null>(null)
  const [backgroundImage, setBackgroundImage] =
    useState<HTMLImageElement | null>(null)
  const [isDraggingForeground, setIsDraggingForeground] = useState(false)
  const [isScalingForeground, setIsScalingForeground] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const draw = useCallback(
    (index = -1) => {
      if (!context) {
        return
      }
      context.clearRect(0, 0, context.canvas.width, context.canvas.height)
      const currRender =
        renders[index === -1 ? renders.length - 1 : index] ?? original
      const { canvas } = context

      const divWidth = canvasDiv.current!.offsetWidth
      const divHeight = canvasDiv.current!.offsetHeight

      // 计算宽高比
      const imgAspectRatio = currRender.width / currRender.height
      const divAspectRatio = divWidth / divHeight

      let canvasWidth
      let canvasHeight

      // 比较宽高比以决定如何缩放
      if (divAspectRatio > imgAspectRatio) {
        // div 较宽，基于高度缩放
        canvasHeight = divHeight
        canvasWidth = currRender.width * (divHeight / currRender.height)
      } else {
        // div 较窄，基于宽度缩放
        canvasWidth = divWidth
        canvasHeight = currRender.height * (divWidth / currRender.width)
      }

      canvas.width = canvasWidth
      canvas.height = canvasHeight

      if (currRender?.src) {
        context.drawImage(currRender, 0, 0, canvas.width, canvas.height)
      } else {
        context.drawImage(original, 0, 0, canvas.width, canvas.height)
      }
      const currentLine = lines[lines.length - 1]
      drawLines(context, [currentLine])
    },
    [context, lines, original, renders]
  )

  const refreshCanvasMask = useCallback(() => {
    if (!context?.canvas.width || !context?.canvas.height) {
      throw new Error('canvas has invalid size')
    }
    maskCanvas.width = context?.canvas.width
    maskCanvas.height = context?.canvas.height
    const ctx = maskCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('could not retrieve mask canvas')
    }
    // Just need the finishing touch
    const line = lines.slice(-1)[0]
    if (line) drawLines(ctx, [line], 'white')
  }, [context?.canvas.height, context?.canvas.width, lines, maskCanvas])

  // Draw once the original image is loaded
  useEffect(() => {
    if (!context?.canvas) {
      return
    }
    if (isOriginalLoaded) {
      draw()
    }
  }, [context?.canvas, draw, original, isOriginalLoaded, windowSize])

  // Handle mouse interactions
  useEffect(() => {
    const canvas = context?.canvas
    if (!canvas) {
      return
    }
    const onMouseMove = (ev: MouseEvent) => {
      if (brushRef.current) {
        const x = ev.pageX - scaledBrushSize / 2
        const y = ev.pageY - scaledBrushSize / 2

        brushRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      }
    }
    const onPaint = (px: number, py: number) => {
      const currLine = lines[lines.length - 1]
      currLine.pts.push({ x: px, y: py })
      draw()
    }
    const onMouseDrag = (ev: MouseEvent) => {
      const px = ev.offsetX - canvas.offsetLeft
      const py = ev.offsetY - canvas.offsetTop
      onPaint(px, py)
    }

    const onPointerUp = async () => {
      if (!original.src || showOriginal) {
        return
      }
      if (lines.slice(-1)[0]?.pts.length === 0) {
        return
      }
      const loading = onloading()
      canvas.removeEventListener('mousemove', onMouseDrag)
      canvas.removeEventListener('mouseup', onPointerUp)
      refreshCanvasMask()
      try {
        const start = Date.now()
        console.log('inpaint_start')
        // each time based on the last result, the first is the original
        const newFile = renders.slice(-1)[0] ?? file
        const res = await inpaint(newFile, maskCanvas.toDataURL())
        if (!res) {
          throw new Error('empty response')
        }
        // TODO: fix the render if it failed loading
        const newRender = new Image()
        newRender.dataset.id = Date.now().toString()
        await loadImage(newRender, res)
        renders.push(newRender)
        lines.push({ pts: [], src: '' } as Line)
        setRenders([...renders])
        setLines([...lines])
        console.log('inpaint_processed', {
          duration: Date.now() - start,
        })
      } catch (e: any) {
        console.log('inpaint_failed', {
          error: e,
        })
        // eslint-disable-next-line
        alert(e.message ? e.message : e.toString())
      }
      if (historyListRef.current) {
        const { scrollWidth, clientWidth } = historyListRef.current
        if (scrollWidth > clientWidth) {
          historyListRef.current.scrollTo(scrollWidth, 0)
        }
      }
      loading.close()
      draw()
    }
    canvas.addEventListener('mousemove', onMouseMove)

    const onTouchMove = (ev: TouchEvent) => {
      ev.preventDefault()
      ev.stopPropagation()
      const currLine = lines[lines.length - 1]
      const coords = canvas.getBoundingClientRect()
      currLine.pts.push({
        x: ev.touches[0].clientX - coords.x,
        y: ev.touches[0].clientY - coords.y,
      })
      draw()
    }
    const onPointerStart = () => {
      // Disable painting when editing foreground
      if (isEditingForeground) {
        return
      }
      if (!original.src || showOriginal) {
        return
      }
      const currLine = lines[lines.length - 1]
      currLine.size = brushSize
      canvas.addEventListener('mousemove', onMouseDrag)
      canvas.addEventListener('mouseup', onPointerUp)
      // onPaint(e)
    }

    canvas.addEventListener('touchstart', onPointerStart)
    canvas.addEventListener('touchmove', onTouchMove)
    canvas.addEventListener('touchend', onPointerUp)
    canvas.onmouseenter = () => {
      // Don't show brush when editing foreground
      if (isEditingForeground) {
        return
      }
      window.clearTimeout(hideBrushTimeout)
      setShowBrush(true && !showOriginal)
    }
    canvas.onmouseleave = () => setShowBrush(false)
    canvas.onmousedown = onPointerStart

    return () => {
      canvas.removeEventListener('mousemove', onMouseDrag)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onPointerUp)
      canvas.removeEventListener('touchstart', onPointerStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onPointerUp)
      canvas.onmouseenter = null
      canvas.onmouseleave = null
      canvas.onmousedown = null
    }
  }, [
    brushSize,
    context,
    file,
    draw,
    lines,
    refreshCanvasMask,
    maskCanvas,
    original.src,
    renders,
    showOriginal,
    hideBrushTimeout,
    isEditingForeground,
  ])

  useEffect(() => {
    if (!separator || !originalImg) return

    const separatorMove = (ev: MouseEvent) => {
      ev.preventDefault()
      ev.stopPropagation()
      if (context?.canvas) {
        const { width } = context?.canvas
        const canvasRect = context?.canvas.getBoundingClientRect()
        const separatorOffsetLeft = ev.pageX - canvasRect.left
        if (separatorOffsetLeft <= width && separatorOffsetLeft >= 0) {
          setSeparatorLeft(separatorOffsetLeft)
        } else if (separatorOffsetLeft < 0) {
          setSeparatorLeft(0)
        } else if (separatorOffsetLeft > width) {
          setSeparatorLeft(width)
        }
      }
    }

    const separatorDown = () => {
      window.addEventListener('mousemove', separatorMove)
      setUseSeparator(true)
    }

    const separatorUp = () => {
      window.removeEventListener('mousemove', separatorMove)
      setUseSeparator(false)
    }

    separator.addEventListener('mousedown', separatorDown)
    window.addEventListener('mouseup', separatorUp)

    return () => {
      separator.removeEventListener('mousedown', separatorDown)
      window.removeEventListener('mouseup', separatorUp)
    }
  }, [separator, context])

  function download() {
    const currRender = renders.at(-1) ?? original
    downloadImage(currRender.currentSrc, 'IMG')
  }

  // Render foreground editing layer
  const renderForegroundLayer = useCallback(() => {
    if (!context || !backgroundImage || !foregroundImage) return

    const { canvas } = context
    const ctx = context

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate canvas size to fit both images
    const bgRatio = backgroundImage.width / backgroundImage.height
    const divWidth = canvasDiv.current!.offsetWidth
    const divHeight = canvasDiv.current!.offsetHeight
    const divRatio = divWidth / divHeight

    let canvasWidth
    let canvasHeight
    if (divRatio > bgRatio) {
      canvasHeight = divHeight
      canvasWidth = backgroundImage.width * (divHeight / backgroundImage.height)
    } else {
      canvasWidth = divWidth
      canvasHeight = backgroundImage.height * (divWidth / backgroundImage.width)
    }

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // Draw background
    ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight)

    // Draw foreground with scale and position
    const fgWidth = foregroundImage.width * foregroundScale
    const fgHeight = foregroundImage.height * foregroundScale
    ctx.drawImage(
      foregroundImage,
      foregroundPosition.x,
      foregroundPosition.y,
      fgWidth,
      fgHeight
    )

    // Draw selection border and controls
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.strokeRect(
      foregroundPosition.x,
      foregroundPosition.y,
      fgWidth,
      fgHeight
    )

    // Draw resize handle (bottom-right corner)
    const handleSize = 12
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(
      foregroundPosition.x + fgWidth - handleSize / 2,
      foregroundPosition.y + fgHeight - handleSize / 2,
      handleSize,
      handleSize
    )

    // Draw center circle for dragging
    ctx.beginPath()
    ctx.arc(
      foregroundPosition.x + fgWidth / 2,
      foregroundPosition.y + fgHeight / 2,
      8,
      0,
      2 * Math.PI
    )
    ctx.fillStyle = 'rgba(59, 130, 246, 0.5)'
    ctx.fill()
    ctx.strokeStyle = '#3b82f6'
    ctx.stroke()
  }, [
    context,
    backgroundImage,
    foregroundImage,
    foregroundPosition,
    foregroundScale,
    canvasDiv,
  ])

  // Handle foreground editing interactions
  useEffect(() => {
    if (!isEditingForeground || !context) return

    const { canvas } = context
    if (!canvas) return

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const fgWidth = foregroundImage!.width * foregroundScale
      const fgHeight = foregroundImage!.height * foregroundScale
      const handleSize = 12

      // Check if clicking on resize handle (bottom-right corner)
      if (
        x >= foregroundPosition.x + fgWidth - handleSize &&
        x <= foregroundPosition.x + fgWidth + handleSize &&
        y >= foregroundPosition.y + fgHeight - handleSize &&
        y <= foregroundPosition.y + fgHeight + handleSize
      ) {
        e.stopPropagation() // Prevent painting
        setIsScalingForeground(true)
        setDragStart({ x: e.clientX, y: e.clientY })
        return
      }

      // Check if clicking inside foreground image
      if (
        x >= foregroundPosition.x &&
        x <= foregroundPosition.x + fgWidth &&
        y >= foregroundPosition.y &&
        y <= foregroundPosition.y + fgHeight
      ) {
        e.stopPropagation() // Prevent painting
        setIsDraggingForeground(true)
        setDragStart({
          x: e.clientX - foregroundPosition.x,
          y: e.clientY - foregroundPosition.y,
        })
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingForeground) {
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Keep foreground within canvas bounds
        const fgWidth = foregroundImage!.width * foregroundScale
        const fgHeight = foregroundImage!.height * foregroundScale
        const canvasWidth = canvas.width
        const canvasHeight = canvas.height

        let newX = e.clientX - dragStart.x
        let newY = e.clientY - dragStart.y

        // Constrain to canvas bounds
        newX = Math.max(0, Math.min(newX, canvasWidth - fgWidth))
        newY = Math.max(0, Math.min(newY, canvasHeight - fgHeight))

        setForegroundPosition({ x: newX, y: newY })
        renderForegroundLayer()
      } else if (isScalingForeground) {
        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y
        const delta = Math.max(dx, dy)

        const newScale = Math.max(
          0.1,
          Math.min(3, foregroundScale + delta * 0.01)
        )
        setForegroundScale(newScale)
        setDragStart({ x: e.clientX, y: e.clientY })
        renderForegroundLayer()
      }
    }

    const handleMouseUp = () => {
      setIsDraggingForeground(false)
      setIsScalingForeground(false)
    }

    // Use capture phase to ensure this handler runs before the painting handler
    canvas.addEventListener('mousedown', handleMouseDown, { capture: true })
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    renderForegroundLayer()

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown, {
        capture: true,
      } as any)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [
    isEditingForeground,
    context,
    foregroundImage,
    foregroundPosition,
    foregroundScale,
    isDraggingForeground,
    isScalingForeground,
    dragStart,
    renderForegroundLayer,
  ])

  // Confirm foreground editing
  const confirmForegroundEdit = useCallback(async () => {
    if (!context || !backgroundImage || !foregroundImage) return

    setIsProcessingLoading(true)
    try {
      const { canvas } = context

      // Create final composite
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = backgroundImage.width
      tempCanvas.height = backgroundImage.height
      const tempCtx = tempCanvas.getContext('2d')

      if (!tempCtx) {
        throw new Error('Unable to get canvas context')
      }

      // Draw background at original size
      tempCtx.drawImage(backgroundImage, 0, 0)

      // Calculate scale factors
      const scaleX = backgroundImage.width / canvas.width
      const scaleY = backgroundImage.height / canvas.height

      // Draw foreground at correct position and scale
      const fgWidth = foregroundImage.width * foregroundScale * scaleX
      const fgHeight = foregroundImage.height * foregroundScale * scaleY
      const fgX = foregroundPosition.x * scaleX
      const fgY = foregroundPosition.y * scaleY

      tempCtx.drawImage(foregroundImage, fgX, fgY, fgWidth, fgHeight)

      // Convert to image
      const result = tempCanvas.toDataURL('image/png')

      // Create new render
      const newRender = new Image()
      newRender.dataset.id = Date.now().toString()
      await loadImage(newRender, result)

      renders.push(newRender)
      lines.push({ pts: [], src: '' } as Line)
      setRenders([...renders])
      setLines([...lines])

      // Exit editing mode
      setIsEditingForeground(false)
      setForegroundImage(null)
      setBackgroundImage(null)
      setBeforeBgRemoval(null) // Clear the before image

      // Redraw canvas
      draw()

      console.log('Foreground editing confirmed')
    } catch (error) {
      console.error('confirmForegroundEdit', error)
    } finally {
      setIsProcessingLoading(false)
    }
  }, [
    context,
    backgroundImage,
    foregroundImage,
    foregroundPosition,
    foregroundScale,
    renders,
    lines,
    draw,
  ])

  // Cancel foreground editing
  const cancelForegroundEdit = useCallback(() => {
    setIsEditingForeground(false)
    setForegroundImage(null)
    setBackgroundImage(null)
    draw()
    console.log('Foreground editing cancelled')
  }, [draw])

  const undo = useCallback(async () => {
    const l = lines
    l.pop()
    l.pop()
    setLines([...l, { pts: [], src: '' }])
    const r = renders
    r.pop()
    setRenders([...r])
  }, [lines, renders])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!renders.length) {
        return
      }
      const isCmdZ = (event.metaKey || event.ctrlKey) && event.key === 'z'
      if (isCmdZ) {
        event.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [renders, undo])

  const backTo = useCallback(
    (index: number) => {
      lines.splice(index + 1)
      setLines([...lines, { pts: [], src: '' }])
      renders.splice(index + 1)
      setRenders([...renders])
    },
    [renders, lines]
  )

  const History = useMemo(
    () =>
      renders.map((render, index) => {
        return (
          <div
            key={render.dataset.id}
            style={{
              position: 'relative',
              display: 'inline-block',
              flexShrink: 0,
            }}
          >
            <img
              src={render.src}
              alt="render"
              className="rounded-sm"
              style={{
                height: '50px',
              }}
            />
            <Button
              className="hover:opacity-100 opacity-0 cursor-pointer rounded-sm"
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => backTo(index)}
              onEnter={() => draw(index)}
              onLeave={draw}
            >
              <div
                style={{
                  color: '#fff',
                  fontSize: '12px',
                  textAlign: 'center',
                }}
              >
                Back
                <br />
                here
              </div>
            </Button>
          </div>
        )
      }),
    [renders, backTo]
  )

  const handleSliderStart = () => {
    setShowBrush(true)
  }
  const handleSliderChange = (sliderValue: number) => {
    if (!isBrushSizeChange.current) {
      isBrushSizeChange.current = true
    }
    if (brushRef.current) {
      const x = document.documentElement.clientWidth / 2 - scaledBrushSize / 2
      const y = document.documentElement.clientHeight / 2 - scaledBrushSize / 2

      brushRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }
    setBrushSize(sliderValue)
    window.clearTimeout(hideBrushTimeout)
    setHideBrushTimeout(
      window.setTimeout(() => {
        setShowBrush(false)
      }, BRUSH_HIDE_ON_SLIDER_CHANGE_TIMEOUT)
    )
  }

  const onloading = useCallback(() => {
    setIsProcessingLoading(true)
    setGenerateProgress(0)
    const progressTimer = window.setInterval(() => {
      setGenerateProgress(p => {
        if (p < 90) return p + 10 * Math.random()
        if (p >= 90 && p < 99) return p + 1 * Math.random()
        // Do not hide the progress bar after 99%,cause sometimes long time progress
        // window.setTimeout(() => setIsInpaintingLoading(false), 500)
        return p
      })
    }, 1000)
    return {
      close: () => {
        clearInterval(progressTimer)
        setGenerateProgress(100)
        setIsProcessingLoading(false)
      },
    }
  }, [])

  const onSuperResolution = useCallback(async () => {
    if (!(await modelExists('superResolution'))) {
      setDownloaded(false)
      await downloadModel('superResolution', setDownloadProgress)
      setDownloaded(true)
    }
    setIsProcessingLoading(true)
    try {
      // 运行
      const start = Date.now()
      console.log('superResolution_start')
      // each time based on the last result, the first is the original
      const newFile = renders.at(-1) ?? file
      const res = await superResolution(newFile, setGenerateProgress)
      if (!res) {
        throw new Error('empty response')
      }
      // TODO: fix the render if it failed loading
      const newRender = new Image()
      newRender.dataset.id = Date.now().toString()
      await loadImage(newRender, res)
      renders.push(newRender)
      lines.push({ pts: [], src: '' } as Line)
      setRenders([...renders])
      setLines([...lines])
      console.log('superResolution_processed', {
        duration: Date.now() - start,
      })
    } catch (error) {
      console.error('superResolution', error)
    } finally {
      setIsProcessingLoading(false)
    }
  }, [file, lines, original.naturalHeight, original.naturalWidth, renders])

  const onRemoveBackground = useCallback(async () => {
    console.log('[onRemoveBackground] Function called')
    try {
      const modelExistsResult = await modelExists('backgroundRemoval')
      console.log('[onRemoveBackground] Model exists:', modelExistsResult)

      if (!modelExistsResult) {
        console.log('[onRemoveBackground] Starting model download...')
        setDownloaded(false)
        await downloadModel('backgroundRemoval', setDownloadProgress)
        setDownloaded(true)
        console.log('[onRemoveBackground] Model download completed')
      }

      // Store the image before background removal for comparison
      const currentImg = renders.at(-1) ?? original
      console.log(
        '[onRemoveBackground] Before image stored:',
        currentImg?.src?.substring(0, 50) || 'undefined'
      )
      setBeforeBgRemoval(currentImg)

      setIsProcessingLoading(true)
      console.log(
        '[onRemoveBackground] Starting background removal processing...'
      )
      const start = Date.now()
      console.log('removeBackground_start')
      const currentFile = renders.at(-1) ?? file
      const res = await removeBackground(currentFile, setGenerateProgress)
      console.log(
        '[onRemoveBackground] Background removal result received:',
        res ? 'success' : 'empty'
      )
      if (!res) {
        throw new Error('empty response')
      }
      const newRender = new Image()
      newRender.dataset.id = Date.now().toString()
      await loadImage(newRender, res)
      renders.push(newRender)
      lines.push({ pts: [], src: '' } as Line)
      setRenders([...renders])
      setLines([...lines])
      setShowAddBackground(true)
      console.log('removeBackground_processed', {
        duration: Date.now() - start,
      })
      console.log('[onRemoveBackground] Process completed successfully')
    } catch (error) {
      console.error('[onRemoveBackground] Error occurred:', error)
      console.error('removeBackground', error)
      throw error
    } finally {
      setIsProcessingLoading(false)
    }
  }, [file, lines, renders, original])

  const onAddBackground = useCallback(
    async (backgroundFile: File) => {
      setIsProcessingLoading(true)
      try {
        const start = Date.now()
        console.log('addBackground_start')
        const currentImg = renders.at(-1)
        if (!currentImg) {
          throw new Error('No image to add background to')
        }

        // Load background image
        const bgImg = new Image()
        await loadImage(bgImg, URL.createObjectURL(backgroundFile))

        // Enter editing mode
        setForegroundImage(currentImg)
        setBackgroundImage(bgImg)
        setIsEditingForeground(true)
        setShowAddBackground(false)

        // Calculate initial position (center the foreground)
        const canvasWidth = context?.canvas.width || bgImg.width
        const canvasHeight = context?.canvas.height || bgImg.height
        const x = (canvasWidth - currentImg.width * 0.5) / 2
        const y = (canvasHeight - currentImg.height * 0.5) / 2
        setForegroundPosition({ x, y })
        setForegroundScale(0.5) // Start at 50% scale

        console.log('addBackground_enter_edit_mode', {
          duration: Date.now() - start,
        })
      } catch (error) {
        console.error('addBackground', error)
        throw error
      } finally {
        setIsProcessingLoading(false)
      }
    },
    [lines, renders, context]
  )

  const handleBackgroundInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const bgFile = e.target.files?.[0]
      if (bgFile) {
        await onAddBackground(bgFile)
      }
      // Reset input
      if (backgroundInputRef.current) {
        backgroundInputRef.current.value = ''
      }
    },
    [onAddBackground]
  )

  return (
    <div
      className={[
        'flex flex-col items-center h-full w-full overflow-hidden',
        isInpaintingLoading ? 'animate-pulse-fast pointer-events-none' : '',
      ].join(' ')}
    >
      {/* History */}
      <div
        ref={historyListRef}
        className={[
          'flex-shrink-0',
          'border-b border-gray-700 bg-gray-800',
          'flex items-center w-full overflow-x-auto',
          'px-2',
        ].join(' ')}
        style={{ height: '60px' }}
      >
        <div className="flex gap-2">{History}</div>
      </div>
      {/* 画图 */}
      <div
        className={[
          'flex-1',
          'flex justify-center items-center',
          'relative',
          'w-full overflow-hidden',
        ].join(' ')}
        ref={canvasDiv}
      >
        <div className="relative">
          <canvas
            className="rounded-sm"
            style={showBrush ? { cursor: 'none' } : {}}
            ref={r => {
              if (r && !context) {
                const ctx = r.getContext('2d')
                if (ctx) {
                  setContext(ctx)
                }
              }
            }}
          />
          <div
            className={[
              'absolute top-0 right-0 pointer-events-none',
              showOriginal ? '' : 'overflow-hidden',
            ].join(' ')}
            style={{
              width: showOriginal ? `${context?.canvas.width}px` : '0px',
              height: context?.canvas.height,
              transitionProperty: 'width, height',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDuration: '300ms',
            }}
            ref={r => {
              if (r && !originalImg) {
                setOriginalImg(r)
              }
            }}
          >
            <div
              className={[
                'absolute top-0 right-0 pointer-events-none z-10',
                useSeparator ? 'bg-black text-white' : 'bg-primary ',
                'w-1',
                'flex items-center justify-center',
                'separator',
              ].join(' ')}
              style={{
                left: `${separatorLeft}px`,
                height: context?.canvas.height,
                transitionProperty: 'width, height',
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                transitionDuration: '300ms',
              }}
            >
              <span className="absolute left-1 bottom-0 p-1 bg-opacity-25 bg-black rounded text-white select-none">
                {beforeBgRemoval ? 'before' : 'original'}
              </span>
              <div
                className={[
                  'absolute py-2 px-1 rounded-md pointer-events-auto',
                  useSeparator ? 'bg-black' : 'bg-primary ',
                ].join(' ')}
                style={{ cursor: 'ew-resize' }}
                ref={r => {
                  if (r && !separator) {
                    setSeparator(r)
                  }
                }}
              >
                <ViewBoardsIcon
                  className="w-5 h-5"
                  style={{ cursor: 'ew-resize' }}
                />
              </div>
            </div>
            <img
              className="absolute right-0"
              src={beforeBgRemoval ? beforeBgRemoval.src : original.src}
              alt={beforeBgRemoval ? 'before bg removal' : 'original'}
              width={`${context?.canvas.width}px`}
              height={`${context?.canvas.height}px`}
              style={{
                width: `${context?.canvas.width}px`,
                height: `${context?.canvas.height}px`,
                maxWidth: 'none',
                clipPath: `inset(0 0 0 ${separatorLeft}px)`,
              }}
            />
          </div>
          {isInpaintingLoading && (
            <div className="z-10 bg-gray-800 absolute bg-opacity-90 top-0 left-0 right-0 bottom-0  h-full w-full flex justify-center items-center">
              <div
                ref={modalRef}
                className="text-xl space-y-5 w-4/5 sm:w-1/2 text-white"
              >
                <p>Processing, please be patient...</p>
                <Progress percent={generateProgress} />
              </div>
            </div>
          )}
        </div>
      </div>

      {!downloaded && (
        <Modal>
          <div className="text-xl space-y-5">
            <p>{m.upscaleing_model_download_message()}</p>
            <Progress percent={downloadProgress} />
          </div>
        </Modal>
      )}
      {showBrush && (
        <div
          className="fixed rounded-full bg-red-500 bg-opacity-50 pointer-events-none left-0 top-0"
          style={{
            width: `${scaledBrushSize}px`,
            height: `${scaledBrushSize}px`,
            transform: `translate3d(-100px, -100px, 0)`,
          }}
          ref={brushRef}
        />
      )}
      {/* 工具栏 */}
      <div
        className={[
          'flex-shrink-0',
          'bg-gray-800 border-t border-gray-700',
          'flex items-center justify-center w-full',
          'px-2 py-2 gap-2 sm:gap-4 flex-wrap',
        ].join(' ')}
        style={{ height: '60px' }}
      >
        {isEditingForeground ? (
          <>
            <Button
              primary
              onUp={confirmForegroundEdit}
              icon={<DownloadIcon className="w-6 h-6" />}
            >
              Confirm
            </Button>
            <Button onUp={cancelForegroundEdit}>Cancel</Button>
            <div className="text-white text-sm">
              Drag to move • Corner handle to resize • Scale:{' '}
              {Math.round(foregroundScale * 100)}%
            </div>
          </>
        ) : (
          <>
            {renders.length > 0 && (
              <Button
                primary
                onClick={undo}
                icon={
                  <svg
                    className="w-6 h-6"
                    width="19"
                    height="9"
                    viewBox="0 0 19 9"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 1C2 0.447715 1.55228 0 1 0C0.447715 0 0 0.447715 0 1H2ZM1 8H0V9H1V8ZM8 9C8.55228 9 9 8.55229 9 8C9 7.44771 8.55228 7 8 7V9ZM16.5963 7.42809C16.8327 7.92721 17.429 8.14016 17.9281 7.90374C18.4272 7.66731 18.6402 7.07103 18.4037 6.57191L16.5963 7.42809ZM16.9468 5.83205L17.8505 5.40396L16.9468 5.83205ZM0 1V8H2V1H0ZM1 9H8V7H1V9ZM1.66896 8.74329L6.66896 4.24329L5.33104 2.75671L0.331035 7.25671L1.66896 8.74329ZM16.043 6.26014L16.5963 7.42809L18.4037 6.57191L17.8505 5.40396L16.043 6.26014ZM6.65079 4.25926C9.67554 1.66661 14.3376 2.65979 16.043 6.26014L17.8505 5.40396C15.5805 0.61182 9.37523 -0.710131 5.34921 2.74074L6.65079 4.25926Z"
                      fill="currentColor"
                    />
                  </svg>
                }
              >
                {m.undo()}
              </Button>
            )}
            <Slider
              label={m.bruch_size()}
              min={10}
              max={200}
              value={brushSize}
              onChange={handleSliderChange}
              onStart={handleSliderStart}
            />
            <Button
              primary={showOriginal}
              icon={<EyeIcon className="w-6 h-6" />}
              onUp={() => {
                setShowOriginal(!showOriginal)
                setTimeout(() => setSeparatorLeft(0), 300)
              }}
            >
              {m.original()}
            </Button>
            {!showOriginal && (
              <Button onUp={onSuperResolution}>{m.upscale()}</Button>
            )}

            {!showOriginal && (
              <Button onUp={onRemoveBackground}>{m.remove_background()}</Button>
            )}

            {showAddBackground && !showOriginal && (
              <>
                <input
                  ref={backgroundInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundInputChange}
                  className="hidden"
                />
                <Button
                  onUp={() => backgroundInputRef.current?.click()}
                  icon={<PhotographIcon className="w-6 h-6" />}
                >
                  {m.add_background()}
                </Button>
              </>
            )}

            <Button
              primary
              icon={<DownloadIcon className="w-6 h-6" />}
              onClick={download}
            >
              {m.download()}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
