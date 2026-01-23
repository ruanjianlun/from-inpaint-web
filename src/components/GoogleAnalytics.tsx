import { useEffect } from 'react'
import { googleConfig } from '../config/googleConfig'

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, string>
    ) => void
  }
}

export function GoogleAnalytics() {
  useEffect(() => {
    if (
      !googleConfig.analytics.enabled ||
      !googleConfig.analytics.measurementId
    ) {
      return
    }

    // Initialize gtag
    const script = document.createElement('script')
    script.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${googleConfig.analytics.measurementId}');
    `
    document.head.appendChild(script)

    // Load Google Analytics script using fetch to avoid COEP issues
    fetch(
      `https://www.googletagmanager.com/gtag/js?id=${googleConfig.analytics.measurementId}`
    )
      .then(response => response.text())
      .then(scriptText => {
        const gaScript = document.createElement('script')
        gaScript.text = scriptText
        document.head.appendChild(gaScript)
      })
      .catch(err => {
        console.warn('[GoogleAnalytics] Failed to load GA script:', err)
      })

    return () => {
      // Cleanup scripts when component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return null
}

// Hook to track page views
export function usePageView(path: string) {
  useEffect(() => {
    if (!googleConfig.analytics.enabled || !window.gtag) {
      return
    }
    window.gtag('config', googleConfig.analytics.measurementId!, {
      page_path: path,
    })
  }, [path])
}

// Hook to track events
export function useEventTracking() {
  const trackEvent = (
    eventName: string,
    parameters?: Record<string, string>
  ) => {
    if (!googleConfig.analytics.enabled || !window.gtag) {
      return
    }
    window.gtag('event', eventName, parameters)
  }

  return { trackEvent }
}

export default GoogleAnalytics
