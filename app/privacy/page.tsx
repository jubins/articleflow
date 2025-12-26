'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="ArticleFlow" width={32} height={32} className="h-8 w-8" />
              <span className="text-2xl font-bold text-blue-600">ArticleFlow</span>
            </Link>
            <div className="flex gap-4">
              <Link href="/pricing">
                <Button variant="ghost">Pricing</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Privacy Policy Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: December 26, 2025</p>

        <div className="prose max-w-none">
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                ArticleFlow (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy
                Policy explains how we collect, use, disclose, and safeguard your information when you use our
                AI-powered article generation platform.
              </p>
              <p className="text-gray-700">
                By using ArticleFlow, you agree to the collection and use of information in accordance with
                this policy.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 mb-3">We collect the following personal information:</p>
              <ul className="list-disc ml-6 mb-4 text-gray-700">
                <li>Email address</li>
                <li>Name (optional)</li>
                <li>Profile information (bio, social media handles, website)</li>
                <li>Payment information (processed by third-party payment processors)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 API Keys</h3>
              <p className="text-gray-700 mb-4">
                When you provide your own API keys (Claude, Gemini), we encrypt and securely store them
                to enable article generation on your behalf. We never share or use your API keys for any
                purpose other than generating content for your account.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Generated Content</h3>
              <p className="text-gray-700 mb-4">
                We store articles you generate, including titles, content, metadata, and associated settings.
                This content is private to your account and not shared with other users.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.4 Usage Data</h3>
              <p className="text-gray-700 mb-4">
                We collect information about how you use ArticleFlow, including:
              </p>
              <ul className="list-disc ml-6 mb-4 text-gray-700">
                <li>Pages visited and features used</li>
                <li>Article generation requests and outcomes</li>
                <li>Error logs and performance data</li>
                <li>Browser type and operating system</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-3">We use your information to:</p>
              <ul className="list-disc ml-6 mb-4 text-gray-700">
                <li>Provide and maintain ArticleFlow services</li>
                <li>Generate articles using AI providers on your behalf</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send service-related notifications and updates</li>
                <li>Improve our platform and develop new features</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Third-Party Services</h3>
              <p className="text-gray-700 mb-3">We share data with the following third parties:</p>
              <ul className="list-disc ml-6 mb-4 text-gray-700">
                <li><strong>AI Providers:</strong> We send your prompts to Anthropic (Claude) or Google (Gemini) to generate articles</li>
                <li><strong>Authentication:</strong> Supabase for user authentication and database services</li>
                <li><strong>Google Services:</strong> When you connect Google Docs/Sheets integration</li>
                <li><strong>Payment Processors:</strong> For processing subscription payments</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Legal Requirements</h3>
              <p className="text-gray-700 mb-4">
                We may disclose your information if required by law, court order, or government request,
                or to protect our rights, property, or safety.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-3">We implement security measures including:</p>
              <ul className="list-disc ml-6 mb-4 text-gray-700">
                <li>Encryption of sensitive data (API keys, tokens) at rest and in transit</li>
                <li>Secure authentication using industry standards</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and monitoring</li>
              </ul>
              <p className="text-gray-700">
                However, no method of transmission over the internet is 100% secure. We cannot guarantee
                absolute security but will notify you of any data breaches as required by law.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="text-gray-700 mb-3">You have the right to:</p>
              <ul className="list-disc ml-6 mb-4 text-gray-700">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct your information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Export:</strong> Download your generated articles</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing emails</li>
              </ul>
              <p className="text-gray-700">
                To exercise these rights, contact us at privacy@articleflow.xyz
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your personal information and generated content for as long as your account is active
                or as needed to provide services. If you delete your account, we will delete your data within
                30 days, except where required by law to retain it.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to maintain your session, remember your preferences,
                and analyze platform usage. You can control cookies through your browser settings, but
                disabling them may affect platform functionality.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children&apos;s Privacy</h2>
              <p className="text-gray-700 mb-4">
                ArticleFlow is not intended for users under 18 years of age. We do not knowingly collect
                personal information from children. If we become aware that we have collected data from
                a child, we will delete it promptly.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your information may be transferred to and processed in countries other than your country
                of residence. We ensure appropriate safeguards are in place for such transfers.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of significant
                changes by email or through the platform. Continued use of ArticleFlow after changes
                constitutes acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul className="list-none mb-4 text-gray-700">
                <li><strong>Email:</strong> privacy@articleflow.xyz</li>
                <li><strong>Support:</strong> support@articleflow.xyz</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
