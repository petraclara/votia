import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  if (path.startsWith("/admin")) {
    if (!token) {
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(login);
    }
    if (token.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  if (path.startsWith("/dashboard")) {
    if (!token) {
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(login);
    }
    if (token.role !== "ORGANIZER" && token.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/admin", "/admin/:path*"],
};
