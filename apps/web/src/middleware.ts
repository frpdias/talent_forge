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
    // Get user profile to check user type
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    // Get user_type from profile or user metadata
    const userType = profile?.user_type || user.user_metadata?.user_type || 'candidate';
    
    console.log('[MIDDLEWARE] User:', user.email, '| Profile user_type:', profile?.user_type, '| Metadata user_type:', user.user_metadata?.user_type, '| Final userType:', userType);

    // Redirect authenticated users away from auth pages
    if (pathname === '/login' || pathname === '/register') {
      const url = request.nextUrl.clone();
      // Redirect based on user type
      if (userType === 'recruiter' || userType === 'admin') {
        console.log('[MIDDLEWARE] Redirecionando recrutador/admin para /dashboard');
        url.pathname = '/dashboard';
      } else {
        console.log('[MIDDLEWARE] Redirecionando candidato para /candidate');
        url.pathname = '/candidate';
      }
      return NextResponse.redirect(url);
    }

    // Protect recruiter/admin routes - only allow access for recruiter/admin users
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      if (userType !== 'recruiter' && userType !== 'admin') {
        console.log('[MIDDLEWARE] Bloqueando acesso de candidato a área administrativa');
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
