import { useState, useEffect } from 'react'
import { XIcon } from '@heroicons/react/outline'
import { cookieConsentConfig } from '../config/googleConfig'

// Consent types
export type ConsentType = 'essential' | 'analytics' | 'ads'

// Consent state interface
interface ConsentState {
  essential: boolean // Always true - required for site to function
  analytics: boolean
  ads: boolean
}

// Default consent state (everything enabled for simplicity)
const defaultConsent: ConsentState = {
  essential: true,
  analytics: true,
  ads: true,
}

// Cookie consent utility functions
function setCookie(name: string, value: string, days: number) {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = `expires=${date.toUTCString()}`
  document.cookie = `${name}=${value};${expires};path=/`
}

function getCookie(name: string): string | null {
  const nameEQ = `${name}=`
  const cookies = document.cookie.split(';')
  for (let i = 0; i < cookies.length; i += 1) {
    let cookie = cookies[i]
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length)
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length)
    }
  }
  return null
}

// Parse consent from cookie
function parseConsentCookie(): ConsentState | null {
  const cookieValue = getCookie(cookieConsentConfig.cookieName)
  if (!cookieValue) {
    return null
  }
  try {
    return JSON.parse(cookieValue) as ConsentState
  } catch {
    return null
  }
}

// Save consent to cookie
function saveConsent(consent: ConsentState) {
  setCookie(
    cookieConsentConfig.cookieName,
    JSON.stringify(consent),
    cookieConsentConfig.cookieExpiryDays
  )
}

// Update Google consent based on user choices
function updateGoogleConsent(consent: ConsentState) {
  if (window.gtag) {
    // Send consent update to Google
    const consentSettings = {
      analytics_storage: consent.analytics ? 'granted' : 'denied',
      ad_storage: consent.ads ? 'granted' : 'denied',
      ad_user_data: consent.ads ? 'granted' : 'denied',
      ad_personalization: consent.ads ? 'granted' : 'denied',
    }
    window.gtag('consent', 'update', consentSettings)
  }
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      config?: Record<string, string>
    ) => void
  }
}

interface CookieConsentProps {
  onConsentChange?: (consent: ConsentState) => void
}

export default function CookieConsent({ onConsentChange }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [consent, setConsent] = useState<ConsentState>(defaultConsent)

  // Check for existing consent on mount
  useEffect(() => {
    const savedConsent = parseConsentCookie()
    if (savedConsent) {
      // Consent already given, just update Google
      setConsent(savedConsent)
      updateGoogleConsent(savedConsent)
    } else {
      // No consent found, show the banner
      setIsVisible(true)
    }
  }, [])

  const handleAcceptAll = () => {
    const newConsent: ConsentState = {
      essential: true,
      analytics: true,
      ads: true,
    }
    setConsent(newConsent)
    saveConsent(newConsent)
    updateGoogleConsent(newConsent)
    setIsVisible(false)
    onConsentChange?.(newConsent)
  }

  const handleAcceptEssential = () => {
    const newConsent: ConsentState = {
      essential: true,
      analytics: false,
      ads: false,
    }
    setConsent(newConsent)
    saveConsent(newConsent)
    updateGoogleConsent(newConsent)
    setIsVisible(false)
    onConsentChange?.(newConsent)
  }

  const handleSavePreferences = () => {
    saveConsent(consent)
    updateGoogleConsent(consent)
    setIsVisible(false)
    setShowSettings(false)
    onConsentChange?.(consent)
  }

  const toggleConsent = (type: ConsentType) => {
    if (type === 'essential') return // Essential cookies cannot be disabled
    setConsent(prev => ({ ...prev, [type]: !prev[type] }))
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gray-800 border-t border-gray-700 shadow-lg">
      <div className="max-w-6xl mx-auto">
        {!showSettings ? (
          // Simple banner view
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1 text-gray-300 text-sm">
              <p className="mb-2">
                <strong className="text-white">We value your privacy.</strong>
              </p>
              <p>
                We use cookies to enhance your browsing experience, serve
                personalized ads or content, and analyze our traffic. By
                clicking &quot;Accept All&quot;, you consent to our use of
                cookies.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                type="button"
                onClick={handleAcceptEssential}
                className="px-4 py-2 text-sm text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 text-sm text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 transition"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          // Detailed settings view
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-white">
                Cookie Preferences
              </h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Close settings"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-300 mb-4">
              <div className="flex items-start justify-between p-3 bg-gray-700 rounded">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    Essential Cookies
                  </h3>
                  <p className="text-xs">
                    Required for the website to function properly. Cannot be
                    disabled.
                  </p>
                </div>
                <div className="ml-4 text-gray-400 text-xs">Always Active</div>
              </div>

              <div className="flex items-start justify-between p-3 bg-gray-700 rounded">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    Analytics Cookies
                  </h3>
                  <p className="text-xs">
                    Help us understand how visitors interact with our website by
                    collecting and reporting information anonymously.
                  </p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    id="analytics-consent"
                    checked={consent.analytics}
                    onChange={() => toggleConsent('analytics')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500" />
                </div>
              </div>

              <div className="flex items-start justify-between p-3 bg-gray-700 rounded">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    Advertising Cookies
                  </h3>
                  <p className="text-xs">
                    Used to deliver advertisements that are relevant to you and
                    your interests.
                  </p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    id="ads-consent"
                    checked={consent.ads}
                    onChange={() => toggleConsent('ads')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 transition"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Export types and utilities
export { parseConsentCookie, saveConsent }
export type { ConsentState }
