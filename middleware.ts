import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-edge';

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register|.*\\..*).*)'],
};

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Allow access to auth pages without token
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (token) {
      try {
        const payload = await verifyToken(token);
        if (payload.role === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        } else if (payload.role === 'contractor') {
          return NextResponse.redirect(new URL('/contractor/dashboard', request.url));
        } else {
          return NextResponse.redirect(new URL('/client/dashboard', request.url));
        }
      } catch (error) {
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = await verifyToken(token);

    // Admin routes
    if (pathname.startsWith('/admin') && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Client routes
    if (pathname.startsWith('/client') && payload.role !== 'client') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Contractor routes
    if (pathname.startsWith('/contractor') && payload.role !== 'contractor') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();

  } catch (error) {
    console.error('Middleware token verification failed:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}
