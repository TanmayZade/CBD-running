import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // For now, we'll disable complex middleware logic
  // and just let the client-side auth handle most redirects
  return NextResponse.next()
}

// Disable middleware for now
export const config = {
  matcher: ["/api/auth-only-routes"],
}
