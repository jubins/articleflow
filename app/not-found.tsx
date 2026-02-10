import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            <h1 className="text-[150px] sm:text-[200px] font-bold text-gray-200 leading-none select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-32 h-32 sm:w-40 sm:h-40 text-blue-500 opacity-80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Oops! The page you&apos;re looking for doesn&apos;t exist. It might have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/dashboard">
            <Button className="w-full sm:w-auto px-8 py-3 text-base">
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/generate">
            <Button variant="outline" className="w-full sm:w-auto px-8 py-3 text-base">
              Generate Article
            </Button>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/articles" className="text-blue-600 hover:text-blue-800 hover:underline">
              My Articles
            </Link>
            <Link href="/ai-settings" className="text-blue-600 hover:text-blue-800 hover:underline">
              AI Settings
            </Link>
            <Link href="/publishing" className="text-blue-600 hover:text-blue-800 hover:underline">
              Publishing
            </Link>
            <Link href="/docs" className="text-blue-600 hover:text-blue-800 hover:underline">
              Documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
