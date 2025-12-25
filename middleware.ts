import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing required Supabase environment variables')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING')
    console.error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? 'SET' : 'MISSING')

    // Redirect to a configuration error page or show a message
    // For now, we'll just block access to protected routes
    return NextResponse.redirect(new URL('/login', request.url))
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes - redirect to login if not authenticated
  if (!user && (
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/generate') ||
    request.nextUrl.pathname.startsWith('/history') ||
    request.nextUrl.pathname.startsWith('/settings')
  )) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is logged in and tries to access login/signup, redirect to dashboard
  if (user && (
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')
  )) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match only protected routes and auth routes:
     * - /dashboard/*
     * - /generate/*
     * - /articles/*
     * - /profile/*
     * - /integrations/*
     * - /settings/*
     * - /login
     * - /signup
     */
    '/dashboard/:path*',
    '/generate/:path*',
    '/articles/:path*',
    '/profile/:path*',
    '/integrations/:path*',
    '/settings/:path*',
    '/login',
    '/signup',
  ],
}
