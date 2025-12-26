'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export default function TermsPage() {
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

      {/* Terms of Service Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: December 26, 2025</p>

        <div className="prose max-w-none">
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using ArticleFlow (&quot;the Service&quot;), you accept and agree to be bound by
                these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use
                the Service.
              </p>
              <p className="text-gray-700">
                We reserve the right to modify these Terms at any time. Continued use of the Service after
                changes constitutes acceptance of the modified Terms.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                ArticleFlow is an AI-powered article generation platform that allows users to create technical
                content using Claude (Anthropic) and Gemini (Google AI) APIs. The Service includes:
              </p>
              <ul className="list-disc ml-6 mb-4 text-gray-700">
                <li>AI-powered article generation</li>
                <li>Multiple article types and templates</li>
                <li>Google Docs and Google Sheets integration</li>
                <li>Article editing and export features</li>
                <li>BYOK (Bring Your Own Key) support</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Account Registration</h3>
              <p className="text-gray-700 mb-4">
                To use certain features, you must register for an account. You agree to:
              </p>
              <ul className="list-disc ml-6 mb-4 text-gray-700">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information</li>
                <li>Keep your password secure and confidential</li>
                <li>Be responsible for all activities under your account</li>
                <li>Notify us immediately of unauthorized access</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Account Eligibility</h3>
              <p className="text-gray-700 mb-4">
                You must be at least 18 years old to use ArticleFlow. By using the Service, you represent
                that you meet this requirement.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Subscription Plans and Billing</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Pricing</h3>
              <p className="text-gray-700 mb-4">
                ArticleFlow offers multiple subscription tiers: Free, Starter ($15/month), Pro ($39/month),
                and Business ($99/month). Pricing is subject to change with 30 days notice.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Payment</h3>
              <p className="text-gray-700 mb-4">
                Paid subscriptions are billed monthly in advance. You authorize us to charge your payment
                method on a recurring basis. Failure to pay may result in service suspension.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Cancellation and Refunds</h3>
              <p className="text-gray-700 mb-4">
                You may cancel your subscription at any time from your account settings. Cancellations
                take effect at the end of the current billing period. We do not offer prorated refunds
                for partial months.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.4 BYOK (Bring Your Own Key)</h3>
              <p className="text-gray-700 mb-4">
                When using your own API keys, you are responsible for all costs charged by AI providers
                (Anthropic, Google). ArticleFlow is not liable for these charges.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Permitted Use</h3>
              <p className="text-gray-700 mb-4">
                You may use ArticleFlow to generate technical and educational content for lawful purposes.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Prohibited Use</h3>
              <p className="text-gray-700 mb-3">You agree NOT to:</p>
              <ul className="list-disc ml-6 mb-4 text-gray-700">
                <li>Generate illegal, harmful, or offensive content</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Spread misinformation or engage in fraud</li>
                <li>Attempt to hack, disrupt, or abuse the Service</li>
                <li>Share your account with unauthorized users</li>
                <li>Resell or redistribute the Service without permission</li>
                <li>Scrape or extract data using automated tools</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Content Ownership and License</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Your Content</h3>
              <p className="text-gray-700 mb-4">
                You retain all rights to content you generate using ArticleFlow. We do not claim ownership
                of your articles, prompts, or generated content.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 License to ArticleFlow</h3>
              <p className="text-gray-700 mb-4">
                You grant us a limited license to store, process, and display your content solely to
                provide the Service. This license terminates when you delete content or your account.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.3 AI-Generated Content</h3>
              <p className="text-gray-700 mb-4">
                AI-generated content may not be eligible for copyright protection. You are responsible
                for verifying the accuracy and originality of generated content before publication.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Third-Party Services</h2>
              <p className="text-gray-700 mb-4">
                ArticleFlow integrates with third-party services (Anthropic, Google, Supabase). Your use
                of these services is subject to their respective terms and policies. We are not responsible
                for third-party service availability, performance, or changes.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimer of Warranties</h2>
              <p className="text-gray-700 mb-4">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE:
              </p>
              <ul className="list-disc ml-6 mb-4 text-gray-700">
                <li>Uninterrupted or error-free operation</li>
                <li>Accuracy or quality of AI-generated content</li>
                <li>Compatibility with your specific needs</li>
                <li>Data security or prevention of unauthorized access</li>
              </ul>
              <p className="text-gray-700">
                You use the Service at your own risk.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ARTICLEFLOW AND ITS AFFILIATES SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc ml-6 mb-4 text-gray-700">
                <li>Indirect, incidental, or consequential damages</li>
                <li>Loss of data, profits, or business opportunities</li>
                <li>Damages exceeding the amount paid in the last 12 months</li>
                <li>Issues caused by third-party services or API providers</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You agree to indemnify and hold ArticleFlow harmless from any claims, damages, or expenses
                arising from:
              </p>
              <ul className="list-disc ml-6 mb-4 text-gray-700">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any laws or third-party rights</li>
                <li>Content you generate or publish</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to suspend or terminate your account at any time for:
              </p>
              <ul className="list-disc ml-6 mb-4 text-gray-700">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Non-payment of subscription fees</li>
                <li>Abuse or misuse of the Service</li>
              </ul>
              <p className="text-gray-700">
                You may terminate your account at any time from account settings. Upon termination,
                you will lose access to the Service and your data may be deleted.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These Terms are governed by the laws of the United States. Any disputes will be resolved
                in the courts of [Your Jurisdiction].
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We may update these Terms from time to time. Material changes will be communicated via
                email or platform notification. Continued use after changes constitutes acceptance.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For questions about these Terms, please contact us:
              </p>
              <ul className="list-none mb-4 text-gray-700">
                <li><strong>Email:</strong> legal@articleflow.xyz</li>
                <li><strong>Support:</strong> support@articleflow.xyz</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <p className="text-gray-700 text-center">
                By using ArticleFlow, you acknowledge that you have read, understood, and agree to be
                bound by these Terms of Service.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
