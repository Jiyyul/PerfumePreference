import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';

  // OAuth provider error (e.g. user cancelled)
  const error = url.searchParams.get('error');
  if (error) {
    return NextResponse.redirect(new URL('/login', url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login', url.origin));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(new URL('/login', url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

