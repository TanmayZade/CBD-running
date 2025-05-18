import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Check if we can connect to Supabase
    const { data, error } = await supabase.from("profiles").select("count()", { count: "exact" }).limit(1)

    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
      APP_URL: process.env.NEXT_PUBLIC_APP_URL || "Not set",
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      supabase: {
        connected: !error,
        error: error ? error.message : null,
        count: data ? data[0].count : null,
      },
      environment: envCheck,
    })
  } catch (error: any) {
    console.error("Health check error:", error)
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
