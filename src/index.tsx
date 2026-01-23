import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import { loadingOnnxruntime } from './adapters/util'
import GoogleAnalytics from './components/GoogleAnalytics'
import { GoogleAdSense } from './components/GoogleAdSense'

async function main() {
  // Wait for ONNX Runtime to load before rendering
  await loadingOnnxruntime()

  ReactDOM.render(
    <>
      <GoogleAnalytics />
      <GoogleAdSense />
      <App />
    </>,
    document.getElementById('root')
  )
}

main()
