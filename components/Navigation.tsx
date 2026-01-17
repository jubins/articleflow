'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ProfileDropdown } from '@/components/ProfileDropdown'

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="ArticleFlow" width={32} height={32} className="h-8 w-8" />
              <span className="text-2xl font-bold text-blue-600">ArticleFlow</span>
            </Link>
          </div>
          <div className="flex items-center">
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </nav>
  )
}
