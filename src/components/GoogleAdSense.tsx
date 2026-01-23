import { useEffect } from 'react'
import { googleConfig } from '../config/googleConfig'

// Google AdSense Component
export function GoogleAdSense() {
  useEffect(() => {
    if (!googleConfig.adsense.enabled || !googleConfig.adsense.clientId) {
      return
    }

    // Load Google AdSense script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${googleConfig.adsense.clientId}`
    script.crossOrigin = 'anonymous'

    document.head.appendChild(script)

    return () => {
      // Cleanup script when component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return null
}

// Ad Unit Component
interface AdUnitProps {
  adSlot: string
  adFormat?: string
  className?: string
  style?: React.CSSProperties
}

export function AdUnit({
  adSlot,
  adFormat = 'auto',
  className = '',
  style = {},
}: AdUnitProps) {
  useEffect(() => {
    // Initialize the ad after component mounts
    try {
      if (window.adsbygoogle && googleConfig.adsense.enabled) {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [adSlot])

  if (!googleConfig.adsense.enabled) {
    return null
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{
        display: 'block',
        ...style,
      }}
      data-ad-client={googleConfig.adsense.clientId}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive="true"
    />
  )
}

// Extend Window interface for adsbygoogle
declare global {
  interface Window {
    adsbygoogle?: any[]
  }
}

export default GoogleAdSense
