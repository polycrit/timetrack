import { auth } from "@/lib/auth";

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/signup");
  const isAuthApi = nextUrl.pathname.startsWith("/api/auth");
  const isVerificationPage =
    nextUrl.pathname.startsWith("/verify-email") ||
    nextUrl.pathname.startsWith("/check-email");

  if (isAuthApi) return;
  if (isVerificationPage) return;

  if (isAuthPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/", nextUrl));
    }
    return;
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl));
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
