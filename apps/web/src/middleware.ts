import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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

  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/auth/callback', '/assessment', '/jobs', '/onboarding'];
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/assessment') ||
    pathname.startsWith('/jobs/')
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
