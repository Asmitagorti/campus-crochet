import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const development = process.env.NODE_ENV === "development";
  const policy = [
    "default-src 'self'",
    // Next's streaming scripts and dynamically loaded SDK scripts inherit trust.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://checkout.razorpay.com https://*.razorpay.com https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com${development ? " 'unsafe-eval'" : ""}`,
    // Motion and Razorpay use inline style attributes for layout and animation.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mmojefxcwayyrxkpenlf.supabase.co"} https://*.googleusercontent.com https://*.razorpay.com https://*.google-analytics.com`,
    "font-src 'self'",
    `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mmojefxcwayyrxkpenlf.supabase.co"} https://*.razorpay.com https://*.google-analytics.com${development ? " ws: wss:" : ""}`,
    "frame-src https://accounts.google.com https://*.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(!development ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
  const headers = new Headers(request.headers);
  // Overwrite caller-supplied values so a request cannot choose its own nonce.
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: [
    "/((?!api(?:/|$)|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|images/).*)",
  ],
};
