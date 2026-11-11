import { NextRequest, NextResponse } from 'next/server';
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname === '/' ||
    (!/^\/(az|en)(\/|$)/.test(pathname) &&
      !pathname.startsWith('/_next') &&
      !pathname.includes('.'))
  ) {
    const url = request.nextUrl.clone();
    const locale = request.cookies.get('level-up.locale')?.value === 'az' ? 'az' : 'en';
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = {
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|opengraph-image).*)',
  ],
};
