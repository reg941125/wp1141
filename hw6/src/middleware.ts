import { NextResponse, type NextRequest } from "next/server";

const ADMIN_MATCHERS = [/^\/admin(?:\/|$)/, /^\/api\/admin(?:\/|$)/];

const decodeBasicAuth = (header: string) => {
  const value = header.replace(/^Basic\s+/i, "");
  try {
    if (typeof atob === "function") {
      return atob(value);
    }
    return "";
  } catch {
    return "";
  }
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const needsAuth = ADMIN_MATCHERS.some((regex) => regex.test(pathname));
  if (!needsAuth) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
      },
    );
  }

  const decoded = decodeBasicAuth(authHeader);
  const [username, password] = decoded.split(":");
  const ADMIN_BASIC_AUTH_USER = process.env.ADMIN_BASIC_AUTH_USER ?? "";
  const ADMIN_BASIC_AUTH_PASS = process.env.ADMIN_BASIC_AUTH_PASS ?? "";

  if (
    username === ADMIN_BASIC_AUTH_USER &&
    password === ADMIN_BASIC_AUTH_PASS
  ) {
    return NextResponse.next();
  }

  return NextResponse.json(
    { error: "Unauthorized" },
    {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
    },
  );
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

