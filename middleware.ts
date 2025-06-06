import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/signup',
    '/signup-success',
    '/auth/callback',
    '/pending-approval'
  ];
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    req.nextUrl.pathname === route || 
    req.nextUrl.pathname.startsWith('/public/') ||
    req.nextUrl.pathname.startsWith('/auth/callback')
  );

  // Allow access to public routes without authentication
  if (isPublicRoute) {
    return res;
  }

  // If user is not signed in and trying to access a protected route
  if (!session) {
    const redirectUrl = new URL('/auth/signin', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is signed in
  if (session) {
    try {
      // Get the user's approval status
      const { data: userData, error } = await supabase
        .from('users')
        .select('is_approved, role')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return res;
      }

      // If user exists and is not approved
      if (userData && !userData.is_approved) {
        // Allow access to the pending approval page and signout
        if (['/pending-approval', '/auth/signout'].includes(req.nextUrl.pathname)) {
          return res;
        }
        // Redirect to pending approval page for all other routes
        return NextResponse.redirect(new URL('/pending-approval', req.url));
      }

      // If user is approved and trying to access pending approval page, redirect to dashboard
      if (userData?.is_approved && req.nextUrl.pathname === '/pending-approval') {
        const dashboardPath = userData.role === 'admin' ? '/admin/dashboard' : 
                            userData.role === 'alumni' ? '/alumni/dashboard' : 
                            '/student/dashboard';
        return NextResponse.redirect(new URL(dashboardPath, req.url));
      }

      // If user is approved and accessing auth pages, redirect to appropriate dashboard
      if (userData?.is_approved && ['/auth/signin', '/auth/signup', '/signup'].includes(req.nextUrl.pathname)) {
        const dashboardPath = userData.role === 'admin' ? '/admin/dashboard' : 
                            userData.role === 'alumni' ? '/alumni/dashboard' : 
                            '/student/dashboard';
        return NextResponse.redirect(new URL(dashboardPath, req.url));
      }

      // Role-based access control
      if (userData?.is_approved) {
        const role = userData.role;
        const path = req.nextUrl.pathname;

        // Check if user is trying to access a route they don't have permission for
        if (
          (role === 'student' && path.startsWith('/admin/')) ||
          (role === 'alumni' && (path.startsWith('/admin/') || path.startsWith('/student/'))) ||
          (role === 'admin' && false) // Admin has access to everything
        ) {
          return NextResponse.redirect(new URL('/', req.url));
        }
      }
    } catch (error) {
      console.error('Middleware error:', error);
      return res;
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};