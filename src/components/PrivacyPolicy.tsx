interface PrivacyPolicyProps {
  onClose: () => void
}

const domain = 'eraserly.qzz.io'

export default function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-800 text-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-400">Privacy Policy</h1>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-gray-300">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              Effective Date: January 14, 2026
            </h2>
            <p>
              This Privacy Policy describes how Eraserly ({' '}
              <a
                href={`https://${domain}`}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                {domain}
              </a>
              ) collects, uses, and protects your information when you use our
              image editing service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              1. Information We Collect
            </h2>
            <h3 className="text-md font-medium text-white mb-1">
              1.1 Information You Provide
            </h3>
            <p className="mb-3">
              Eraserly is a client-side only application. When you use our
              service:
            </p>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li>
                Images you upload are processed locally in your browser using
                WebGPU and WebAssembly technologies
              </li>
              <li>
                Your images are <strong>never uploaded to our servers</strong>
              </li>
              <li>All image processing happens entirely on your device</li>
            </ul>

            <h3 className="text-md font-medium text-white mb-1">
              1.2 Automatically Collected Information
            </h3>
            <p className="mb-3">
              We and our service providers may collect certain information
              automatically, including:
            </p>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li>
                <strong>Log Data:</strong> Server logs including IP address,
                browser type, referring/exit pages, and timestamps
              </li>
              <li>
                <strong>Device Information:</strong> Browser type, operating
                system, and device identifiers
              </li>
              <li>
                <strong>Usage Data:</strong> Pages viewed, features used, and
                time spent on the service
              </li>
            </ul>

            <h3 className="text-md font-medium text-white mb-1">
              1.3 Cookies and Tracking Technologies
            </h3>
            <p className="mb-3">
              We use cookies and similar tracking technologies to collect and
              track information about your browsing activities:
            </p>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li>
                <strong>Essential Cookies:</strong> Required for the service to
                function properly
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand how users
                interact with our service
              </li>
              <li>
                <strong>Advertising Cookies:</strong> Used to deliver relevant
                advertisements through Google AdSense
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              2. Google AdSense and Third-Party Advertising
            </h2>
            <p className="mb-3">
              Eraserly uses Google AdSense to display advertisements. Google may
              use cookies to serve ads based on your prior visits to this
              website or other websites.
            </p>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li>
                Google&apos;s use of advertising cookies enables it and its
                partners to serve ads to you based on your visits to this site
                and/or other sites on the Internet
              </li>
              <li>
                You may opt out of personalized advertising by visiting{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  className="text-blue-400 hover:text-blue-300 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Ads Settings
                </a>
              </li>
              <li>
                You can disable cookies through your browser settings, but this
                may affect the functionality of the website
              </li>
            </ul>
            <p>
              For more information on Google AdSense, please visit:{' '}
              <a
                href="https://policies.google.com/technologies/ads"
                className="text-blue-400 hover:text-blue-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Advertising Policies
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              3. Google Analytics
            </h2>
            <p className="mb-3">
              We may use Google Analytics to analyze how visitors use our
              website. Google Analytics uses cookies to collect information such
              as how often users visit the site, what pages they visit, and what
              other sites they use prior to coming to this site.
            </p>
            <p>
              Google Analytics data is processed in accordance with
              Google&apos;s{' '}
              <a
                href="https://policies.google.com/privacy"
                className="text-blue-400 hover:text-blue-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              . You can opt out of Google Analytics by installing the{' '}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                className="text-blue-400 hover:text-blue-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Analytics Opt-out Browser Add-on
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              4. Data Sharing and Disclosure
            </h2>
            <p className="mb-3">
              We do not sell, trade, or rent your personal identification
              information to others. We may share generic aggregated demographic
              information not linked to any personal identification information
              with our business partners, trusted affiliates, and advertisers.
            </p>
            <p className="mb-3">We may share your information with:</p>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li>
                <strong>Service Providers:</strong> Third-party companies that
                perform services on our behalf (e.g., Google AdSense, Google
                Analytics)
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to
                protect our rights, property, or safety
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with any
                merger, sale of company assets, or acquisition
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              5. Data Security
            </h2>
            <p>
              We implement appropriate technical and organizational security
              measures to protect your personal information against unauthorized
              or unlawful processing, accidental loss, destruction, or damage.
              However, no method of transmission over the Internet is 100%
              secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              6. Your Privacy Rights (GDPR & CCPA)
            </h2>
            <p className="mb-3">
              Depending on your location, you may have certain rights regarding
              your personal information:
            </p>
            <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Rectification:</strong> Correct inaccurate or incomplete
                data
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your personal
                data
              </li>
              <li>
                <strong>Objection:</strong> Object to processing of your data
              </li>
              <li>
                <strong>Restriction:</strong> Request restriction of data
                processing
              </li>
              <li>
                <strong>Data Portability:</strong> Request transfer of your data
              </li>
              <li>
                <strong>Opt-out:</strong> Opt-out of the sale of personal
                information (CCPA)
              </li>
            </ul>
            <p>
              To exercise these rights, please contact us at{' '}
              <a
                href="mailto:zhaozed888@gmail.com"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                zhaozed888@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              7. Data Retention
            </h2>
            <p>
              Since all image processing occurs client-side, we do not retain
              your images or any image data. Log data and analytics data is
              retained for as long as necessary for the purposes outlined in
              this policy, typically up to 26 months.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              8. Children&apos;s Privacy
            </h2>
            <p>
              Our service is not directed to children under the age of 16. We do
              not knowingly collect personal information from children under 16.
              If you are a parent or guardian and believe your child has
              provided us with personal information, please contact us, and we
              will delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              9. International Data Transfers
            </h2>
            <p>
              Your information may be transferred to and processed in countries
              other than your own. We ensure that appropriate safeguards are in
              place to protect your data in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              10. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on
              this page and updating the &quot;Effective Date&quot; above. You
              are advised to review this Privacy Policy periodically for any
              changes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">
              11. Contact Us
            </h2>
            <p className="mb-3">
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact us:
            </p>
            <ul className="list-none space-y-1 ml-4">
              <li>
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:zhaozed888@gmail.com"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  zhaozed888@gmail.com
                </a>
              </li>
              <li>
                <strong>Website:</strong>{' '}
                <a
                  href={`https://${domain}`}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  {domain}
                </a>
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition duration-200"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  )
}
