# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Inpaint-web is a free and open-source browser-based image inpainting and upscaling tool. It runs entirely in the browser using WebGPU and WebAssembly - no server-side processing.

**Tech Stack**: React 17, TypeScript, Vite, WebGPU, ONNX Runtime, OpenCV (opencv-ts), Tailwind CSS

## Development Commands

```bash
npm install          # Install dependencies (auto-downloads ML models via postinstall)
npm run start        # Start dev server with hot reload (uses --host flag)
npm run fast-build   # Quick build without TypeScript checking
npm run build        # Full production build (TypeScript check + Vite build)
npm run serve        # Preview production build
npm run format       # Format code with Prettier
npm run paraglide    # Compile i18n messages
npm test             # Run Vitest tests
```

## Architecture

### Core ML Processing (`src/adapters/`)

The ML inference layer is separated into:

- **`cache.ts`**: Model downloading and caching using IndexedDB via localforage. Models are fetched from HuggingFace with backup URLs. Supports `inpaint` and `superResolution` model types.
- **`inpainting.ts`**: Inpainting pipeline using MI-GAN model. Uses OpenCV for image preprocessing (RGBA→RGB conversion, CHW tensor formatting) and ONNX Runtime WebGPU for inference.
- **`superResolution.ts`**: Super-resolution pipeline using Real-ESRGAN model.
- **`util.ts`**: WebGPU capability detection and inference utilities.

### Image Processing Pipeline

1. User uploads image → drawn mask created on canvas
2. OpenCV preprocesses image and mask into CHW tensor format
3. ONNX Runtime with WebGPU backend runs model inference
4. Post-processed result rendered back to canvas
5. History stack tracks modifications for undo/redo

### UI Components (`src/components/`)

Simple reusable components: Button, FileSelect, Modal, Progress, Slider, Logo, MadeWidthBadge

### Main Application

- **`App.tsx`**: Root component with model download progress, file selection, mode switching (inpaint vs upscaling)
- **`Editor.tsx`**: Canvas-based image editor with zoom/pan, mask drawing, history management

## WebGPU Requirements

The dev server requires specific CORS headers for WebGPU to work (configured in `vite.config.ts`):

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

## Internationalization

Uses @inlang/paraglide-js for i18n. Messages compiled via `npm run paraglide`. Edit messages in the `project.inlang/` directory.

## Linting & Formatting

- ESLint extends `react-app` (Airbnb-based with React/TypeScript rules)
- Prettier auto-runs on pre-commit via husky + lint-staged
- Run `npm run format` to manually format

## Testing

Vitest with jsdom environment. Test setup in `src/setupTests.ts`. Coverage reports output to text/JSON/HTML.

## Model Sources

Models are hosted on HuggingFace:

- Inpainting: `migan_pipeline_v2.onnx` from andraniksargsyan/migan
- Super-resolution: `realesrgan-x4.onnx` from lxfater/inpaint-web
