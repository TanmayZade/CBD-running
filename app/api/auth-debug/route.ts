import { NextResponse } from "next/server"
import { cookies, headers } from "next/headers"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()
    const cookieStore = cookies()
    const headersList = headers()

    // Get all cookies
    const allCookies = cookieStore.getAll()
    const cookieNames = allCookies.map((c) => c.name)

    // Check for auth cookies
    const authCookies = cookieNames.filter(
      (name) => name.includes("supabase") || name.includes("sb-") || name.includes("auth"),
    )

    // Try to get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cookies: {
        count: cookieNames.length,
        names: cookieNames,
        authRelated: authCookies,
      },
      headers: {
        userAgent: headersList.get("user-agent"),
        host: headersList.get("host"),
        referer: headersList.get("referer"),
      },
      session: {
        exists: !!sessionData?.session,
        error: sessionError ? sessionError.message : null,
        user: sessionData?.session?.user
          ? {
              id: sessionData.session.user.id,
              email: sessionData.session.user.email,
            }
          : null,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
