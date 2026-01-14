# Google Analytics & AdSense Integration with Cookie Consent

This guide explains how to integrate Google Analytics and Google AdSense with GDPR-compliant cookie consent for Eraserly.

## Table of Contents

1. [Overview](#overview)
2. [Google Analytics Integration](#google-analytics-integration)
3. [Google AdSense Integration](#google-adsense-integration)
4. [Complete Implementation](#complete-implementation)
5. [Testing Your Implementation](#testing-your-implementation)

---

## Overview

### Key Principles for GDPR Compliance

1. **Opt-in Consent**: Analytics and advertising cookies must only be enabled after user consent
2. **Easy Withdrawal**: Users must be able to revoke consent at any time
3. **Granular Control**: Different types of cookies (essential, analytics, advertising) should be controllable separately

### Consent States

| State     | Description               | What's Enabled                  |
| --------- | ------------------------- | ------------------------------- |
| `dismiss` | User clicked "Accept All" | Analytics + Advertising cookies |
| `deny`    | User clicked "Decline"    | Only essential cookies          |
| `revoked` | User changed their mind   | Follows new choice              |

---

## Google Analytics Integration

### Step 1: Get Your Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a GA4 property
3. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 2: Install Google Analytics (Tag Method)

Add the following code to your `index.html`, **BEFORE** the closing `</head>` tag:

```html
<!-- Google Analytics (GA4) - Cookie Consent Controlled -->
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
></script>
<script>
  window.dataLayer = window.dataLayer || []

  function gtag() {
    dataLayer.push(arguments)
  }

  // IMPORTANT: Disable GA by default until user consents
  // Replace G-XXXXXXXXXX with your actual Measurement ID
  window['ga-disable-G-XXXXXXXXXX'] = true

  gtag('js', new Date())
  gtag('config', 'G-XXXXXXXXXX', {
    // Don't send pageview until user consents
    send_page_view: false,
  })
</script>
```

### Step 3: Update Cookie Consent Functions

In `index.html`, update the `enableCookies()` and `disableCookies()` functions:

```javascript
function enableCookies() {
  console.log('Cookies enabled by user consent')

  // Enable Google Analytics
  // Replace G-XXXXXXXXXX with your actual Measurement ID
  window['ga-disable-G-XXXXXXXXXX'] = false

  // Send initial pageview now that consent is given
  gtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
  })

  // Enable Google AdSense (see AdSense section below)
  // This will be added when you integrate AdSense
}

function disableCookies() {
  console.log('Cookies disabled by user choice')

  // Disable Google Analytics
  // Replace G-XXXXXXXXXX with your actual Measurement ID
  window['ga-disable-G-XXXXXXXXXX'] = true

  // Disable Google AdSense
  // This will be added when you integrate AdSense
}
```

---

## Google AdSense Integration

### Step 1: Get Your AdSense Code

1. Go to [Google AdSense](https://www.google.com/adsense/)
2. Create an account and add your site (eraserly.qzz.io)
3. Get your **AdSense Publisher ID** (format: `ca-pub-XXXXXXXXXXXXXXXX`)

### Step 2: Add AdSense Code to index.html

Add the following code **AFTER** your existing cookie consent script:

```html
<!-- Google AdSense - Cookie Consent Controlled -->
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
  crossorigin="anonymous"
></script>
<script>
  // Disable personalized ads by default until user consents
  window.adsbygoogle = window.adsbygoogle || []
</script>
```

### Step 3: Create Ad Units

For each ad placement on your site, add:

```html
<!-- Example: Banner Ad -->
<ins
  class="adsbygoogle"
  style="display: block"
  data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
  data-ad-slot="XXXXXXXXXX"
  data-ad-format="auto"
  data-full-width-responsive="true"
></ins>
<script>
  // Note: ads are not loaded until user consents
  // See enableCookies() function below
</script>
```

### Step 4: Update Cookie Consent Functions for AdSense

```javascript
function enableCookies() {
  console.log('Cookies enabled by user consent')

  // Enable Google Analytics
  window['ga-disable-G-XXXXXXXXXX'] = false
  gtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
  })

  // Enable Google AdSense - Load and display ads
  ;(window.adsbygoogle = window.adsbygoogle || []).push({})
  gtag('consent', 'update', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
  })
}

function disableCookies() {
  console.log('Cookies disabled by user choice')

  // Disable Google Analytics
  window['ga-disable-G-XXXXXXXXXX'] = true

  // Disable Google AdSense - Deny ad consent
  gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
}
```

---

## Complete Implementation

### Complete index.html Cookie Consent Section

Here's the complete, production-ready implementation. Replace the placeholder values:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Eraserly</title>

    <!-- ========================================= -->
    <!-- STEP 1: Google Analytics (GA4)           -->
    <!-- ========================================= -->
    <script
      async
      src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
    ></script>
    <script>
      window.dataLayer = window.dataLayer || []
      function gtag() {
        dataLayer.push(arguments)
      }

      // DISABLE GA BY DEFAULT - GDPR COMPLIANT
      window['ga-disable-G-XXXXXXXXXX'] = true

      gtag('js', new Date())

      // Configure consent mode - default to DENIED
      gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        region: [
          'AT',
          'BE',
          'BG',
          'HR',
          'CY',
          'CZ',
          'DK',
          'EE',
          'FI',
          'FR',
          'DE',
          'GR',
          'HU',
          'IS',
          'IE',
          'IT',
          'LV',
          'LT',
          'LU',
          'MT',
          'NL',
          'NO',
          'PL',
          'PT',
          'RO',
          'SK',
          'SI',
          'ES',
          'SE',
          'CH',
          'GB',
          'LI',
        ], // EU/EEA countries + UK
      })

      gtag('config', 'G-XXXXXXXXXX', {
        send_page_view: false,
      })
    </script>

    <!-- Cookie Consent CSS -->
    <link
      rel="stylesheet"
      type="text/css"
      href="https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.css"
    />
    <style>
      .cc-window {
        background: #1f2937 !important;
        color: #e5e7eb !important;
        border: 1px solid #374151 !important;
      }
      .cc-btn {
        background: #3b82f6 !important;
        color: #ffffff !important;
      }
      .cc-btn:hover {
        background: #2563eb !important;
      }
    </style>
  </head>
  <body class="h-screen bg-gray-900">
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root" class="h-full"></div>

    <script type="module" src="/src/index.tsx"></script>

    <!-- ========================================= -->
    <!-- STEP 2: Cookie Consent Banner             -->
    <!-- ========================================= -->
    <script src="https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.js"></script>
    <script>
      // Your Measurement ID and Publisher ID
      const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'
      const ADSENSE_PUBLISHER_ID = 'ca-pub-XXXXXXXXXXXXXXXX'

      window.addEventListener('load', function () {
        window.cookieconsent.initialise({
          palette: {
            popup: { background: '#1f2937', text: '#e5e7eb' },
            button: { background: '#3b82f6', text: '#ffffff' },
          },
          theme: 'edgeless',
          position: 'bottom',
          static: false,
          content: {
            message:
              'We use cookies and similar technologies to enhance your experience, analyze usage, and serve personalized ads. You can read our Privacy Policy in the footer.',
            dismiss: 'Accept All',
            deny: 'Decline',
            link: null,
            href: null,
          },
          onInitialise: function (status) {
            var type = this.options.type
            var didConsent = this.hasConsented()
            if (type == 'opt-in' && didConsent) {
              enableCookies()
            }
          },
          onStatusChange: function (status, chosenBefore) {
            var type = this.options.type
            var didConsent = this.hasConsented()
            if (type == 'opt-in' && didConsent) {
              enableCookies()
            } else {
              disableCookies()
            }
          },
          onRevokeChoice: function () {
            var type = this.options.type
            if (type == 'opt-in') {
              disableCookies()
            }
          },
          type: 'opt-in',
          law: { regionalLaw: true },
          location: true,
          revokable: true,
          expires: 365,
        })
      })

      // ========================================= -->
      // STEP 3: Enable/Disable Functions           -->
      // ========================================= -->

      function enableCookies() {
        console.log('Cookies ENABLED by user consent')

        // Enable Google Analytics
        window['ga-disable-' + GA_MEASUREMENT_ID] = false

        // Send initial pageview
        gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
          send_to: GA_MEASUREMENT_ID,
        })

        // Update Google consent to GRANTED
        gtag('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
        })

        // Enable AdSense ads (if AdSense is loaded)
        if (window.adsbygoogle) {
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        }

        console.log('Google Analytics and AdSense enabled')
      }

      function disableCookies() {
        console.log('Cookies DISABLED by user choice')

        // Disable Google Analytics
        window['ga-disable-' + GA_MEASUREMENT_ID] = true

        // Update Google consent to DENIED
        gtag('consent', 'update', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        })

        console.log('Google Analytics and AdSense disabled')
      }
    </script>

    <!-- ========================================= -->
    <!-- STEP 4: Google AdSense (Optional)         -->
    <!-- ========================================= -->
    <!-- Uncomment when you have your AdSense account -->
    <!--
    <script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
      crossorigin="anonymous"
    ></script>
    -->
  </body>
</html>
```

---

## Testing Your Implementation

### 1. Test Cookie Consent Banner

Open your website and verify:

- [ ] Cookie banner appears at the bottom
- [ ] "Accept All" button works
- [ ] "Decline" button works
- [ ] Banner remembers your choice for 365 days

### 2. Test Google Analytics

**Enable cookies and check:**

```javascript
// In browser console, after clicking "Accept All":
console.log(window['ga-disable-G-XXXXXXXXXX']) // Should be false
```

**Check network requests:**

- Open Chrome DevTools → Network tab
- Filter by "google-analytics.com"
- Click "Accept All" - you should see requests to `google-analytics.com/g/collect`
- Click "Decline" - no requests should be made

**Real-time test:**

1. Go to Google Analytics → Real-time reports
2. Open your site in an incognito window
3. Accept cookies - you should appear in Real-time
4. Decline cookies - you should NOT appear

### 3. Test Google AdSense

After integrating AdSense:

```javascript
// Check if ads are loaded
document.getElementsByClassName('adsbygoogle').length
```

### 4. Test Consent Revocation

1. Click the cookie consent widget (bottom-right corner after accepting)
2. Change your choice
3. Verify in console that cookies are enabled/disabled accordingly

---

## Summary Checklist

- [ ] Replace `G-XXXXXXXXXX` with your actual Google Analytics Measurement ID
- [ ] Replace `ca-pub-XXXXXXXXXXXXXXXX` with your actual AdSense Publisher ID
- [ ] Test cookie banner appears correctly
- [ ] Test Google Analytics with "Accept All"
- [ ] Test Google Analytics is blocked with "Decline"
- [ ] Test AdSense ads show/hide based on consent
- [ ] Test consent revocation works
- [ ] Verify GDPR compliance for EU users

---

## Additional Resources

- [Google Analytics for GDPR](https://support.google.com/analytics/answer/9976101)
- [Google AdSense and Cookie Consent](https://support.google.com/adsense/answer/9036326)
- [Google Consent Mode](https://developers.google.com/tag-platform/security/guides/consent)
- [GDPR Compliance Guide](https://www GDPR.eu/)

---

## Need Help?

If you encounter issues:

1. Check browser console for errors
2. Verify your Measurement ID is correct
3. Clear browser cookies and test again
4. Check Google Analytics Real-time reports
