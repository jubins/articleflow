import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname

    // Allow public routes to pass through without checks
    // This prevents issues if middleware accidentally runs on excluded routes
    if (pathname === '/' || pathname === '/pricing') {
      return NextResponse.next()
    }

    // Check for required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing required Supabase environment variables')
      console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING')
      console.error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? 'SET' : 'MISSING')

      // Only redirect to login if we're on a protected route
      // Avoid redirecting login/signup to prevent loops
      if (!pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // For login/signup pages, let them through even without env vars
      // The page will handle showing appropriate errors
      return NextResponse.next()
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

    // Refresh session if expired - wrap in try-catch for safety
    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch (authError) {
      console.error('Auth error in middleware:', authError)
      // Continue without user authentication on error
    }

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
  } catch (error) {
    // Catch any unexpected errors to prevent middleware from crashing
    console.error('Middleware error:', error)
    // Allow the request to proceed on error to avoid blocking the site
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     * - api routes (handled separately)
     * - static files (_next/static)
     * - image optimization (_next/image)
     * - favicon, images, etc
     * - public routes (/, /pricing)
     *
     * Then filter in code to only process auth/protected routes
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
