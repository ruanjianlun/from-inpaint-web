// Google Configuration
// Fill in your Google Analytics and AdSense IDs here via environment variables
// Add these to your .env file:
// VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
// VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX

export const googleConfig = {
  // Google Analytics Configuration
  analytics: {
    measurementId:
      import.meta.env.VITE_GA_MEASUREMENT_ID ||
      (import.meta.env.REACT_APP_GA_MEASUREMENT_ID as string) ||
      'G-XE2HGPPW4V', // Default measurement ID
    // Enable/disable Google Analytics
    enabled: true,
  },

  // Google AdSense Configuration
  adsense: {
    clientId:
      import.meta.env.VITE_ADSENSE_CLIENT_ID ||
      (import.meta.env.REACT_APP_ADSENSE_CLIENT_ID as string) ||
      '',
    // Enable/disable Google AdSense
    enabled: !!(
      import.meta.env.VITE_ADSENSE_CLIENT_ID ||
      import.meta.env.REACT_APP_ADSENSE_CLIENT_ID
    ),
  },
}

// Cookie consent settings
export const cookieConsentConfig = {
  // Cookie name for storing consent
  cookieName: 'eraserly_cookie_consent',

  // Cookie expiry in days (365 days = 1 year)
  cookieExpiryDays: 365,
}
