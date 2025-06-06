import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(new URL('/auth/signin?error=auth_callback_error', requestUrl.origin));
      }

      // Get the user's session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Check if the user already exists in our users table
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('is_approved, role')
          .eq('id', session.user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Error checking user:', userError);
        }

        if (!existingUser) {
          // This shouldn't happen with the new signup flow, but handle it just in case
          console.log('User not found in users table, this should not happen with new signup flow');
          return NextResponse.redirect(new URL('/auth/signin?error=user_not_found', requestUrl.origin));
        }

        // Check if user is approved
        if (existingUser.is_approved) {
          // Redirect approved users to their dashboard
          const dashboardPath = existingUser.role === 'admin' 
            ? '/admin/dashboard' 
            : existingUser.role === 'alumni'
            ? '/alumni/dashboard'
            : '/student/dashboard';
          return NextResponse.redirect(new URL(dashboardPath, requestUrl.origin));
        } else {
          // Redirect unapproved users to pending approval page
          return NextResponse.redirect(new URL('/pending-approval', requestUrl.origin));
        }
      }
    } catch (error) {
      console.error('Unexpected error in auth callback:', error);
      return NextResponse.redirect(new URL('/auth/signin?error=unexpected_error', requestUrl.origin));
    }
  }

  // Redirect to sign in page if there's no code or session
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin));
}