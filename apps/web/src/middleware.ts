import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Rate limiting configuration
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto em ms
const MAX_ADMIN_API_REQUESTS = 50; // 50 requisições/minuto para admin APIs
const MAX_PUBLIC_API_REQUESTS = 100; // 100 requisições/minuto para APIs públicas
const IP_BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos em ms

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

function checkRateLimit(identifier: string, maxRequests: number): RateLimitResult {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const isAdminAPI = pathname.startsWith('/api/admin/');
    const maxRequests = isAdminAPI ? MAX_ADMIN_API_REQUESTS : MAX_PUBLIC_API_REQUESTS;
    
    const rateLimit = checkRateLimit(ip, maxRequests);
    
    if (!rateLimit.allowed) {
      // Log rate limit violation as security event
      console.warn(`[RATE_LIMIT] IP ${ip} exceeded rate limit on ${pathname}`);
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests', 
          message: 'Rate limit exceeded. Please try again later.',
          resetTime: new Date(rateLimit.resetTime).toISOString()
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: CookieOptions;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Add rate limit headers to response
  if (pathname.startsWith('/api/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const isAdminAPI = pathname.startsWith('/api/admin/');
    const maxRequests = isAdminAPI ? MAX_ADMIN_API_REQUESTS : MAX_PUBLIC_API_REQUESTS;
    const record = rateLimitMap.get(ip);
    
    if (record) {
      supabaseResponse.headers.set('X-RateLimit-Limit', maxRequests.toString());
      supabaseResponse.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString());
      supabaseResponse.headers.set('X-RateLimit-Reset', record.resetTime.toString());
    }
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/auth/callback', '/assessment', '/jobs', '/onboarding', '/invite'];
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/assessment') ||
    pathname.startsWith('/jobs/') ||
    pathname.startsWith('/invite')
  );

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If authenticated, handle route protection
  if (user) {
    // Get user_type from user metadata (canonical model)
    const userType = user.user_metadata?.user_type || 'candidate';
    
    console.log('[MIDDLEWARE] User:', user.email, '| Metadata user_type:', user.user_metadata?.user_type, '| Final userType:', userType);

    // Redirect authenticated users away from auth pages
    if (pathname === '/login' || pathname === '/register') {
      const url = request.nextUrl.clone();
      // Redirect based on user type
      if (userType === 'admin') {
        console.log('[MIDDLEWARE] Redirecionando admin para /admin');
        url.pathname = '/admin';
      } else if (userType === 'recruiter') {
        console.log('[MIDDLEWARE] Redirecionando recrutador para /dashboard');
        url.pathname = '/dashboard';
      } else {
        console.log('[MIDDLEWARE] Redirecionando candidato para /candidate');
        url.pathname = '/candidate';
      }
      return NextResponse.redirect(url);
    }

    // Protect admin routes - only allow access for admin users
    if (pathname.startsWith('/admin')) {
      if (userType !== 'admin') {
        console.log('[MIDDLEWARE] Bloqueando acesso não-admin a área administrativa');
        const url = request.nextUrl.clone();
        url.pathname = userType === 'recruiter' ? '/dashboard' : '/candidate';
        return NextResponse.redirect(url);
      }
    }

    // Protect recruiter routes - allow recruiter and admin
    if (pathname.startsWith('/dashboard')) {
      if (userType !== 'recruiter' && userType !== 'admin') {
        console.log('[MIDDLEWARE] Bloqueando acesso de candidato a área do recrutador');
        const url = request.nextUrl.clone();
        url.pathname = '/candidate';
        return NextResponse.redirect(url);
      }
    }

    // Protect candidate routes - only allow access for candidate users
    if (pathname.startsWith('/candidate') || pathname.startsWith('/cadastro')) {
      if (userType === 'recruiter' || userType === 'admin') {
        console.log('[MIDDLEWARE] Bloqueando acesso de recrutador/admin a área do candidato');
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
